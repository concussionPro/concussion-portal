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
    // Every campaign click session with its full nav shape, classified.
    // A human landing generates a stream of events over minutes (page views,
    // card-in-view, stream switches, checkout starts); a scanner detonation
    // generates exactly one 0-second hit — and often walks multiple links
    // from the same email within the same second. The verdict encodes that:
    //   scanner  — ≤1 event and <5s, or its IP hit ≥2 distinct email links
    //   human    — ≥3 events over ≥10s
    //   unclear  — anything between
    const { rows: sess } = await sql`
      WITH s AS (
        SELECT session_id, MIN(ip) AS ip, MIN(country) AS country,
               MIN(created_at) AS first_ev,
               EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))::int AS dur_s,
               COUNT(*)::int AS events,
               COUNT(DISTINCT path)::int AS pages,
               ARRAY_AGG(DISTINCT substring(search FROM 'utm_content=([a-z_-]+)')) AS links,
               MIN(user_email) AS user_email
        FROM analytics_events
        WHERE search LIKE '%quarterly_blast_v1%' AND created_at >= '2026-08-16'
        GROUP BY session_id
      ), ip_links AS (
        SELECT ip, COUNT(DISTINCT substring(search FROM 'utm_content=([a-z_-]+)'))::int AS n
        FROM analytics_events
        WHERE search LIKE '%quarterly_blast_v1%' AND created_at >= '2026-08-16'
        GROUP BY ip
      )
      SELECT s.*, COALESCE(il.n, 1) AS ip_distinct_links,
        CASE
          WHEN COALESCE(il.n, 1) >= 2 THEN 'scanner'
          WHEN s.events <= 1 AND s.dur_s < 5 THEN 'scanner'
          WHEN s.events >= 3 AND s.dur_s >= 10 THEN 'human'
          ELSE 'unclear'
        END AS verdict
      FROM s LEFT JOIN ip_links il ON il.ip = s.ip
      ORDER BY s.first_ev DESC`
    out.clickSessions = sess
  } catch { out.clickSessions = [] }

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

  // ---- Mac Mail 1:1 round (q4_mail_v1, from 2026-08-18) ---------------------
  // Owner: "mel7 data must show up clean in /analytics — clicks, user nav,
  // log checkout abandons for follow up." Same patterns as the blast section:
  // clicks = on-domain page_views carrying utm (no Resend tracking); verdicts
  // reuse the scanner heuristics; abandons = checkout_start sessions with no
  // purchase_complete, surfaced with the stitched email for manual follow-up.
  const MAIL_START = '2026-08-18 07:50'  // first 1:1 send 17:52 AEST — earlier same-day traffic is page QA, not campaign

  // Known mail-scanner IPs: any IP that walked 2+ distinct blast links (the
  // Defender-detonation fingerprint). Excluded from every 1:1 metric so a
  // scanner can never fake a click, a session, or an abandon again.
  let scannerIps: string[] = []
  try {
    const { rows } = await sql`
      SELECT ip FROM analytics_events
      WHERE search LIKE '%quarterly_blast_v1%' AND ip IS NOT NULL
      GROUP BY ip
      HAVING COUNT(DISTINCT substring(search FROM 'utm_content=([a-z_-]+)')) >= 2
          OR (COUNT(*) = 1 AND MAX(created_at) - MIN(created_at) = INTERVAL '0')`
    scannerIps = rows.map((r) => String(r.ip))
  } catch { scannerIps = [] }
  // @vercel/postgres params take primitives only — pass the set as a text[] literal.
  const scannerArr = '{' + scannerIps.map((s) => s.replace(/[{},"\\]/g, '')).join(',') + '}'

  try {
    // Real sends-so-far: each Mac Mail send writes an audit row
    // (q4-mail-v1:<variant>:<email>) — the portal's only view into Mail.app.
    const { rows } = await sql`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE audit_key LIKE 'q4-mail-v1:upgrade:%')::int AS upgrade,
             COUNT(*) FILTER (WHERE audit_key LIKE 'q4-mail-v1:registered:%')::int AS registered,
             COUNT(*) FILTER (WHERE audit_key LIKE 'q4-mail-v1:other:%')::int AS other
      FROM email_audit_log WHERE audit_key LIKE 'q4-mail-v1:%'`
    out.mailSends = rows[0]
  } catch { out.mailSends = null }

  // The 1:1 emails carry CLEAN BARE LINKS (no utm — personal-note doctrine), so
  // campaign traffic is keyed on the PAGES, not params: /melbourne-nov7 is
  // noindex and email-only, so any visit since MAIL_START is campaign traffic.
  // Blast-era visits stay separable (they carried quarterly_blast_v1 utm).
  try {
    const { rows } = await sql`
      SELECT
        COUNT(DISTINCT session_id) FILTER (WHERE path = '/melbourne-nov7')::int AS train,
        COUNT(DISTINCT session_id) FILTER (WHERE path = '/ep-course/dashboard')::int AS train_upgrade
      FROM analytics_events
      WHERE created_at >= ${MAIL_START}
        AND path IN ('/melbourne-nov7', '/ep-course/dashboard')
        AND COALESCE(search, '') NOT LIKE '%quarterly_blast_v1%'
        AND (ip IS NULL OR NOT (ip = ANY(${scannerArr}::text[])))`
    out.mailCtaClicks = rows[0]
  } catch { out.mailCtaClicks = null }

  try {
    const { rows } = await sql`
      SELECT COUNT(DISTINCT session_id)::int AS sessions,
             COUNT(*) FILTER (WHERE event_type = 'checkout_start')::int AS checkout_starts,
             COUNT(*) FILTER (WHERE event_type = 'purchase_complete')::int AS purchases
      FROM analytics_events
      WHERE created_at >= ${MAIL_START}
        AND session_id IN (
          SELECT DISTINCT session_id FROM analytics_events
          WHERE path = '/melbourne-nov7' AND created_at >= ${MAIL_START}
            AND COALESCE(search, '') NOT LIKE '%quarterly_blast_v1%'
            AND (ip IS NULL OR NOT (ip = ANY(${scannerArr}::text[]))))`
    out.mailTraffic = rows[0]
  } catch { out.mailTraffic = null }

  try {
    const { rows: sess } = await sql`
      WITH s AS (
        SELECT session_id, MIN(ip) AS ip, MIN(country) AS country,
               MIN(created_at) AS first_ev,
               EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))::int AS dur_s,
               COUNT(*)::int AS events,
               COUNT(DISTINCT path)::int AS pages,
               MIN(user_email) AS user_email
        FROM analytics_events
        WHERE created_at >= ${MAIL_START}
          AND session_id IN (
            SELECT DISTINCT session_id FROM analytics_events
            WHERE path = '/melbourne-nov7' AND created_at >= ${MAIL_START}
              AND COALESCE(search, '') NOT LIKE '%quarterly_blast_v1%'
              AND (ip IS NULL OR NOT (ip = ANY(${scannerArr}::text[]))))
        GROUP BY session_id)
      SELECT s.*,
        CASE
          WHEN s.events <= 1 AND s.dur_s < 5 THEN 'scanner'
          WHEN s.events >= 3 AND s.dur_s >= 10 THEN 'human'
          ELSE 'unclear'
        END AS verdict
      FROM s ORDER BY s.first_ev DESC LIMIT 100`
    out.mailClickSessions = sess
  } catch { out.mailClickSessions = [] }

  try {
    // ABANDONS FOR FOLLOW-UP: campaign sessions that started checkout and never
    // completed. Email comes from identity stitching; anonymous abandons still
    // listed (ip/time) so the Stripe recovery emails can be cross-checked.
    const { rows: abandons } = await sql`
      WITH cs AS (
        SELECT session_id, MIN(created_at) AS started_at, MIN(user_email) AS user_email, MIN(ip) AS ip
        FROM analytics_events
        WHERE event_type = 'checkout_start' AND created_at >= ${MAIL_START}
          AND (COALESCE(search, '') LIKE '%q4_mail_v1%' OR event_data::text LIKE '%melbourne-nov7%')
          AND (ip IS NULL OR NOT (ip = ANY(${scannerArr}::text[])))
        GROUP BY session_id)
      SELECT cs.session_id, cs.started_at, cs.user_email, cs.ip
      FROM cs
      WHERE NOT EXISTS (
        SELECT 1 FROM analytics_events p
        WHERE p.session_id = cs.session_id AND p.event_type = 'purchase_complete')
      AND NOT EXISTS (
        SELECT 1 FROM course_purchases cp
        WHERE cs.user_email IS NOT NULL AND LOWER(cp.user_email) = LOWER(cs.user_email)
          AND cp.purchased_at >= cs.started_at)
      ORDER BY cs.started_at DESC LIMIT 50`
    out.mailAbandons = abandons
  } catch { out.mailAbandons = [] }

  return NextResponse.json(out)
}
