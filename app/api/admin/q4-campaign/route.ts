import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * GET /api/admin/q4-campaign — the Q4 course-registration campaign tracker
 * (owner 2026-08-16: "create a course registration outreach in analytics for
 * us to track this q4 blast"). Aggregates, per lane:
 *  - sends: email_audit_log keys `q4-mel-nov7:<segment>:<email>` written by
 *    the quarterly-practical-blast send loop
 *  - nominations: workshop_interest rows with source 'q4-blast-confirmed' —
 *    written ONLY by the on-page Confirm tap. The original one-click rows
 *    ('q4-blast-click', quarantined to 'q4-blast-click-suspect' 2026-08-16)
 *    were Microsoft Defender link detonations, not humans — every one came
 *    from an M365 corporate/gov/school domain and most source IPs also hit
 *    the /upgrade link within seconds. They are reported separately and
 *    count toward NOTHING.
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
      SELECT LOWER(REPLACE(city, ' ', '-')) AS city, COUNT(*)::int AS nominations
      FROM workshop_interest
      WHERE source = 'q4-blast-confirmed' GROUP BY 1 ORDER BY 2 DESC`
    out.cityNominations = rows
  } catch { out.cityNominations = [] }

  try {
    // The nominators themselves — the owner messages these people directly.
    // Confirmed (human tap on the landing page) and suspect (scanner
    // detonation) are returned as separate lists, never merged.
    const { rows } = await sql`
      SELECT LOWER(REPLACE(wi.city, ' ', '-')) AS city, wi.email, wi.created_at, wi.source,
             COALESCE(NULLIF(u.name, ''), NULLIF(wi.name, ''), '') AS name,
             (SELECT a.country FROM analytics_events a
               WHERE LOWER(a.user_email) = LOWER(wi.email) AND a.country IS NOT NULL
               ORDER BY a.created_at DESC LIMIT 1) AS country
      FROM workshop_interest wi
      LEFT JOIN users u ON LOWER(u.email) = LOWER(wi.email)
      WHERE wi.source IN ('q4-blast-confirmed', 'q4-blast-click-suspect')
      ORDER BY wi.created_at DESC`
    out.nominationDetail = rows.filter((r) => r.source === 'q4-blast-confirmed')
    out.suspectDetail = rows.filter((r) => r.source === 'q4-blast-click-suspect')
  } catch { out.nominationDetail = []; out.suspectDetail = [] }

  try {
    // Per-CTA engagement WITHOUT Resend tracking (open/click tracking is off
    // for deliverability): every email CTA lands on our domain carrying
    // utm_content, so clicks are page_views with that marker; nominate
    // buttons are counted server-side at the click itself.
    const { rows: ctas } = await sql`
      SELECT
        COUNT(*) FILTER (WHERE search LIKE '%book_melbourne%')::int AS book_melbourne,
        COUNT(*) FILTER (WHERE search LIKE '%utm_content=upgrade%')::int AS upgrade,
        COUNT(*) FILTER (WHERE search LIKE '%start_online%')::int AS start_online
      FROM analytics_events
      WHERE search LIKE '%quarterly_blast_v1%' AND created_at >= '2026-08-14'`
    out.ctaClicks = ctas[0]
  } catch { out.ctaClicks = null }

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
