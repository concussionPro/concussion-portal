/**
 * Resend Inbound webhook handler.
 *
 * TWO jobs, checked in order:
 *
 * 1. PROSPECT REPLY DETECTION (cold-outreach engine). Any inbound email
 *    whose From address matches prospect_clinics.contact_email marks that
 *    clinic status='replied' (+ replied_at / reply_text) so the cron stops
 *    the sequence — replies previously went undetected and prospects kept
 *    receiving T2/T3 after answering. STOP/UNSUBSCRIBE replies additionally
 *    hit email_suppression + status='lost'.
 *    Requires Zac's mailbox (zac@...) to forward replies to the Resend
 *    inbound address — see setup notes below.
 *
 * 2. SQUARESPACE FORM NOTIFICATIONS. Receives Squarespace form-submission
 *    notification emails (which currently land in
 *    info@concussion-education-australia.com and only existed as inbox
 *    notifications), parses them, and inserts a row into workshop_interest.
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

/**
 * Extract the sender address from the PARSED from field (string
 * `"Name <email>"` / bare address, or `{ email, name }` object) — never
 * from raw headers. Lowercased; null when absent/unparseable.
 */
function extractFromEmail(from: InboundPayload['from'] | null): string | null {
  if (!from) return null
  if (typeof from === 'object') {
    const e = from.email?.trim().toLowerCase()
    return e && e.includes('@') ? e : null
  }
  const raw = from.trim()
  const angled = raw.match(/<([^<>\s]+@[^<>\s]+)>/)
  if (angled) return angled[1].toLowerCase()
  const bare = raw.match(/([^\s"',;<>]+@[^\s"',;<>]+)/)
  return bare ? bare[1].toLowerCase() : null
}

const MAX_REPLY_TEXT_LENGTH = 4000

/**
 * Opt-out detection in a reply. Standalone STOP/UNSUBSCRIBE at the start of
 * the subject/body or on its own line, plus unambiguous phrases. Word
 * boundaries so "unstoppable"/"non-stop" never match.
 */
function isOptOutMessage(subject: string, bodyText: string): boolean {
  const probe = `${subject}\n${bodyText.slice(0, 1000)}`
  if (/(^|\n)\s*(stop|unsubscribe)\b/i.test(probe)) return true
  return /\bunsubscribe\b|\bopt[\s-]?out\b|\bremove me\b|\btake me off\b|\bstop (emailing|contacting|sending)\b/i.test(probe)
}

/**
 * Prospect-reply path. Returns true if the inbound email matched a cold
 * prospect (handled — skip the Squarespace parser). Never throws.
 */
async function handleProspectReply(
  fromEmail: string,
  subject: string,
  bodyText: string,
): Promise<{ matched: boolean; optOut?: boolean; clinicId?: number }> {
  try {
    const { rows } = await sql<{ id: number; slug: string; contact_email: string; status: string }>`
      SELECT id, slug, contact_email, status
      FROM prospect_clinics
      WHERE LOWER(contact_email) = ${fromEmail}
      ORDER BY updated_at DESC
      LIMIT 1
    `
    const clinic = rows[0]
    if (!clinic) return { matched: false }

    const replyText = `${subject ? `Subject: ${subject}\n` : ''}${bodyText}`.slice(0, MAX_REPLY_TEXT_LENGTH)
    const optOut = isOptOutMessage(subject, bodyText)

    // Defensive — columns also added by prospect-schema-bootstrap.
    try {
      await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ`
      await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS reply_text TEXT`
    } catch {
      // Column already exists or perms differ — safe to continue
    }

    if (optOut) {
      // STOP/UNSUBSCRIBE — suppress globally so they're never emailed again,
      // and park the clinic in the opt-out status the engine already excludes.
      await sql`
        INSERT INTO email_suppression (email, reason, source)
        VALUES (${fromEmail}, 'reply-opt-out', ${`resend-inbound:${clinic.slug}`})
        ON CONFLICT (email) DO NOTHING
      `
      await sql`
        UPDATE prospect_clinics
        SET status = 'lost',
            replied_at = COALESCE(replied_at, NOW()),
            reply_text = ${replyText},
            next_template_slug = NULL,
            scheduled_send_at = NULL,
            notes = COALESCE(notes, '') || ${'\n[auto] ' + new Date().toISOString() + ' reply contained STOP/UNSUBSCRIBE — suppressed'},
            updated_at = NOW()
        WHERE id = ${clinic.id}
      `
    } else {
      await sql`
        UPDATE prospect_clinics
        SET status = 'replied',
            replied_at = COALESCE(replied_at, NOW()),
            reply_text = ${replyText},
            notes = COALESCE(notes, '') || ${'\n[auto] ' + new Date().toISOString() + ' inbound reply detected — sequence stopped'},
            updated_at = NOW()
        WHERE id = ${clinic.id}
      `
    }

    // Mirror onto the latest outreach-log row so per-send reply analytics work.
    try {
      await sql`
        UPDATE prospect_outreach_log
        SET replied_at = NOW(), reply_text = ${replyText}
        WHERE id = (
          SELECT id FROM prospect_outreach_log
          WHERE clinic_id = ${clinic.id} AND replied_at IS NULL
          ORDER BY sent_at DESC
          LIMIT 1
        )
      `
    } catch (err) {
      console.error('[resend-inbound] outreach-log reply mirror failed:', err)
    }

    console.log(
      `[resend-inbound] prospect reply from ${fromEmail.slice(0, 3)}*** → clinic ${clinic.id} ` +
        (optOut ? 'OPT-OUT (suppressed)' : "status='replied'"),
    )
    return { matched: true, optOut, clinicId: clinic.id }
  } catch (err) {
    console.error('[resend-inbound] prospect reply handling failed:', err)
    return { matched: false }
  }
}

/**
 * Users-table opt-out fallback (2026-07-02). A STOP/unsubscribe reply from a
 * nurture/lifecycle recipient (users row, NOT a prospect clinic) previously
 * fell through to the Squarespace parser and was ignored — the person kept
 * getting emails. If the sender matches a users row and the message is an
 * opt-out, suppress globally + set nurture_unsubscribed=true. Never throws.
 */
async function handleUserOptOut(
  fromEmail: string,
  subject: string,
  bodyText: string,
): Promise<{ matched: boolean }> {
  try {
    if (!isOptOutMessage(subject, bodyText)) return { matched: false }
    const { rows } = await sql<{ id: string }>`
      SELECT id FROM users WHERE LOWER(email) = ${fromEmail} LIMIT 1
    `
    if (!rows[0]) return { matched: false }

    await sql`
      INSERT INTO email_suppression (email, reason, source)
      VALUES (${fromEmail}, 'reply-opt-out', 'resend-inbound:user')
      ON CONFLICT (email) DO NOTHING
    `
    await sql`
      UPDATE users SET nurture_unsubscribed = true WHERE id = ${rows[0].id}
    `
    console.log(`[resend-inbound] user opt-out from ${fromEmail.slice(0, 3)}*** — suppressed + nurture_unsubscribed`)
    return { matched: true }
  } catch (err) {
    console.error('[resend-inbound] user opt-out handling failed:', err)
    return { matched: false }
  }
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

    // ── 1. PROSPECT REPLY DETECTION ──
    // Match the parsed From address against cold prospects BEFORE the
    // Squarespace parser. A match stops the sequence (status='replied');
    // a STOP/UNSUBSCRIBE reply additionally suppresses the address.
    const fromEmail = extractFromEmail(pickFirst(payload.data?.from, payload.from))
    if (fromEmail) {
      const replyResult = await handleProspectReply(fromEmail, subject, bodyText)
      if (replyResult.matched) {
        return NextResponse.json({
          success: true,
          prospectReply: true,
          optOut: replyResult.optOut ?? false,
        })
      }

      // Users-table fallback (2026-07-02): a STOP from a nurture recipient
      // who isn't a cold prospect must still land on the master blacklist.
      const userOptOut = await handleUserOptOut(fromEmail, subject, bodyText)
      if (userOptOut.matched) {
        return NextResponse.json({ success: true, userOptOut: true })
      }
    }

    // ── 2. SQUARESPACE FORM NOTIFICATIONS ──
    // Guard (Zac 2026-06-16): reply capture works by FORWARDING zac@ replies to
    // this endpoint (Gmail filter on "Re:" → inbound address). That means plenty
    // of forwarded mail is neither a prospect reply nor a Squarespace form. Only
    // run the form parser + "needs review" alert when the mail actually LOOKS
    // like a Squarespace form notification — otherwise silently 200, so broad
    // forwarding never spams Zac's inbox with review notices.
    const looksLikeSquarespaceForm =
      /squarespace/i.test(fromEmail ?? '') ||
      /\bform submission\b/i.test(subject) ||
      (/\bForm:/i.test(bodyText) && /\b(name|email)\b/i.test(bodyText))
    if (!looksLikeSquarespaceForm) {
      return NextResponse.json({ success: true, ignored: 'not a prospect reply or form notification' })
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
