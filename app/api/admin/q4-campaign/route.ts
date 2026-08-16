import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * GET /api/admin/q4-campaign — the Q4 course-registration campaign tracker
 * (owner 2026-08-16: "create a course registration outreach in analytics for
 * us to track this q4 blast"). Aggregates, per lane:
 *  - sends: email_audit_log keys `q4-mel-nov7:<segment>:<email>` written by
 *    the quarterly-practical-blast send loop
 *  - nominations: workshop_interest rows written by the one-click city
 *    buttons (source 'q4-blast-click') — the Sydney/Byron demand counts
 *  - traffic: analytics_events carrying utm_campaign=quarterly_blast_v1
 *  - purchases: course_purchases from blast-audited emails after first send
 * Read-only; every number is zero until the blast fires.
 */
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const out: Record<string, unknown> = {}
  try {
    const { rows } = await sql`
      SELECT split_part(audit_key, ':', 2) AS segment, COUNT(*)::int AS n,
             MIN(sent_at) AS first, MAX(sent_at) AS last
      FROM email_audit_log WHERE audit_key LIKE 'q4-mel-nov7:%' GROUP BY 1`
    out.blastSends = rows
  } catch { out.blastSends = [] }

  try {
    const { rows } = await sql`
      SELECT city, COUNT(*)::int AS nominations FROM workshop_interest
      WHERE source = 'q4-blast-click' GROUP BY city ORDER BY 2 DESC`
    out.cityNominations = rows
  } catch { out.cityNominations = [] }

  try {
    const { rows } = await sql`
      SELECT COUNT(DISTINCT session_id)::int AS sessions,
             COUNT(*) FILTER (WHERE event_type = 'checkout_start')::int AS checkout_starts,
             COUNT(*) FILTER (WHERE event_type = 'purchase_complete')::int AS purchases
      FROM analytics_events
      WHERE (COALESCE(search, '') LIKE '%quarterly_blast_v1%' OR event_data::text LIKE '%quarterly_blast_v1%')
        AND created_at >= '2026-08-14'`
    out.campaignTraffic = rows[0]
  } catch { out.campaignTraffic = null }

  try {
    const { rows } = await sql`
      SELECT COUNT(*)::int AS buyers, COALESCE(SUM(amount_aud), 0)::float AS revenue_aud
      FROM course_purchases cp
      WHERE LOWER(cp.user_email) IN (
        SELECT split_part(audit_key, ':', 3) FROM email_audit_log WHERE audit_key LIKE 'q4-mel-nov7:%'
      ) AND cp.purchased_at >= (SELECT MIN(sent_at) FROM email_audit_log WHERE audit_key LIKE 'q4-mel-nov7:%')`
    out.attributedPurchases = rows[0]
  } catch { out.attributedPurchases = null }

  return NextResponse.json(out)
}
