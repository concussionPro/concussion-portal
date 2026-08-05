/**
 * Bulk Import Contacts → Preview Users
 *
 * POST /api/admin/import-contacts
 * Headers: x-admin-key: <ADMIN_API_KEY>
 * Body: { contacts: [{ email: string, name?: string, date?: string }] }
 *
 * - Creates preview users with signupSource 'squarespace'
 * - Sends Day 0 welcome email only to contacts from the last 30 days
 * - Skips existing users (deduplication via findUserByEmail)
 * - Batched sending (~5/sec) to stay within Resend limits
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '@/lib/users'
import { generateMagicLinkJWT } from '@/lib/magic-link-jwt'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { loadSuppressedEmails } from '@/lib/email-suppression'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function buildSquarespaceWelcomeEmail(userName: string, loginLink: string, preseasonLink: string, unsubscribeUrl: string): string {
  return `
    <!DOCTYPE html>
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
            <h2 style="margin-top: 0;">Hi ${escapeHtml(userName)},</h2>
            <p>You previously signed up for SCAT resources through our website. Since then, we've built a dedicated learning portal with free clinical tools and courses — and your account is already set up.</p>

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
                Access the Free Course →
              </a>
            </center>

            <div class="tool-card">
              <strong>New: Pre-Season Baseline Testing Tool</strong><br><br>
              Run digital cognitive baselines on your athletes — immediate recall, delayed recall, concentration, balance (BESS). Results are stored and exported as a professional PDF report you can file in their clinical record.<br><br>
              <center><a href="${preseasonLink}" class="button-secondary">Try the Baseline Tool →</a></center>
            </div>

            <p>The portal is now the home for all our courses, tools, and clinical resources. You'll find everything there going forward.</p>

            <p style="color: #64748b;">
              - Zac Lewis<br>
              <em style="font-size: 14px;">Osteopath (B.Clin.Sci., M.Ost.Med) · Founder, Concussion Education Australia</em>
            </p>
          </div>
          <div class="footer">
            <p><strong>Concussion Education Australia</strong></p>
            <p>zac@concussion-education-australia.com</p>
            <p style="margin-top: 12px; font-size: 12px;"><a href="${unsubscribeUrl}" style="color: #94a3b8;">Unsubscribe from course emails</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { contacts } = await request.json() as { contacts: Array<{ email: string; name?: string; date?: string; acceptsMarketing?: boolean }> }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'contacts array is required' }, { status: 400 })
    }

    // Marketing-consent gate: contacts who explicitly declined marketing
    // (acceptsMarketing === false in the Squarespace export) are NEVER
    // imported into the nurture funnel — importing them and relying on
    // List-Unsubscribe would breach the zero-tolerance suppression policy.
    // Contacts without the flag (older exports omit it) submitted a form on
    // the site, so they're treated as an existing relationship and allowed.
    const filteredContacts = contacts.filter(c => c.acceptsMarketing !== false)
    const skippedNoConsent = contacts.length - filteredContacts.length

    // Master blacklist. A pasted export routinely contains addresses that have
    // since hard-bounced, complained, replied STOP, or unsubscribed on the cold
    // side — importing them recreates the account AND fires the Day-0 welcome.
    // FAIL CLOSED: abort rather than import with an empty blacklist.
    let suppressedEmails: Set<string>
    try {
      suppressedEmails = await loadSuppressedEmails()
    } catch (err) {
      console.error('[Import] Failed to load email_suppression — ABORTING (fail closed):', err)
      return NextResponse.json(
        { error: 'email_suppression load failed — import aborted (fail closed)' },
        { status: 503 },
      )
    }
    let skippedSuppressed = 0

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const preseasonLink = `${baseUrl}/preseason`
    const now = Date.now()
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

    let created = 0
    let emailed = 0
    let skipped = 0
    let errors = 0

    // Process in batches of 5 with 1s delay between batches
    for (let i = 0; i < filteredContacts.length; i++) {
      const contact = filteredContacts[i]
      const email = contact.email?.trim()?.toLowerCase()

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors++
        continue
      }

      if (suppressedEmails.has(email)) {
        skippedSuppressed++
        continue
      }

      try {
        const existing = await findUserByEmail(email)
        if (existing) {
          skipped++
          continue
        }

        const name = contact.name?.trim() || email.split('@')[0]
        const displayName = contact.name?.trim() || 'there'

        const userId = await createUser({
          email,
          name,
          accessLevel: 'preview',
          signupSource: 'squarespace',
        })
        created++

        // Only send Day 0 email to contacts from the last 30 days
        const contactDate = contact.date ? new Date(contact.date).getTime() : 0
        const isRecent = contactDate > 0 && (now - contactDate) <= THIRTY_DAYS_MS

        if (isRecent) {
          const loginLink = generateMagicLinkJWT(userId, email, name, 'preview', baseUrl)
          const unsubToken = generateUnsubscribeToken(email)
          const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`

          await sendEmail({
            to: email,
            subject: 'Your concussion education portal account is ready',
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
            html: buildSquarespaceWelcomeEmail(displayName, loginLink, preseasonLink, unsubscribeUrl),
            tags: [
              { name: 'sequence', value: 'scat-mastery' },
              { name: 'day', value: '0' },
              { name: 'source', value: 'squarespace-import' },
            ],
          })

          // Record audit key so cron won't re-send Day 0
          await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${`scat_day0_${userId}`}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          emailed++
        } else {
          // Still record audit key for old contacts (cron will handle subsequent days based on created_at)
          await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${`scat_day0_${userId}`}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
        }

        // Rate limit: pause 200ms between each contact (~5/sec)
        if ((i + 1) % 5 === 0) {
          await sleep(1000)
        }
      } catch (err) {
        console.error(`[Import] Error processing ${email}:`, err)
        errors++
      }
    }

    console.log(`[Import] Done: ${created} created, ${emailed} emailed, ${skipped} skipped, ${errors} errors, ${skippedNoConsent} no-consent, ${skippedSuppressed} suppressed`)

    return NextResponse.json({
      success: true,
      created,
      emailed,
      skipped,
      errors,
      skippedNoConsent,
      skippedSuppressed,
      total: contacts.length,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
