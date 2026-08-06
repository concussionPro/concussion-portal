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
    // Resend uses object form in webhook payloads, but the send API accepts
    // array form. Type both for safety.
    tags?: Array<{ name: string; value: string }> | Record<string, string>
    click?: { link: string }
    // Present on email.bounced events. type is 'Permanent' | 'Transient'
    // (Resend also documents 'Undetermined'). Only Permanent bounces should
    // suppress an address — transient bounces (full mailbox, greylisting,
    // temporary server issues) are retryable.
    bounce?: { type?: string; subType?: string; message?: string }
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

    // ── IDEMPOTENCY ─────────────────────────────────────────────────────────
    // Svix retries on any non-2xx and can redeliver on its own, and this
    // handler is NOT naturally idempotent: it appends a row to email_events
    // and does `opened_count = opened_count + 1` / `clicked_count + 1` on
    // prospect_outreach_log. A redelivery therefore inflates engagement — the
    // exact metric the cold-outreach engine is steered by.
    //
    // Measured: email_id cc3dbc7b-…98963 carries TWO 'delivered' rows 6.8s
    // apart (2026-05-30) — a real redelivery, silently double-counted.
    //
    // svix-id is the message id and is stable across retries. Reuses the
    // Stripe webhook's processed_webhook_events table (namespaced) rather than
    // inventing a second one; claimed BEFORE the writes and rolled back in the
    // catch so a genuine failure still gets retried.
    let dedupeKey: string | null = null
    if (svixId) {
      try {
        const { rows } = await sql`
          INSERT INTO processed_webhook_events (event_id, event_type, processed_at)
          VALUES (${'resend:' + svixId}, ${type}, now())
          ON CONFLICT (event_id) DO NOTHING
          RETURNING event_id
        `
        if (rows.length === 0) {
          console.log(`[Resend webhook] duplicate delivery ${svixId} (${type}) — skipped`)
          return NextResponse.json({ received: true, duplicate: true })
        }
        dedupeKey = 'resend:' + svixId
      } catch (dedupeErr) {
        // Table missing (fresh env) or DB blip — process anyway rather than
        // drop an event. Duplicate rows are recoverable; lost bounces are not.
        console.warn('[Resend webhook] dedupe claim failed — processing without it:', dedupeErr)
      }
    }

    try {

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

    // Parse tags — Resend's webhook payload returns tags as an OBJECT
    // ({"prospect-id": "5"}), not the array form ([{name, value}]) used when
    // sending. Handle both for safety.
    const tags: Record<string, string> = {}
    if (Array.isArray(data.tags)) {
      for (const t of data.tags) {
        tags[t.name] = t.value
      }
    } else if (data.tags && typeof data.tags === 'object') {
      for (const [k, v] of Object.entries(data.tags as Record<string, unknown>)) {
        if (typeof v === 'string') tags[k] = v
      }
    }

    // Sequence is the analytics group-by. We prefer an explicit `sequence`
    // tag but fall back to `category` or `type` so older call sites that
    // tagged with those names still get grouped instead of bucketed into
    // "(no tag)". Last-resort default keeps the transactional/magic-link
    // volume out of the "(no tag)" bucket.
    const sequence =
      tags.sequence ||
      tags.category ||
      tags.type ||
      (data.subject?.toLowerCase().includes('login link') ? 'magic-link' : null)
    const day = tags.day || null
    const clickUrl = data.click?.link || null

    // Open/click user agent — persisted so analytics can filter out mail-gateway
    // scanners (Defender/Mimecast/SafeLinks) from human engagement counts.
    const userAgent: string | null =
      (data as { click?: { userAgent?: string }; open?: { userAgent?: string } }).click
        ?.userAgent ||
      (data as { open?: { userAgent?: string } }).open?.userAgent ||
      null

    // Bounce classification. Only PERMANENT bounces suppress — Resend also
    // delivers Transient bounces (full mailbox, greylisting, temp outage)
    // which must NOT permanently kill an address.
    const bounceType = (data.bounce?.type || '').toLowerCase() || null
    const isPermanentBounce = bounceType === 'permanent'

    // Ensure project + bounce_type columns exist (one-shot migration; ALTER ... IF NOT EXISTS is safe)
    await sql`ALTER TABLE email_events ADD COLUMN IF NOT EXISTS project TEXT`
    await sql`ALTER TABLE email_events ADD COLUMN IF NOT EXISTS bounce_type TEXT`
    await sql`ALTER TABLE email_events ADD COLUMN IF NOT EXISTS user_agent TEXT`

    // Store in email_events table — tagged with project for downstream scoping.
    // bounce_type is persisted so backfill jobs (repair-email-suppression) can
    // tell permanent from transient bounces after the fact.
    await sql`
      INSERT INTO email_events (
        email_id, recipient, event_type, subject, sequence, day, click_url, project, bounce_type, user_agent, created_at
      ) VALUES (
        ${data.email_id},
        ${email},
        ${eventType},
        ${data.subject},
        ${sequence},
        ${day},
        ${clickUrl},
        ${project},
        ${bounceType},
        ${userAgent},
        NOW()
      )
    `

    // The Resend account is shared with byronwebstudio — only CEA events may
    // mutate CEA state (users.nurture_unsubscribed / email_suppression).
    // Convention everywhere downstream is COALESCE(project, 'cea') = 'cea',
    // i.e. NULL counts as CEA; here project is always computed, so gate on
    // the resolved value. Foreign-project events still get their event row.
    const isCeaEvent = project === 'cea'

    // Handle bounces — suppress future emails (PERMANENT bounces only;
    // transient bounces just keep their event row above)
    if (eventType === 'bounced') {
      if (isCeaEvent && isPermanentBounce) {
        console.log(`[Resend] Permanent bounce: ${email.slice(0, 3)}*** — suppressing from nurture`)
        await sql`
          UPDATE users SET nurture_unsubscribed = true
          WHERE LOWER(email) = ${email}
        `
      } else {
        console.log(`[Resend] Bounce (${bounceType || 'unknown type'}, project=${project}): ${email.slice(0, 3)}*** — event logged, no suppression`)
      }
    }

    // Handle complaints — suppress future emails globally + nurture-side
    if (eventType === 'complained' && isCeaEvent) {
      console.log(`[Resend] Complaint: ${email.slice(0, 3)}*** — suppressing globally`)
      await sql`
        UPDATE users SET nurture_unsubscribed = true
        WHERE LOWER(email) = ${email}
      `
      // Defence in depth: always add to global email_suppression on complaint,
      // not just when the email was a tagged cold-outreach send. A nurture
      // complaint should also globally block — otherwise a stray broadcast or
      // manual send could re-hit the complainant and bounce our complaint rate
      // toward Gmail's 0.30% red line.
      await sql`
        INSERT INTO email_suppression (email, reason, source)
        VALUES (${email}, 'complained', 'webhook:complained:nurture')
        ON CONFLICT (email) DO NOTHING
      `
    }

    // Handle permanent bounces — also add to global suppression (any further
    // send to a hard-bouncing address compounds reputation damage).
    if (eventType === 'bounced' && isCeaEvent && isPermanentBounce) {
      await sql`
        INSERT INTO email_suppression (email, reason, source)
        VALUES (${email}, 'hard-bounce', 'webhook:bounced:nurture')
        ON CONFLICT (email) DO NOTHING
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
            await sql`
              UPDATE prospect_outreach_log
              SET opened_count = opened_count + 1
              WHERE resend_email_id = ${data.email_id}
            `
            await sql`
              UPDATE prospect_clinics
              SET status = 'opened', updated_at = NOW()
              WHERE id = ${pidNum} AND status = 'sent'
            `
            await writeAnalyticsEvent('prospect_email_opened', {
              prospect_id: pidNum,
              template: templateSlug,
              mode,
              resend_email_id: data.email_id,
            })
          } else if (eventType === 'clicked') {
            await sql`
              UPDATE prospect_outreach_log
              SET clicked_count = clicked_count + 1
              WHERE resend_email_id = ${data.email_id}
            `
            // Click → status='engaged' is GATED OFF by default (2026-07-02).
            // Email click tracking is OFF for cold sends and click events are
            // dominated by SafeLinks/Mimecast scanner detonations — a single
            // stray scanner click flipped a clinic to 'engaged', which the
            // cron excludes, silently yanking it from the T2/T3 queue. Real
            // engagement comes from prospect_portal_views section beacons.
            // Set PROSPECT_CLICK_ENGAGED_ENABLED=true to restore the old flip.
            if (process.env.PROSPECT_CLICK_ENGAGED_ENABLED === 'true') {
              await sql`
                UPDATE prospect_clinics
                SET status = 'engaged', updated_at = NOW()
                WHERE id = ${pidNum} AND status IN ('sent', 'opened')
              `
            }
            await writeAnalyticsEvent('prospect_email_clicked', {
              prospect_id: pidNum,
              template: templateSlug,
              mode,
              click_url: data.click?.link,
              resend_email_id: data.email_id,
            })
          } else if (eventType === 'bounced' && !isPermanentBounce) {
            // Transient bounce — retryable; don't suppress or change clinic
            // status. The event row above is the record.
            console.log(`[Resend prospect] transient bounce prospect=${pidNum} — no suppression`)
          } else if (eventType === 'bounced' || eventType === 'complained') {
            const reason = eventType === 'bounced' ? 'hard-bounce' : 'complained'
            await sql`
              INSERT INTO email_suppression (email, reason, source)
              VALUES (${email}, ${reason}, ${'webhook:' + eventType + ':prospect-id:' + pidNum})
              ON CONFLICT (email) DO NOTHING
            `
            // bounced ≠ lost. Lost = explicit rejection. Bounced = wrong email,
            // can re-engage once a verified replacement is found. Surface as
            // distinct status so admin can filter the bounced queue.
            const newStatus = eventType === 'bounced' ? 'bounced' : 'lost'
            await sql`
              UPDATE prospect_clinics
              SET status = ${newStatus},
                  notes = COALESCE(notes, '') || ${'\n[auto] ' + new Date().toISOString() + ' webhook ' + eventType + ' — needs replacement email'},
                  updated_at = NOW()
              WHERE id = ${pidNum}
            `
            await writeAnalyticsEvent(`prospect_email_${eventType}`, {
              prospect_id: pidNum,
              template: templateSlug,
              mode,
              resend_email_id: data.email_id,
            })
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
    } catch (handlerErr) {
      // Release the claim so Svix's retry actually re-runs the handler
      // instead of being swallowed as a duplicate.
      if (dedupeKey) {
        try {
          await sql`DELETE FROM processed_webhook_events WHERE event_id = ${dedupeKey}`
        } catch (cleanupErr) {
          console.error('[Resend webhook] failed to release dedupe claim:', cleanupErr)
        }
      }
      throw handlerErr
    }
  } catch (error) {
    console.error('Resend webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Server-side analytics writer for cold-outreach engagement events.
 * Writes directly to analytics_events with a synthetic session ID so the
 * row joins cleanly with the existing analytics pipeline. Fire-and-forget;
 * failures don't propagate to the webhook response.
 */
async function writeAnalyticsEvent(
  eventType: string,
  eventData: Record<string, unknown>,
): Promise<void> {
  try {
    const sessionId = `prospect-webhook-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    await sql`
      INSERT INTO analytics_events (
        event_type, event_data, session_id, timestamp_ms, user_agent,
        referrer, path, search, ip, country
      ) VALUES (
        ${eventType},
        ${JSON.stringify(eventData)}::jsonb,
        ${sessionId},
        ${Date.now()},
        ${'resend-webhook'},
        ${null},
        ${'/api/webhooks/resend'},
        ${null},
        ${null},
        ${null}
      )
    `
  } catch (err) {
    console.error('[Analytics write failed]', err)
  }
}
