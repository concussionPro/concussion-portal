/**
 * Backfill opened/clicked events by polling Resend's GET /emails/:id endpoint.
 *
 * The webhook only fires for event types ticked in the Resend dashboard — if
 * email.opened / email.clicked weren't ticked, those rows never land in
 * email_events and the analytics dashboard shows 0% open/click. This endpoint
 * walks recent delivered emails and fills the gap from Resend's own record.
 *
 * Works off `last_event`:
 *   - 'clicked' → synthesises both opened + clicked rows (click implies open)
 *   - 'opened'  → synthesises opened row
 *   - anything else → nothing to add
 *
 * Auth: admin. Rate-limited to ~2 rps to respect Resend API limits.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { getResend } from '@/lib/resend-client'

export const runtime = 'nodejs'
export const maxDuration = 60

// Process N calls in parallel per batch, then pause BATCH_PAUSE_MS.
// Resend's API limit is 2 rps on the write path but much higher on reads
// (emails.get). 5 parallel × 500ms pause ≈ 10 rps, well-behaved.
const BATCH_SIZE = 5
const BATCH_PAUSE_MS = 500
// Cap at a size that comfortably fits under Vercel's 60s maxDuration even with
// network latency. (150/5)*500ms = 15s of sleeps + ~15s of parallel network.
const MAX_EMAILS_PER_RUN = 150

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = getResend()
  if (!resend) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured.' }, { status: 503 })
  }

  const url = new URL(request.url)
  const daysRaw = parseInt(url.searchParams.get('days') || '30', 10)
  const days = Math.max(1, Math.min(365, isNaN(daysRaw) ? 30 : daysRaw))

  try {
    // Candidates: email_ids that were delivered in the window but don't yet
    // have an opened/clicked row. Newest first so partial runs hit the most
    // recent emails (most likely to carry open/click data, especially when
    // tracking was only recently enabled).
    const { rows: candidates } = await sql<{ email_id: string; recipient: string; subject: string | null; sequence: string | null; day: string | null }>`
      SELECT
        email_id,
        (ARRAY_AGG(recipient ORDER BY created_at DESC))[1] AS recipient,
        (ARRAY_AGG(subject   ORDER BY created_at DESC))[1] AS subject,
        (ARRAY_AGG(sequence  ORDER BY created_at DESC))[1] AS sequence,
        (ARRAY_AGG(day       ORDER BY created_at DESC))[1] AS day,
        MAX(created_at) AS latest_at
      FROM email_events
      WHERE event_type = 'delivered'
        AND created_at >= NOW() - (${days} || ' days')::INTERVAL
        AND NOT EXISTS (
          SELECT 1 FROM email_events e
          WHERE e.email_id = email_events.email_id
            AND e.event_type IN ('opened', 'clicked')
        )
      GROUP BY email_id
      ORDER BY latest_at DESC
      LIMIT ${MAX_EMAILS_PER_RUN}
    `

    let opened = 0
    let clicked = 0
    let skipped = 0
    let errors = 0

    type Candidate = typeof candidates[number]

    async function processOne(c: Candidate) {
      try {
        const res = await resend!.emails.get(c.email_id)
        const last = res.data?.last_event
        if (last === 'clicked') {
          await sql`
            INSERT INTO email_events (email_id, recipient, event_type, subject, sequence, day, click_url, created_at)
            VALUES (${c.email_id}, ${c.recipient}, 'opened', ${c.subject}, ${c.sequence}, ${c.day}, NULL, NOW())
          `
          await sql`
            INSERT INTO email_events (email_id, recipient, event_type, subject, sequence, day, click_url, created_at)
            VALUES (${c.email_id}, ${c.recipient}, 'clicked', ${c.subject}, ${c.sequence}, ${c.day}, NULL, NOW())
          `
          opened++
          clicked++
        } else if (last === 'opened') {
          await sql`
            INSERT INTO email_events (email_id, recipient, event_type, subject, sequence, day, click_url, created_at)
            VALUES (${c.email_id}, ${c.recipient}, 'opened', ${c.subject}, ${c.sequence}, ${c.day}, NULL, NOW())
          `
          opened++
        } else {
          skipped++
        }
      } catch (e) {
        errors++
        console.error(`[sync-resend-events] failed for ${c.email_id}:`, e)
      }
    }

    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      const batch = candidates.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(processOne))
      if (i + BATCH_SIZE < candidates.length) await sleep(BATCH_PAUSE_MS)
    }

    return NextResponse.json({
      ok: true,
      windowDays: days,
      checked: candidates.length,
      inserted: { opened, clicked },
      skipped,
      errors,
      capped: candidates.length >= MAX_EMAILS_PER_RUN,
    })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') {
      return NextResponse.json({ error: 'email_events table missing.' }, { status: 503 })
    }
    console.error('sync-resend-events error:', err)
    return NextResponse.json({ error: 'Sync failed.' }, { status: 500 })
  }
}
