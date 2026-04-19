/**
 * Aggregate email deliverability stats from the Resend webhook feed.
 * Each email_id can fire multiple events (delivered → opened → clicked);
 * we dedupe to per-email rates, then roll up totals and per-sequence
 * breakdown.
 *
 * Auth: admin cookie / x-admin-key / Bearer (via isAdminRequest).
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

  try {
    // Per-email roll-up in the window
    const { rows: totals } = await sql`
      WITH per_email AS (
        SELECT
          email_id,
          MAX(CASE WHEN event_type = 'delivered'  THEN 1 ELSE 0 END) AS delivered,
          MAX(CASE WHEN event_type = 'opened'     THEN 1 ELSE 0 END) AS opened,
          MAX(CASE WHEN event_type = 'clicked'    THEN 1 ELSE 0 END) AS clicked,
          MAX(CASE WHEN event_type = 'bounced'    THEN 1 ELSE 0 END) AS bounced,
          MAX(CASE WHEN event_type = 'complained' THEN 1 ELSE 0 END) AS complained
        FROM email_events
        WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
        GROUP BY email_id
      )
      SELECT
        COUNT(*)::int                  AS emails,
        COALESCE(SUM(delivered), 0)::int  AS delivered,
        COALESCE(SUM(opened), 0)::int     AS opened,
        COALESCE(SUM(clicked), 0)::int    AS clicked,
        COALESCE(SUM(bounced), 0)::int    AS bounced,
        COALESCE(SUM(complained), 0)::int AS complained
      FROM per_email
    `

    // Per-sequence breakdown
    const { rows: bySequence } = await sql`
      WITH per_email AS (
        SELECT
          email_id,
          MAX(sequence) AS sequence,
          MAX(CASE WHEN event_type = 'delivered'  THEN 1 ELSE 0 END) AS delivered,
          MAX(CASE WHEN event_type = 'opened'     THEN 1 ELSE 0 END) AS opened,
          MAX(CASE WHEN event_type = 'clicked'    THEN 1 ELSE 0 END) AS clicked,
          MAX(CASE WHEN event_type = 'bounced'    THEN 1 ELSE 0 END) AS bounced
        FROM email_events
        WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
        GROUP BY email_id
      )
      SELECT
        COALESCE(sequence, '(no tag)')   AS sequence,
        COUNT(*)::int                     AS emails,
        COALESCE(SUM(delivered), 0)::int  AS delivered,
        COALESCE(SUM(opened), 0)::int     AS opened,
        COALESCE(SUM(clicked), 0)::int    AS clicked,
        COALESCE(SUM(bounced), 0)::int    AS bounced
      FROM per_email
      GROUP BY sequence
      ORDER BY emails DESC
      LIMIT 30
    `

    // Top clicked URLs in the window
    const { rows: topClicks } = await sql`
      SELECT click_url AS url, COUNT(*)::int AS clicks
      FROM email_events
      WHERE event_type = 'clicked'
        AND click_url IS NOT NULL
        AND created_at >= NOW() - (${days} || ' days')::INTERVAL
      GROUP BY click_url
      ORDER BY clicks DESC
      LIMIT 20
    `

    const t = totals[0] || { emails: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 }
    const pct = (num: number, denom: number) => denom > 0 ? Math.round((num / denom) * 1000) / 10 : 0

    return NextResponse.json({
      windowDays: days,
      totals: {
        emails: t.emails,
        delivered: t.delivered,
        opened: t.opened,
        clicked: t.clicked,
        bounced: t.bounced,
        complained: t.complained,
        deliveryRate: pct(t.delivered, t.emails),
        openRate: pct(t.opened, t.delivered),
        clickRate: pct(t.clicked, t.delivered),
        clickThroughOnOpen: pct(t.clicked, t.opened),
        bounceRate: pct(t.bounced, t.emails),
      },
      bySequence: bySequence.map((r) => ({
        sequence: r.sequence,
        emails: r.emails,
        delivered: r.delivered,
        opened: r.opened,
        clicked: r.clicked,
        openRate: pct(r.opened, r.delivered),
        clickRate: pct(r.clicked, r.delivered),
      })),
      topClicks: topClicks.map((r) => ({ url: r.url, clicks: r.clicks })),
      note: 'Rates are per-email (deduped by email_id). Open rate is denominated on delivered. Requires Resend webhook configured in dashboard.',
    })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') {
      return NextResponse.json({
        error: 'email_events table missing — run scripts/add-email-events-table.ts',
      }, { status: 503 })
    }
    console.error('email-stats error:', err)
    return NextResponse.json({ error: 'Failed to aggregate email events' }, { status: 500 })
  }
}
