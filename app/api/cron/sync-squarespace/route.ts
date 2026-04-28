/**
 * Cron Job: Sync Squarespace Profiles → Portal
 *
 * Polls the Squarespace Profiles API for new subscribers/form submitters
 * and creates preview portal accounts, entering them into the nurture sequence.
 *
 * Runs every 4 hours via Vercel Cron.
 *
 * Squarespace has no Forms API or form_submission webhook topic,
 * so polling Profiles is the only reliable integration path.
 */

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createUser, findUserByEmail } from '@/lib/users'
import { generateMagicLinkJWT } from '@/lib/magic-link-jwt'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { sql } from '@/lib/db'

export const maxDuration = 60

function redact(e: string) { return e.length > 3 ? e.slice(0, 3) + '***' : '***' }

const SQUARESPACE_API_BASE = 'https://api.squarespace.com/1.0'

interface SquarespaceProfile {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  createdOn: string
  hasAccount: boolean
  isCustomer: boolean
  acceptsMarketing: boolean
}

interface ProfilesResponse {
  profiles: SquarespaceProfile[]
  pagination: {
    nextPageUrl: string | null
    nextPageCursor: string | null
    hasNextPage: boolean
  }
}

export async function GET(request: Request) {
  try {
    // Accept CRON_SECRET (Vercel cron) or x-admin-key header
    const url = new URL(request.url)
    const authHeader = request.headers.get('authorization')
    const adminKey = request.headers.get('x-admin-key')
    const cronSecret = process.env.CRON_SECRET
    const adminApiKey = process.env.ADMIN_API_KEY

    let authorized = false
    if (cronSecret && authHeader) {
      const expected = `Bearer ${cronSecret}`
      if (authHeader.length === expected.length && crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) {
        authorized = true
      }
    }
    if (!authorized && adminApiKey && adminKey) {
      try {
        authorized = adminKey.length === adminApiKey.length && crypto.timingSafeEqual(Buffer.from(adminKey), Buffer.from(adminApiKey))
      } catch { authorized = false }
    }
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // DB health check with retry (handles Neon cold starts)
    let dbReady = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await sql`SELECT 1`
        dbReady = true
        break
      } catch (dbErr) {
        const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr)
        console.warn(`[SS Sync] DB connect attempt ${attempt}/3 failed: ${errMsg}`)
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 2000 * attempt))
        }
      }
    }
    if (!dbReady) {
      console.error('[SS Sync] Database connection failed after 3 attempts')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const apiKey = process.env.SQUARESPACE_API_KEY
    if (!apiKey) {
      console.error('[SS Sync] SQUARESPACE_API_KEY not configured')
      return NextResponse.json({ error: 'SQUARESPACE_API_KEY not configured' }, { status: 500 })
    }

    // Test mode: just verify Squarespace API connectivity
    if (url.searchParams.get('test') === '1') {
      try {
        const testUrl = `${SQUARESPACE_API_BASE}/profiles?sortField=createdOn&sortDirection=dsc`
        const testResp = await fetch(testUrl, {
          headers: { 'Authorization': `Bearer ${apiKey}`, 'User-Agent': 'ConcussionPro-Portal/1.0' },
          signal: AbortSignal.timeout(10000),
        })
        if (!testResp.ok) {
          const errText = await testResp.text()
          return NextResponse.json({ test: 'fail', status: testResp.status, error: errText.slice(0, 500) })
        }
        const testData = await testResp.json()
        const { rows: userCount } = await sql`SELECT COUNT(*) as n FROM users WHERE signup_source = 'squarespace'`
        return NextResponse.json({
          test: 'pass',
          profileCount: testData.profiles?.length ?? 0,
          firstProfile: testData.profiles?.[0] ? { createdOn: testData.profiles[0].createdOn } : null,
          hasNextPage: testData.pagination?.hasNextPage,
          sqUsersInDb: Number(userCount[0].n),
        })
      } catch (err) {
        return NextResponse.json({ test: 'error', detail: String(err) }, { status: 500 })
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    let created = 0
    let skipped = 0
    let emailed = 0
    let errors = 0
    let totalFetched = 0

    // Fetch profiles sorted by createdOn descending (newest first)
    // Stop when we hit profiles older than lookback window or already in our DB
    // Use ?days=N to override default 30-day lookback (e.g. ?days=999 for full history)
    const lookbackDays = Math.min(Number(url.searchParams.get('days')) || 30, 9999)
    let cursor: string | null = null
    let keepGoing = true
    const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)
    // Only email profiles from the last 30 days — older ones are silently imported
    const emailCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    while (keepGoing) {
      const url = cursor
        ? `${SQUARESPACE_API_BASE}/profiles?cursor=${cursor}`
        : `${SQUARESPACE_API_BASE}/profiles?sortField=createdOn&sortDirection=dsc`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'ConcussionPro-Portal/1.0',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[SS Sync] API error ${response.status}: ${errorText}`)

        // Auth failures silently broke the import for ~3 weeks before being
        // noticed (404 contacts ended up in Squarespace but not the portal,
        // never received nurture). Email Zac on every cron auth failure so
        // the next breakage is loud, with dedup so retries don't spam.
        if (response.status === 401 || response.status === 403) {
          try {
            const auditKey = `ss_sync_auth_fail_${new Date().toISOString().slice(0, 10)}` // dedup per day
            const { rowCount } = await sql`
              INSERT INTO email_audit_log (audit_key, sent_at)
              VALUES (${auditKey}, NOW())
              ON CONFLICT (audit_key) DO NOTHING
            `
            if (rowCount && rowCount > 0) {
              await sendEmail({
                to: 'zac@concussion-education-australia.com',
                subject: `[ALERT] Squarespace sync ${response.status} — nurture pipeline broken`,
                html: `<p>The Squarespace sync cron just failed with HTTP ${response.status}. New email subscribers from Squarespace are NOT being imported into the portal users table and therefore are NOT receiving the SCAT Mastery nurture sequence.</p>
                  <p><strong>Likely cause:</strong> Squarespace API key missing the <code>Profiles - Read</code> scope, or the key was revoked.</p>
                  <p><strong>Fix:</strong> Squarespace dashboard → Settings → Developer Tools → API Keys → ensure <code>Profiles</code> permission is granted, then update <code>SQUARESPACE_API_KEY</code> in Vercel env if rotated.</p>
                  <p><strong>Squarespace response:</strong></p>
                  <pre style="background:#f1f5f9;padding:12px;border-radius:6px;font-size:12px;">${escapeHtml(errorText.slice(0, 500))}</pre>
                  <p style="font-size:12px;color:#64748b;">One alert per day. Re-fires tomorrow if still broken.</p>`,
                tags: [{ name: 'type', value: 'admin-alert' }, { name: 'subject', value: 'ss-sync-auth-fail' }],
              })
              console.log('[SS Sync] Sent auth-failure alert to admin')
            }
          } catch (alertErr) {
            console.error('[SS Sync] Alert email failed:', alertErr)
          }
        }

        return NextResponse.json(
          { error: `Squarespace API error: ${response.status}` },
          { status: 502 }
        )
      }

      const data: ProfilesResponse = await response.json()
      totalFetched += data.profiles.length

      // Track how many on this page were already known
      let alreadyKnownOnPage = 0

      for (const profile of data.profiles) {
        if (!profile.email) continue

        const email = profile.email.trim().toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue

        // Stop if profile is older than lookback window
        const profileDate = new Date(profile.createdOn)
        if (profileDate < cutoffDate) {
          keepGoing = false
          break
        }

        // Skip customers (they come through Stripe, not this sync)
        if (profile.isCustomer) {
          skipped++
          continue
        }
        // All non-customer contacts enter the nurture — the legacy
        // Squarespace site is a zero-ad-spend acquisition source, every
        // form-fill is a real lead. List-Unsubscribe handles per-user opt-out.

        // Check if already in portal
        const existing = await findUserByEmail(email)
        if (existing) {
          alreadyKnownOnPage++
          skipped++
          continue
        }

        // New subscriber — create preview account
        const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()
          || email.split('@')[0]

        try {
          const userId = await createUser({
            email,
            name,
            accessLevel: 'preview',
            signupSource: 'squarespace',
          })

          created++

          // Only email subscribers from the last 30 days
          const isRecent = profileDate >= emailCutoff
          if (isRecent) {
            // Check audit log BEFORE sending to prevent duplicates on re-runs
            const auditKey = `scat_day0_${userId}`
            const { rows: existing } = await sql`SELECT 1 FROM email_audit_log WHERE audit_key = ${auditKey} LIMIT 1`
            if (existing.length === 0) {
              const loginLink = generateMagicLinkJWT(userId, email, name, 'preview', baseUrl)
              const unsubToken = generateUnsubscribeToken(email)
              const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`
              const preseasonLink = `${baseUrl}/preseason`

              // Record audit key BEFORE sending so a crash + re-run won't double-send
              await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`

              await sendEmail({
                to: email,
                subject: 'Your concussion education portal account is ready',
                headers: {
                  'List-Unsubscribe': `<${unsubscribeUrl}>`,
                  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                },
                html: buildWelcomeEmail(escapeHtml(name), loginLink, preseasonLink, unsubscribeUrl),
                tags: [
                  { name: 'sequence', value: 'scat-mastery' },
                  { name: 'day', value: '0' },
                  { name: 'source', value: 'squarespace-sync' },
                ],
              })

              emailed++
            }
          }

          console.log(`[SS Sync] Created${isRecent ? ' + emailed' : ' (silent)'}: ${redact(email)}`)
        } catch (err) {
          console.error(`[SS Sync] Error processing ${redact(email)}:`, err)
          errors++
        }
      }

      // If most profiles on this page were already known, stop pagination
      if (data.profiles.length > 0 && alreadyKnownOnPage >= data.profiles.length * 0.8) {
        keepGoing = false
      }

      // Continue to next page if available
      if (data.pagination.hasNextPage && data.pagination.nextPageCursor) {
        cursor = data.pagination.nextPageCursor
      } else {
        keepGoing = false
      }
    }

    console.log(`[SS Sync] Done: ${created} created, ${emailed} emailed, ${skipped} skipped, ${errors} errors (fetched ${totalFetched} profiles)`)

    return NextResponse.json({
      success: true,
      created,
      emailed,
      skipped,
      errors,
      totalFetched,
    })
  } catch (error) {
    console.error('[SS Sync] Cron error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

function buildWelcomeEmail(userName: string, loginLink: string, preseasonLink: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
      .header { background: linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%); padding: 40px 24px; text-align: center; }
      .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
      .header p { margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px; }
      .content { padding: 32px 24px; }
      .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; }
      .button-secondary { display: inline-block; padding: 14px 28px; background: white; color: #3b82f6; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 12px 0; border: 2px solid #3b82f6; }
      .highlight { background: #dbeafe; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0; }
      .tool-card { background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; margin: 16px 0; }
      .footer { padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>We've built you something new</h1>
        <p>Concussion Education Australia now has a dedicated learning portal</p>
      </div>
      <div class="content">
        <h2 style="margin-top: 0;">Hi ${userName},</h2>
        <p>You signed up for SCAT resources through our website. We've since built a dedicated learning portal with free clinical tools and courses &mdash; and your account is already set up.</p>

        <div class="highlight">
          <strong>Free SCAT6/SCOAT6 Mastery Course (~1 hour):</strong><br><br>
          &bull; Step-by-step SCAT6 &amp; SCOAT6 administration<br>
          &bull; Red flag recognition and escalation criteria<br>
          &bull; When to use SCAT6 vs SCOAT6<br>
          &bull; Clinical toolkit: referral templates, RTP forms<br>
          &bull; Certificate of completion included
        </div>

        <center>
          <a href="${loginLink}" class="button">
            Access the Free Course &rarr;
          </a>
        </center>

        <div class="tool-card">
          <strong>New: Pre-Season Baseline Testing Tool</strong><br><br>
          Run digital cognitive baselines on your athletes &mdash; immediate recall, delayed recall, concentration, balance (BESS). Results are stored and exported as a professional PDF report you can file in their clinical record.<br><br>
          <center><a href="${preseasonLink}" class="button-secondary">Try the Baseline Tool &rarr;</a></center>
        </div>

        <p>The portal is now the home for all our courses, tools, and clinical resources. You'll find everything there going forward.</p>

        <p style="color: #64748b;">
          - Zac Lewis<br>
          <em style="font-size: 14px;">Osteopath (B.Clin.Sci., M.Ost.Med) &middot; Founder, Concussion Education Australia</em>
        </p>
      </div>
      <div class="footer">
        <p><strong>Concussion Education Australia</strong></p>
        <p>zac@concussion-education-australia.com</p>
        <p style="margin-top: 12px; font-size: 12px;"><a href="${unsubscribeUrl}" style="color: #94a3b8;">Unsubscribe from course emails</a></p>
      </div>
    </div>
  </body>
</html>`
}
