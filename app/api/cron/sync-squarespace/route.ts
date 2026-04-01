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
    // Accept CRON_SECRET (Vercel cron), x-admin-key header, or ?key= query param
    const url = new URL(request.url)
    const authHeader = request.headers.get('authorization')
    const adminKey = request.headers.get('x-admin-key') || url.searchParams.get('key')
    const cronSecret = process.env.CRON_SECRET
    const adminApiKey = process.env.ADMIN_API_KEY

    let authorized = false
    if (cronSecret && authHeader) {
      const expected = `Bearer ${cronSecret}`
      if (authHeader.length === expected.length && crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) {
        authorized = true
      }
    }
    if (!authorized && adminApiKey && adminKey === adminApiKey) {
      authorized = true
    }
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // DB health check
    try {
      await sql`SELECT 1`
    } catch (dbErr) {
      console.error('[SS Sync] Database connection failed:', dbErr)
      return NextResponse.json({ error: 'Database connection failed', detail: String(dbErr) }, { status: 503 })
    }

    const apiKey = process.env.SQUARESPACE_API_KEY
    if (!apiKey) {
      console.error('[SS Sync] SQUARESPACE_API_KEY not configured')
      return NextResponse.json({ error: 'SQUARESPACE_API_KEY not configured' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    let created = 0
    let skipped = 0
    let emailed = 0
    let errors = 0
    let totalFetched = 0

    // Fetch profiles sorted by createdOn descending (newest first)
    // Stop when we hit profiles older than 30 days or already in our DB
    let cursor: string | null = null
    let keepGoing = true
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    while (keepGoing) {
      const url = cursor
        ? `${SQUARESPACE_API_BASE}/profiles?cursor=${cursor}`
        : `${SQUARESPACE_API_BASE}/profiles?sortField=createdOn&sortDirection=dsc`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'ConcussionPro-Portal/1.0',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[SS Sync] API error ${response.status}: ${errorText}`)
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

        // Stop if profile is older than 30 days
        const profileDate = new Date(profile.createdOn)
        if (profileDate < thirtyDaysAgo) {
          keepGoing = false
          break
        }

        // Skip customers (they come through Stripe, not this sync)
        if (profile.isCustomer) {
          skipped++
          continue
        }

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

          // Send Day 0 welcome email (same as webhook handler)
          const loginLink = generateMagicLinkJWT(userId, email, name, 'preview', baseUrl)
          const unsubToken = generateUnsubscribeToken(email)
          const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`
          const preseasonLink = `${baseUrl}/preseason`

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

          // Record audit key so cron won't re-send Day 0
          await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${`scat_day0_${userId}`}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          emailed++

          console.log(`[SS Sync] Created + emailed: ${email}`)
        } catch (err) {
          console.error(`[SS Sync] Error processing ${email}:`, err)
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
          <strong>Free SCAT6/SCOAT6 Mastery Course (~2 hours, 2 CPD points):</strong><br><br>
          &bull; Step-by-step SCAT6 &amp; SCOAT6 administration<br>
          &bull; Red flag recognition and escalation criteria<br>
          &bull; When to use SCAT6 vs SCOAT6<br>
          &bull; Clinical toolkit: referral templates, RTP forms<br>
          &bull; Certificate + 2 AHPRA-aligned CPD points on completion
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
