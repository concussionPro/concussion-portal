/**
 * Resend Webhook Handler
 *
 * Receives email events (delivered, opened, clicked, bounced, complained)
 * and stores them for analytics and suppression.
 *
 * Setup: resend.com > Webhooks > Add Endpoint
 * URL: https://portal.concussion-education-australia.com/api/webhooks/resend
 * Events: email.delivered, email.opened, email.clicked, email.bounced, email.complained
 *
 * Resend uses Svix for webhook signing.
 * Set RESEND_WEBHOOK_SECRET env var (the whsec_... value from Resend dashboard).
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'

export const maxDuration = 30

// Resend webhook event types
interface ResendWebhookEvent {
  type: 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced' | 'email.complained'
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
    tags?: Array<{ name: string; value: string }>
    click?: { link: string }
  }
}

/**
 * Svix webhook verification.
 * Resend signs webhooks using Svix (svix-id, svix-timestamp, svix-signature headers).
 */
function verifySvixSignature(
  body: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignature: string | null
): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('RESEND_WEBHOOK_SECRET not set — rejecting webhook in production')
      return false
    }
    console.warn('RESEND_WEBHOOK_SECRET not set — skipping verification (dev mode)')
    return true
  }
  if (!svixId || !svixTimestamp || !svixSignature) return false

  // Reject stale webhooks (replay protection — 5 minute window)
  const timestampSec = parseInt(svixTimestamp, 10)
  const nowSec = Math.floor(Date.now() / 1000)
  if (isNaN(timestampSec) || Math.abs(nowSec - timestampSec) > 300) {
    console.warn(`Resend webhook: stale timestamp (${svixTimestamp})`)
    return false
  }

  // Svix secret starts with "whsec_" — strip prefix and base64-decode
  const secretBytes = Buffer.from(secret.replace('whsec_', ''), 'base64')

  // Signature content = "msg_id.timestamp.body"
  const signedContent = `${svixId}.${svixTimestamp}.${body}`

  const expectedSignature = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64')

  // svix-signature header contains "v1,<base64>" — may have multiple signatures
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

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    // Svix headers
    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')

    // Verify webhook signature (always — rejects in production if secret missing)
    if (!verifySvixSignature(rawBody, svixId, svixTimestamp, svixSignature)) {
      // Log enough detail to diagnose secret drift without leaking the secret.
      // Last incident: signing secret rotated in Resend dashboard ~Apr 14 2026,
      // RESEND_WEBHOOK_SECRET in Vercel wasn't updated → 17 days of silently
      // dropped events. Next time we want this to be obviously diagnosable.
      const secretSet = !!process.env.RESEND_WEBHOOK_SECRET
      const secretPrefix = process.env.RESEND_WEBHOOK_SECRET?.slice(0, 6) || '(none)'
      console.error('[Resend webhook] Invalid Svix signature', {
        svixId: svixId || '(none)',
        svixTimestamp: svixTimestamp || '(none)',
        secretConfigured: secretSet,
        secretPrefix, // 'whsec_' if a real Resend key, otherwise something is off
        bodySize: rawBody.length,
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event: ResendWebhookEvent = JSON.parse(rawBody)
    const { type, data } = event
    const email = data.to?.[0]?.toLowerCase()

    if (!email) {
      return NextResponse.json({ received: true })
    }

    // Resend account is shared with byronwebstudio.com.au (Local Leads project).
    // Tag every row with the project so admin queries can scope cleanly to
    // CEA without dropping Byron Web Studio analytics. Project inferred from
    // data.from domain.
    const fromDomain = (data.from || '').toLowerCase()
    let project: 'cea' | 'byronwebstudio' | 'other' = 'other'
    if (
      fromDomain.includes('concussion-education-australia.com') ||
      fromDomain.includes('concussion-education.com')
    ) {
      project = 'cea'
    } else if (fromDomain.includes('byronwebstudio.com.au')) {
      project = 'byronwebstudio'
    }

    const eventType = type.replace('email.', '')

    // Parse tags from array format [{name, value}] to key-value
    const tags: Record<string, string> = {}
    if (Array.isArray(data.tags)) {
      for (const t of data.tags) {
        tags[t.name] = t.value
      }
    }

    const sequence = tags.sequence || null
    const day = tags.day || null
    const clickUrl = data.click?.link || null

    // Ensure project column exists (one-shot migration; ALTER ... IF NOT EXISTS is safe)
    await sql`ALTER TABLE email_events ADD COLUMN IF NOT EXISTS project TEXT`

    // Store in email_events table — tagged with project for downstream scoping
    await sql`
      INSERT INTO email_events (
        email_id, recipient, event_type, subject, sequence, day, click_url, project, created_at
      ) VALUES (
        ${data.email_id},
        ${email},
        ${eventType},
        ${data.subject},
        ${sequence},
        ${day},
        ${clickUrl},
        ${project},
        NOW()
      )
    `

    // Handle bounces — suppress future emails
    if (eventType === 'bounced') {
      console.log(`[Resend] Bounce: ${email.slice(0, 3)}*** — suppressing from nurture`)
      await sql`
        UPDATE users SET nurture_unsubscribed = true
        WHERE LOWER(email) = ${email}
      `
    }

    // Handle complaints — suppress future emails
    if (eventType === 'complained') {
      console.log(`[Resend] Complaint: ${email.slice(0, 3)}*** — suppressing from nurture`)
      await sql`
        UPDATE users SET nurture_unsubscribed = true
        WHERE LOWER(email) = ${email}
      `
    }

    // ── PROSPECT OUTREACH TRACKING ──
    // Cold-outreach sends are tagged with `prospect-id` + `template`. If those
    // tags are present, also update the prospect_outreach_log + suppression
    // + clinic status downstream. Idempotent: open events fire multiple times.
    const prospectId = tags['prospect-id']
    const templateSlug = tags['template']
    const mode = tags['mode'] // 'test' | 'production'
    if (prospectId && templateSlug) {
      const pidNum = parseInt(prospectId, 10)
      if (!isNaN(pidNum)) {
        try {
          // Update outreach log counters
          if (eventType === 'opened') {
            // Check if this is the FIRST open across all sends to this prospect
            // (fire one notification per prospect, not per event)
            const { rows: priorOpens } = await sql<{ total: string }>`
              SELECT COALESCE(SUM(opened_count), 0)::text AS total
              FROM prospect_outreach_log WHERE clinic_id = ${pidNum}
            `
            const wasFirstOpen = parseInt(priorOpens[0]?.total ?? '0', 10) === 0

            await sql`
              UPDATE prospect_outreach_log
              SET opened_count = opened_count + 1
              WHERE resend_email_id = ${data.email_id}
            `
            // Bump clinic status from 'sent' -> 'opened' (first open only)
            await sql`
              UPDATE prospect_clinics
              SET status = 'opened', updated_at = NOW()
              WHERE id = ${pidNum} AND status = 'sent'
            `
            if (wasFirstOpen) {
              await notifyZacFirstEngagement(pidNum, 'opened', templateSlug)
            }
          } else if (eventType === 'clicked') {
            const { rows: priorClicks } = await sql<{ total: string }>`
              SELECT COALESCE(SUM(clicked_count), 0)::text AS total
              FROM prospect_outreach_log WHERE clinic_id = ${pidNum}
            `
            const wasFirstClick = parseInt(priorClicks[0]?.total ?? '0', 10) === 0

            await sql`
              UPDATE prospect_outreach_log
              SET clicked_count = clicked_count + 1
              WHERE resend_email_id = ${data.email_id}
            `
            await sql`
              UPDATE prospect_clinics
              SET status = 'engaged', updated_at = NOW()
              WHERE id = ${pidNum} AND status IN ('sent', 'opened')
            `
            if (wasFirstClick) {
              await notifyZacFirstEngagement(pidNum, 'clicked', templateSlug)
            }
          } else if (eventType === 'bounced' || eventType === 'complained') {
            // Add to suppression — never send again
            const reason = eventType === 'bounced' ? 'hard-bounce' : 'complained'
            await sql`
              INSERT INTO email_suppression (email, reason, source)
              VALUES (${email}, ${reason}, ${'webhook:' + eventType + ':prospect-id:' + pidNum})
              ON CONFLICT (email) DO NOTHING
            `
            // Mark clinic as lost (manual review needed)
            await sql`
              UPDATE prospect_clinics
              SET status = 'lost', notes = COALESCE(notes, '') || ${'\n[auto] ' + new Date().toISOString() + ' webhook ' + eventType}, updated_at = NOW()
              WHERE id = ${pidNum}
            `
          }
          console.log(`[Resend prospect] ${eventType} prospect=${pidNum} template=${templateSlug} mode=${mode}`)
        } catch (prospectErr) {
          // Log but don't fail the webhook — we still want the email_events row
          console.error('[Resend prospect tracking failed]', prospectErr)
        }
      }
    }

    console.log(`[Resend] ${eventType}: ${email.slice(0, 3)}*** (${data.subject})`)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Resend webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Fire-and-forget transactional notification to Zac when a prospect first
 * engages (opens or clicks). Uses the same Resend client; failures don't
 * propagate.
 */
async function notifyZacFirstEngagement(
  prospectId: number,
  event: 'opened' | 'clicked',
  templateSlug: string,
): Promise<void> {
  try {
    const { rows } = await sql<{
      short_name: string
      contact_full_name: string
      contact_email: string
      region: string
      slug: string
      access_key: string
    }>`
      SELECT short_name, contact_full_name, contact_email, region, slug, access_key
      FROM prospect_clinics WHERE id = ${prospectId} LIMIT 1
    `
    const clinic = rows[0]
    if (!clinic) return

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('[Engagement notify] RESEND_API_KEY not configured — skipping notify')
      return
    }

    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.concussion-education-australia.com'
    const portalUrl = `${baseUrl}/p/${clinic.slug}?k=${clinic.access_key}`
    const zacInbox = process.env.ZAC_INBOX ?? 'zac@concussion-education-australia.com'

    const verb = event === 'opened' ? 'opened' : 'clicked through'
    const subject = `🎯 ${clinic.short_name} just ${verb} the ${templateSlug} email`

    const body = `${clinic.contact_full_name} at ${clinic.short_name} (${clinic.region}) just ${verb} the cold outreach email (${templateSlug}).

This is the first engagement signal for this prospect.

Suggested actions:
- Check the portal view metrics: ${baseUrl}/api/admin/prospect-engagement?clinicId=${prospectId}
- Preview their portal: ${portalUrl}
- Consider a personal reply if their engagement deepens (multi-visit + multiple opens within 48hr).

Email: ${clinic.contact_email}
`

    await resend.emails.send({
      from: 'Concussion Education Australia <partnerships@concussion-education-australia.com>',
      to: zacInbox,
      replyTo: 'zac@concussion-education-australia.com',
      subject,
      text: body,
      tags: [
        { name: 'category', value: 'engagement-alert' },
        { name: 'prospect-id', value: String(prospectId) },
        { name: 'event', value: event },
      ],
    })
  } catch (err) {
    console.error('[Engagement notify failed]', err)
  }
}
