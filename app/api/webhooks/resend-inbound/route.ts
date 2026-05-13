/**
 * Resend Inbound webhook handler.
 *
 * Receives Squarespace form-submission notification emails (which currently
 * land in info@concussion-education-australia.com and only existed as inbox
 * notifications), parses them, and inserts a row into workshop_interest.
 *
 * The setup chain is:
 *   Squarespace form → info@... notification → forwarded to *@inbound.<domain>
 *     → Resend Inbound delivers POST to this route → parsed → DB insert.
 *
 * Setup:
 *   1. resend.com → Domains → add inbound.concussion-education-australia.com
 *   2. Add the MX record they show (typically inbound-smtp.resend.com priority 10)
 *   3. Add inbound endpoint pointing at:
 *      https://portal.concussion-education-australia.com/api/webhooks/resend-inbound
 *   4. Copy the whsec_... signing secret into RESEND_INBOUND_WEBHOOK_SECRET
 *      env var in Vercel (separate from the existing RESEND_WEBHOOK_SECRET —
 *      Inbound has its own signing key)
 *   5. Forward info@ submissions to the inbound address (configure Gmail
 *      filter or change the Squarespace notification email directly)
 *
 * Idempotency: workshop_interest UNIQUE(email, city) means re-deliveries of
 * the same email cause ON CONFLICT DO NOTHING — no duplicates, no errors.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { parseSquarespaceEmail } from '@/lib/squarespace-email-parser'
import { CONFIG } from '@/lib/config'
import crypto from 'crypto'

export const maxDuration = 30

/**
 * Svix signature verification. Same scheme as the existing /api/webhooks/
 * resend route, but reads RESEND_INBOUND_WEBHOOK_SECRET — Resend Inbound has
 * its own signing key separate from the email-events webhook key.
 */
function verifySvixSignature(
  body: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignature: string | null
): boolean {
  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('RESEND_INBOUND_WEBHOOK_SECRET not set — rejecting webhook in production')
      return false
    }
    console.warn('RESEND_INBOUND_WEBHOOK_SECRET not set — skipping verification (dev mode)')
    return true
  }
  if (!svixId || !svixTimestamp || !svixSignature) return false

  const timestampSec = parseInt(svixTimestamp, 10)
  const nowSec = Math.floor(Date.now() / 1000)
  if (isNaN(timestampSec) || Math.abs(nowSec - timestampSec) > 300) {
    console.warn(`Resend inbound: stale timestamp (${svixTimestamp})`)
    return false
  }

  const secretBytes = Buffer.from(secret.replace('whsec_', ''), 'base64')
  const signedContent = `${svixId}.${svixTimestamp}.${body}`
  const expectedSignature = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64')

  const signatures = svixSignature.split(' ')
  for (const sig of signatures) {
    const sigValue = sig.replace('v1,', '')
    try {
      if (
        sigValue.length === expectedSignature.length &&
        crypto.timingSafeEqual(Buffer.from(sigValue), Buffer.from(expectedSignature))
      ) {
        return true
      }
    } catch {
      continue
    }
  }
  return false
}

/**
 * Resend Inbound payload shape (defensive — Resend may nest fields under
 * `data` or send them at the root depending on event type version).
 */
interface InboundPayload {
  type?: string
  data?: {
    subject?: string
    text?: string
    html?: string
    from?: string | { email?: string; name?: string }
    to?: string | string[] | Array<{ email?: string }>
  }
  subject?: string
  text?: string
  html?: string
  from?: string | { email?: string; name?: string }
  to?: string | string[] | Array<{ email?: string }>
}

function pickFirst<T>(...values: Array<T | undefined | null>): T | null {
  for (const v of values) if (v !== undefined && v !== null && v !== '') return v as T
  return null
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')

    if (!verifySvixSignature(rawBody, svixId, svixTimestamp, svixSignature)) {
      console.error('[resend-inbound] Invalid Svix signature', {
        svixId: svixId || '(none)',
        secretConfigured: !!process.env.RESEND_INBOUND_WEBHOOK_SECRET,
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let payload: InboundPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const subject = pickFirst(payload.data?.subject, payload.subject) ?? ''
    const bodyText = pickFirst(payload.data?.text, payload.text) ?? ''

    if (!subject && !bodyText) {
      console.error('[resend-inbound] Missing both subject and body in payload')
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 })
    }

    const parsed = parseSquarespaceEmail({ subject, bodyText })

    if (!parsed.ok) {
      console.error('[resend-inbound] Parse failed', parsed.diagnostic)
      // Best-effort notification to Zac so the lead doesn't silently vanish
      try {
        await sendEmail({
          to: CONFIG.CONTACT_EMAIL,
          subject: `Form submission needs manual review — ${parsed.diagnostic.subject || '(no subject)'}`,
          html: buildReviewNotification(parsed.error, parsed.diagnostic, bodyText),
          tags: [{ name: 'type', value: 'inbound-parse-fail' }],
        })
      } catch (emailErr) {
        console.error('[resend-inbound] Failed to send review notification:', emailErr)
      }
      // Return 200 so Resend doesn't retry — we've logged and notified.
      return NextResponse.json({ success: false, error: parsed.error, needsReview: true })
    }

    const { email, name, city, source } = parsed.payload

    const { rowCount } = await sql`
      INSERT INTO workshop_interest (email, name, city, source)
      VALUES (${email}, ${name}, ${city}, ${source})
      ON CONFLICT (email, city) DO NOTHING
    `

    if (rowCount === 0) {
      console.log(`[resend-inbound] duplicate ${email.slice(0, 3)}*** for ${city} — skipped`)
      return NextResponse.json({ success: true, duplicate: true, city })
    }

    console.log(`[resend-inbound] inserted ${email.slice(0, 3)}*** for ${city}`)

    return NextResponse.json({ success: true, city })
  } catch (error) {
    console.error('[resend-inbound] handler error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function buildReviewNotification(
  error: string,
  diagnostic: { subject: string; formNameNormalised: string; extractedEmail: string | null; extractedName: string | null; extractedState: string | null; extractedLocation: string | null },
  bodyText: string
): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; padding: 24px;">
      <h2 style="font-size: 18px; color: #b91c1c; margin: 0 0 12px;">
        Form submission couldn't be auto-classified
      </h2>
      <p style="font-size: 14px; color: #475569; margin-bottom: 16px;">
        ${escapeHtml(error)}
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 140px;">Subject</td><td style="padding: 6px 0; color: #0f172a;">${escapeHtml(diagnostic.subject)}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Normalised form name</td><td style="padding: 6px 0; color: #0f172a;">${escapeHtml(diagnostic.formNameNormalised)}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Extracted email</td><td style="padding: 6px 0; color: #0f172a;">${escapeHtml(diagnostic.extractedEmail || '(none)')}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Extracted name</td><td style="padding: 6px 0; color: #0f172a;">${escapeHtml(diagnostic.extractedName || '(none)')}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Extracted state</td><td style="padding: 6px 0; color: #0f172a;">${escapeHtml(diagnostic.extractedState || '(none)')}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Extracted location</td><td style="padding: 6px 0; color: #0f172a;">${escapeHtml(diagnostic.extractedLocation || '(none)')}</td></tr>
      </table>
      <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">Raw email body (first 600 chars):</p>
      <pre style="font-size: 11px; background: #f1f5f9; padding: 12px; border-radius: 6px; white-space: pre-wrap; word-wrap: break-word; color: #334155;">${escapeHtml(bodyText.slice(0, 600))}</pre>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">
        Once the form name or state mapping is fixed in lib/squarespace-email-parser.ts and redeployed, future submissions of this kind will route automatically.
      </p>
    </div>
  `
}
