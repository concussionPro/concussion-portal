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
    // Reject any event whose sender isn't a CEA domain so foreign cold-pitch
    // analytics don't pollute email_events. Without this filter, ~50%+ of
    // top-click data was Byron Web Services links.
    const fromDomain = (data.from || '').toLowerCase()
    const isCEASender =
      fromDomain.includes('concussion-education-australia.com') ||
      fromDomain.includes('concussion-education.com') ||
      fromDomain.includes('@ceapro.') // tolerate any historical alias
    if (!isCEASender) {
      return NextResponse.json({ received: true, filtered: 'non-cea-sender' })
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

    // Store in email_events table
    await sql`
      INSERT INTO email_events (
        email_id, recipient, event_type, subject, sequence, day, click_url, created_at
      ) VALUES (
        ${data.email_id},
        ${email},
        ${eventType},
        ${data.subject},
        ${sequence},
        ${day},
        ${clickUrl},
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

    console.log(`[Resend] ${eventType}: ${email.slice(0, 3)}*** (${data.subject})`)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Resend webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
