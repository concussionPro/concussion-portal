/**
 * Cal.com Webhook Handler
 *
 * Receives booking events (BOOKING_CREATED, BOOKING_RESCHEDULED,
 * BOOKING_CANCELLED, MEETING_ENDED) and auto-updates prospect status
 * so the engagement dashboard reflects real bookings — not just the
 * email-link click that preceded them.
 *
 * Setup: app.cal.com > Settings > Developer > Webhooks > New
 *   URL:    https://portal.concussion-education-australia.com/api/webhooks/cal
 *   Events: BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED
 *   Secret: copy → CAL_WEBHOOK_SECRET env var on Vercel
 *
 * Cal.com signs the request with HMAC-SHA256 of the raw body using the
 * shared secret. The hex digest is sent in `X-Cal-Signature-256`.
 *
 * Matching: attendee.email (lower-cased) joined to prospect_clinics
 * .contact_email. We don't fail loudly when no match — non-prospect
 * bookings (existing customers, friends, random) just get logged.
 *
 * Status transitions:
 *   BOOKING_CREATED  → status = 'engaged' (if currently in cold-funnel)
 *                      · stores cal_booked_at + cal_booking_id
 *   BOOKING_RESCHEDULED → updates cal_booked_at to new start time
 *   BOOKING_CANCELLED → clears cal_booked_at + cal_booking_id
 *                       · status NOT downgraded (the click history is real)
 *
 * Idempotency: cal_webhook_log holds (booking_uid, trigger_event) UNIQUE.
 * Re-deliveries no-op.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'

export const maxDuration = 30

interface CalWebhookPayload {
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_RESCHEDULED' | 'BOOKING_CANCELLED' | 'MEETING_ENDED' | string
  createdAt?: string
  payload: {
    uid?: string
    bookingId?: number
    title?: string
    type?: string
    startTime?: string
    endTime?: string
    bookerUrl?: string
    attendees?: Array<{ email?: string; name?: string; timeZone?: string }>
    organizer?: { email?: string; name?: string }
    rescheduleUid?: string
    cancellationReason?: string
    [k: string]: unknown
  }
}

function verifyCalSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.CAL_WEBHOOK_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('CAL_WEBHOOK_SECRET not set — rejecting webhook in production')
      return false
    }
    console.warn('CAL_WEBHOOK_SECRET not set — skipping verification (dev mode)')
    return true
  }
  if (!signatureHeader) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  // Constant-time compare to avoid timing leaks
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(signatureHeader.replace(/^sha256=/i, ''), 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

async function ensureSchema(): Promise<void> {
  // Lazy migration: add booking-tracking columns to prospect_clinics.
  // ALTER ... IF NOT EXISTS is safe to call repeatedly.
  await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS cal_booked_at TIMESTAMPTZ`
  await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS cal_booking_id TEXT`
  await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS cal_booking_status TEXT`

  await sql`
    CREATE TABLE IF NOT EXISTS cal_webhook_log (
      id              SERIAL PRIMARY KEY,
      booking_uid     TEXT NOT NULL,
      trigger_event   TEXT NOT NULL,
      attendee_email  TEXT,
      prospect_id     INTEGER,
      payload         JSONB NOT NULL,
      received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(booking_uid, trigger_event)
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_cal_webhook_log_attendee ON cal_webhook_log (attendee_email)`
  await sql`CREATE INDEX IF NOT EXISTS idx_cal_webhook_log_prospect ON cal_webhook_log (prospect_id)`
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-cal-signature-256') || req.headers.get('X-Cal-Signature-256')

  if (!verifyCalSignature(rawBody, signature)) {
    console.warn('[cal-webhook] Invalid signature — rejected')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: CalWebhookPayload
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const trigger = event.triggerEvent
  const payload = event.payload ?? ({} as CalWebhookPayload['payload'])
  const bookingUid = String(payload.uid ?? payload.bookingId ?? `unknown-${Date.now()}`)

  // First attendee = the prospect (organizer = Zac).
  const attendeeEmail = (payload.attendees?.[0]?.email ?? '').trim().toLowerCase()

  try {
    await ensureSchema()
  } catch (err) {
    console.error('[cal-webhook] Schema migration failed:', err)
    // Don't fail the webhook — cal.com will retry. Schema can be applied
    // out-of-band via /api/admin/prospect-schema-bootstrap if needed.
  }

  // Look up matching prospect (case-insensitive on email).
  let prospectId: number | null = null
  if (attendeeEmail) {
    try {
      const { rows } = await sql<{ id: number }>`
        SELECT id FROM prospect_clinics
        WHERE LOWER(contact_email) = ${attendeeEmail}
        LIMIT 1
      `
      prospectId = rows[0]?.id ?? null
    } catch (err) {
      console.error('[cal-webhook] Prospect lookup failed:', err)
    }
  }

  // Idempotent audit log — re-deliveries return DO NOTHING and we early-exit.
  let isReplay = false
  try {
    const { rowCount } = await sql`
      INSERT INTO cal_webhook_log (booking_uid, trigger_event, attendee_email, prospect_id, payload)
      VALUES (${bookingUid}, ${trigger}, ${attendeeEmail || null}, ${prospectId}, ${JSON.stringify(event)}::jsonb)
      ON CONFLICT (booking_uid, trigger_event) DO NOTHING
    `
    isReplay = rowCount === 0
  } catch (err) {
    console.error('[cal-webhook] Audit log insert failed:', err)
  }

  if (isReplay) {
    console.log(`[cal-webhook] Replay ignored: ${trigger} · ${bookingUid}`)
    return NextResponse.json({ ok: true, status: 'replay-ignored' })
  }

  // Update prospect status — only when we have a match. Non-prospect bookings
  // (existing customers, friends, random) are logged + ignored.
  if (prospectId !== null) {
    const startTime = payload.startTime ? new Date(payload.startTime) : new Date()
    try {
      if (trigger === 'BOOKING_CREATED') {
        // Promote to 'engaged' from any cold-funnel state. Don't downgrade
        // replied/won/lost — those are stronger states than engaged.
        await sql`
          UPDATE prospect_clinics
          SET
            status = CASE
              WHEN status IN ('researching', 'approved', 'sent', 'opened', 'engaged') THEN 'engaged'
              ELSE status
            END,
            cal_booked_at = ${startTime.toISOString()},
            cal_booking_id = ${bookingUid},
            cal_booking_status = 'booked',
            updated_at = NOW()
          WHERE id = ${prospectId}
        `
        console.log(`[cal-webhook] BOOKING_CREATED · prospect ${prospectId} (${attendeeEmail}) · status → engaged`)
      } else if (trigger === 'BOOKING_RESCHEDULED') {
        await sql`
          UPDATE prospect_clinics
          SET cal_booked_at = ${startTime.toISOString()},
              cal_booking_id = ${bookingUid},
              cal_booking_status = 'booked',
              updated_at = NOW()
          WHERE id = ${prospectId}
        `
        console.log(`[cal-webhook] BOOKING_RESCHEDULED · prospect ${prospectId} → ${startTime.toISOString()}`)
      } else if (trigger === 'BOOKING_CANCELLED') {
        // Don't downgrade status — the engagement signal (they booked once)
        // is still real. Just mark the booking as cancelled.
        await sql`
          UPDATE prospect_clinics
          SET cal_booking_status = 'cancelled',
              updated_at = NOW()
          WHERE id = ${prospectId} AND cal_booking_id = ${bookingUid}
        `
        console.log(`[cal-webhook] BOOKING_CANCELLED · prospect ${prospectId} (${attendeeEmail})`)
      }
    } catch (err) {
      console.error(`[cal-webhook] Status update failed for prospect ${prospectId}:`, err)
      // Don't 500 — audit log is already written, cal.com would retry needlessly
    }
  } else if (attendeeEmail) {
    console.log(`[cal-webhook] ${trigger} · no prospect match for ${attendeeEmail.slice(0, 3)}***`)
  }

  return NextResponse.json({
    ok: true,
    trigger,
    prospectMatched: prospectId !== null,
    bookingUid,
  })
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: 'cal-webhook',
    info: 'POST cal.com webhook events here. Configure CAL_WEBHOOK_SECRET in env.',
  })
}
