/**
 * Aggregate email deliverability stats.
 *
 * SENDS come from email_audit_log — the audit row is inserted before each
 * nurture send and rolled back when the send fails, so audit rows ≈ real
 * sends. (email_events has NO 'sent' rows: the Resend webhook subscribes
 * delivered/opened/clicked/bounced/complained only.)
 *
 * ENGAGEMENT comes from email_events (Resend webhook feed), deduped to
 * per-email rates. Project scoping uses the COALESCE(project,'cea')='cea'
 * convention (NULL = CEA; the Resend account is shared with Byron Web
 * Studio). Opens/clicks are counted only on delivered emails so the
 * numbers stay internally consistent: opens ≤ delivered ≤ sends.
 *
 * BOUNCES are split permanent vs transient via the bounce_type column the
 * webhook now persists; historical rows have bounce_type NULL and are
 * reported as 'unknown'. Only permanent bounces suppress.
 *
 * Auth: admin cookie / x-admin-key / Bearer (via isAdminRequest).
 * Query: ?days=30 (default 30, capped 365)
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { sequenceFromAuditKeySql } from '@/lib/email-sequence-stats'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const daysRaw = parseInt(url.searchParams.get('days') || '30', 10)
  const days = Math.max(1, Math.min(365, isNaN(daysRaw) ? 30 : daysRaw))

  try {
    // Lazy column migration — bounce_type is written by the new webhook
    // path; ensure it exists on older DBs so the split below can't 42703.
    await sql`ALTER TABLE email_events ADD COLUMN IF NOT EXISTS bounce_type TEXT`

    // ── Sends in the window, grouped by sequence (audit log = truth) ──
    // Test/preview audit rows (':test:' / '_test_' markers) are excluded
    // from every business metric.
    const seqCase = sequenceFromAuditKeySql('audit_key')
    const sendsResult = await sql.query(
      `SELECT ${seqCase} AS sequence, COUNT(*)::int AS sends
       FROM email_audit_log
       WHERE sent_at >= NOW() - ($1 || ' days')::INTERVAL
         AND audit_key NOT LIKE '%:test:%'
         AND audit_key NOT LIKE '%\\_test\\_%'
       GROUP BY 1`,
      [String(days)],
    )
    const sendsBySequence = new Map<string, number>()
    let totalAuditSends = 0
    for (const r of sendsResult.rows as Array<{ sequence: string; sends: number }>) {
      sendsBySequence.set(r.sequence, Number(r.sends))
      totalAuditSends += Number(r.sends)
    }

    // ── Per-email engagement roll-up in the window ──
    // opened/clicked are gated on delivered so opens ≤ delivered always.
    const { rows: totals } = await sql`
      WITH per_email AS (
        SELECT
          email_id,
          MAX(CASE WHEN event_type = 'delivered'  THEN 1 ELSE 0 END) AS delivered,
          MAX(CASE WHEN event_type = 'opened'     THEN 1 ELSE 0 END) AS opened,
          MAX(CASE WHEN event_type = 'clicked'    THEN 1 ELSE 0 END) AS clicked,
          MAX(CASE WHEN event_type = 'bounced'    THEN 1 ELSE 0 END) AS bounced,
          MAX(CASE WHEN event_type = 'bounced' AND LOWER(COALESCE(bounce_type, '')) = 'permanent' THEN 1 ELSE 0 END) AS bounced_permanent,
          MAX(CASE WHEN event_type = 'bounced' AND LOWER(COALESCE(bounce_type, '')) IN ('transient', 'undetermined') THEN 1 ELSE 0 END) AS bounced_transient,
          MAX(CASE WHEN event_type = 'bounced' AND bounce_type IS NULL THEN 1 ELSE 0 END) AS bounced_unknown,
          MAX(CASE WHEN event_type = 'complained' THEN 1 ELSE 0 END) AS complained
        FROM email_events
        WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
          AND COALESCE(project, 'cea') = 'cea'
        GROUP BY email_id
      )
      SELECT
        COUNT(*)::int                                                AS emails,
        COALESCE(SUM(delivered), 0)::int                             AS delivered,
        COALESCE(SUM(CASE WHEN delivered = 1 THEN opened  ELSE 0 END), 0)::int AS opened,
        COALESCE(SUM(CASE WHEN delivered = 1 THEN clicked ELSE 0 END), 0)::int AS clicked,
        COALESCE(SUM(bounced), 0)::int                               AS bounced,
        COALESCE(SUM(bounced_permanent), 0)::int                     AS bounced_permanent,
        COALESCE(SUM(bounced_transient), 0)::int                     AS bounced_transient,
        COALESCE(SUM(bounced_unknown), 0)::int                       AS bounced_unknown,
        COALESCE(SUM(complained), 0)::int                            AS complained
      FROM per_email
    `

    // ── Per-sequence engagement breakdown ──
    const { rows: bySequenceEvents } = await sql`
      WITH per_email AS (
        SELECT
          email_id,
          MAX(sequence) AS sequence,
          MAX(CASE WHEN event_type = 'delivered'  THEN 1 ELSE 0 END) AS delivered,
          MAX(CASE WHEN event_type = 'opened'     THEN 1 ELSE 0 END) AS opened,
          MAX(CASE WHEN event_type = 'clicked'    THEN 1 ELSE 0 END) AS clicked,
          MAX(CASE WHEN event_type = 'bounced'    THEN 1 ELSE 0 END) AS bounced,
          MAX(CASE WHEN event_type = 'bounced' AND LOWER(COALESCE(bounce_type, '')) = 'permanent' THEN 1 ELSE 0 END) AS bounced_permanent
        FROM email_events
        WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
          AND COALESCE(project, 'cea') = 'cea'
        GROUP BY email_id
      )
      SELECT
        COALESCE(sequence, '(no tag)')   AS sequence,
        COUNT(*)::int                     AS emails,
        COALESCE(SUM(delivered), 0)::int  AS delivered,
        COALESCE(SUM(CASE WHEN delivered = 1 THEN opened  ELSE 0 END), 0)::int AS opened,
        COALESCE(SUM(CASE WHEN delivered = 1 THEN clicked ELSE 0 END), 0)::int AS clicked,
        COALESCE(SUM(bounced), 0)::int           AS bounced,
        COALESCE(SUM(bounced_permanent), 0)::int AS bounced_permanent
      FROM per_email
      GROUP BY sequence
      ORDER BY emails DESC
      LIMIT 50
    `

    // Top clicked URLs in the window
    const { rows: topClicks } = await sql`
      SELECT click_url AS url, COUNT(*)::int AS clicks
      FROM email_events
      WHERE event_type = 'clicked'
        AND click_url IS NOT NULL
        AND created_at >= NOW() - (${days} || ' days')::INTERVAL
        AND COALESCE(project, 'cea') = 'cea'
      GROUP BY click_url
      ORDER BY clicks DESC
      LIMIT 20
    `

    const t = totals[0] || {
      emails: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0,
      bounced_permanent: 0, bounced_transient: 0, bounced_unknown: 0, complained: 0,
    }
    const pct = (num: number, denom: number) => denom > 0 ? Math.round((num / denom) * 1000) / 10 : 0

    // Merge audit-log send counts with event-feed engagement per sequence.
    // sends is clamped to ≥ delivered so the row stays internally consistent
    // even when a sequence has engagement events but no audit rows in window
    // (one-off blasts, pre-rollback historical sends).
    const eventSeqMap = new Map<string, { emails: number; delivered: number; opened: number; clicked: number; bounced: number; bouncedPermanent: number }>()
    for (const r of bySequenceEvents) {
      eventSeqMap.set(String(r.sequence), {
        emails: Number(r.emails), delivered: Number(r.delivered), opened: Number(r.opened),
        clicked: Number(r.clicked), bounced: Number(r.bounced), bouncedPermanent: Number(r.bounced_permanent),
      })
    }
    const allSequences = new Set<string>([...eventSeqMap.keys(), ...sendsBySequence.keys()])
    const bySequence = [...allSequences].map((sequence) => {
      const ev = eventSeqMap.get(sequence) ?? { emails: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, bouncedPermanent: 0 }
      const auditSends = sendsBySequence.get(sequence) ?? 0
      const sends = Math.max(auditSends, ev.delivered)
      return {
        sequence,
        sends,                       // audit-log truth (clamped ≥ delivered)
        auditSends,                  // raw audit-log count for transparency
        emails: ev.emails,           // emails with ≥1 webhook event (legacy field)
        delivered: ev.delivered,
        opened: ev.opened,
        clicked: ev.clicked,
        bounced: ev.bounced,
        bouncedPermanent: ev.bouncedPermanent,
        deliveryRate: pct(ev.delivered, sends),
        openRate: pct(ev.opened, ev.delivered),
        clickRate: pct(ev.clicked, ev.delivered),
      }
    }).sort((a, b) => b.sends - a.sends || b.emails - a.emails)

    const totalSends = Math.max(totalAuditSends, Number(t.delivered))

    return NextResponse.json({
      windowDays: days,
      totals: {
        sends: totalSends,                 // audit-log sends (clamped ≥ delivered)
        auditSends: totalAuditSends,
        emails: t.emails,                  // emails with ≥1 webhook event (legacy)
        delivered: t.delivered,
        opened: t.opened,
        clicked: t.clicked,
        bounced: t.bounced,
        bouncedPermanent: t.bounced_permanent,
        bouncedTransient: t.bounced_transient,
        bouncedUnknown: t.bounced_unknown,
        complained: t.complained,
        deliveryRate: pct(t.delivered, totalSends),
        openRate: pct(t.opened, t.delivered),
        clickRate: pct(t.clicked, t.delivered),
        clickThroughOnOpen: pct(t.clicked, t.opened),
        bounceRate: pct(t.bounced, totalSends),
      },
      bySequence,
      topClicks: topClicks.map((r) => ({ url: r.url, clicks: r.clicks })),
      note: 'Sends from email_audit_log (rolled back on failure ≈ real sends). Engagement per-email-deduped from Resend webhook events; opens/clicks counted on delivered emails only so opens ≤ delivered ≤ sends. Bounces split permanent/transient via bounce_type (NULL = historical/unknown).',
    })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') {
      return NextResponse.json({
        error: 'email_events or email_audit_log table missing — run scripts/add-email-events-table.ts / nurture cron once',
      }, { status: 503 })
    }
    console.error('email-stats error:', err)
    return NextResponse.json({ error: 'Failed to aggregate email events' }, { status: 500 })
  }
}
