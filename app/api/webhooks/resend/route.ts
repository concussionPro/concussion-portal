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
    console.warn('RESEND_WEBHOOK_SECRET not set — skipping signature verification')
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

    // Verify webhook signature
    if (
      process.env.RESEND_WEBHOOK_SECRET &&
      !verifySvixSignature(rawBody, svixId, svixTimestamp, svixSignature)
    ) {
      console.error('Resend webhook: invalid Svix signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event: ResendWebhookEvent = JSON.parse(rawBody)
    const { type, data } = event
    const email = data.to?.[0]?.toLowerCase()

    if (!email) {
      return NextResponse.json({ received: true })
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
      console.log(`[Resend] Bounce: ${email} — suppressing from nurture`)
      await sql`
        UPDATE users SET nurture_unsubscribed = true
        WHERE LOWER(email) = ${email}
      `
    }

    // Handle complaints — suppress future emails
    if (eventType === 'complained') {
      console.log(`[Resend] Complaint: ${email} — suppressing from nurture`)
      await sql`
        UPDATE users SET nurture_unsubscribed = true
        WHERE LOWER(email) = ${email}
      `
    }

    console.log(`[Resend] ${eventType}: ${email} (${data.subject})`)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Resend webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
