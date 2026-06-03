/**
 * GET /api/admin/email-suppression-events
 *
 * Returns the actual complained + bounced events from email_events for the
 * CEA project, so we can identify who hit the spam button or hard-bounced
 * and cross-check that nurture_unsubscribed got set on the matching user
 * + email_suppression row exists (= unsubscribe / suppression flow worked).
 *
 * Query: ?days=30 (default 30, capped 365)
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const daysRaw = parseInt(url.searchParams.get('days') || '30', 10)
  const days = Math.max(1, Math.min(365, isNaN(daysRaw) ? 30 : daysRaw))

  const { rows: events } = await sql<{
    recipient: string
    event_type: string
    subject: string | null
    sequence: string | null
    created_at: string
    email_id: string
  }>`
    SELECT recipient, event_type, subject, sequence, created_at, email_id
    FROM email_events
    WHERE event_type IN ('complained', 'bounced')
      AND created_at >= NOW() - (${days} || ' days')::INTERVAL
      AND COALESCE(project, 'cea') = 'cea'
    ORDER BY created_at DESC
  `

  const recipients = [...new Set(events.map((e) => e.recipient))]
  const userRowsByEmail = new Map<
    string,
    { id: string; nurtureUnsubscribed: boolean; accessLevel: string; name: string | null }
  >()
  if (recipients.length > 0) {
    const { rows: userRows } = await sql<{
      id: string
      email: string
      name: string | null
      access_level: string
      nurture_unsubscribed: boolean
    }>`
      SELECT id, email, name, access_level, nurture_unsubscribed
      FROM users
      WHERE LOWER(email) = ANY(${recipients})
    `
    for (const u of userRows) {
      userRowsByEmail.set(u.email.toLowerCase(), {
        id: u.id,
        nurtureUnsubscribed: u.nurture_unsubscribed,
        accessLevel: u.access_level,
        name: u.name,
      })
    }
  }

  let suppressionRows: Array<{ email: string; reason: string; source: string | null; created_at: string }> = []
  try {
    const r = await sql<{ email: string; reason: string; source: string | null; created_at: string }>`
      SELECT email, reason, source, created_at
      FROM email_suppression
      WHERE LOWER(email) = ANY(${recipients})
    `
    suppressionRows = r.rows
  } catch {
    suppressionRows = []
  }
  const suppressionByEmail = new Map<string, (typeof suppressionRows)[number]>()
  for (const s of suppressionRows) {
    suppressionByEmail.set(s.email.toLowerCase(), s)
  }

  const enriched = events.map((e) => {
    const user = userRowsByEmail.get(e.recipient.toLowerCase())
    const supp = suppressionByEmail.get(e.recipient.toLowerCase())
    return {
      recipient: e.recipient,
      eventType: e.event_type,
      subject: e.subject,
      sequence: e.sequence,
      sentToAt: e.created_at,
      emailId: e.email_id,
      userFound: !!user,
      userName: user?.name ?? null,
      accessLevel: user?.accessLevel ?? null,
      nurtureUnsubscribed: user?.nurtureUnsubscribed ?? null,
      suppressionRowExists: !!supp,
      suppressionReason: supp?.reason ?? null,
      suppressionSource: supp?.source ?? null,
    }
  })

  return NextResponse.json({
    windowDays: days,
    complained: enriched.filter((e) => e.eventType === 'complained'),
    bounced: enriched.filter((e) => e.eventType === 'bounced'),
    totals: {
      complained: enriched.filter((e) => e.eventType === 'complained').length,
      bounced: enriched.filter((e) => e.eventType === 'bounced').length,
    },
  })
}
