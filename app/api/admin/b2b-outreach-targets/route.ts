/**
 * B2B Personal-Outreach Targets endpoint.
 *
 * Surfaces the prospects/leads who deserve a personal phone call or
 * email from Zac directly — NOT another templated cold send. These are
 * the candidates for $8k+ on-site team training engagements, one per
 * month, east-coast travel cadence (NSW VIC QLD ACT SA).
 *
 * Scoring weighting reflects what a real B2B buying signal looks like:
 *   pricing_page  view    : +20  (saw price, didn't leave)
 *   checkout_start        : +30  (started the form, didn't finish)
 *   /proposals/* visit    : +25  (deep dive on a tailored portal)
 *   workshop_interest     : +15  per submit (filled out the form)
 *   email click           : +5   (engaged with content)
 *   email open            : +2
 *   team_size >= 8        : +10  (bigger deal upside)
 *   team_size >= 16       : +20  (multi-clinic candidate)
 *
 * Filters:
 *   - state in (NSW, VIC, QLD, ACT, SA)
 *   - not already converted (no online-only / full-course access)
 *   - not nurture_unsubscribed
 *   - status NOT in (archived, bounced, won, lost)
 *
 * Per-row "angle" is the recommended opening line for the personal
 * outreach. Built from the dominant intent signal so Zac doesn't have
 * to read the row to know why this lead is here.
 *
 * Sources unioned:
 *   - prospect_clinics (cold pool with known team size + role)
 *   - workshop_interest (anyone who filled out the workshop-interest form)
 *   - portal-portal proposal visitors (the Lauren-pattern: opened a
 *     custom /proposals/X portal, browsed for 30+ minutes)
 *
 * Auth: admin cookie / x-admin-key / Bearer via isAdminRequest.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

export const runtime = 'nodejs'
export const maxDuration = 30

type Row = {
  email: string
  clinic: string | null
  firstName: string | null
  fullName: string | null
  role: string | null
  state: string | null
  city: string | null
  region: string | null
  teamSize: number | null
  source: string

  opens: number
  clicks: number
  lastClickedSubject: string | null
  lastClickAt: string | null

  pricingViews: number
  checkoutStarts: number
  portalViews: number
  lastSiteIntentAt: string | null

  wiSubmits: number
  wiCities: string | null

  intentScore: number
  angle: string
  lastSignalAt: string | null
}

function buildAngle(r: Omit<Row, 'angle'>): string {
  // Rank from most actionable buying signal to least, pick the first hit.
  if (r.checkoutStarts > 0) {
    return `Started checkout — hit a wall. Call today: "I saw you started enrolling, anything I can clear up before you finish?"`
  }
  if (r.portalViews >= 3) {
    return `Deep dive on the tailored portal (${r.portalViews} views). Personal email: reference what they actually opened.`
  }
  if (r.pricingViews >= 2) {
    return `Multi-visit pricing browser — budget hesitation. Personal email: offer in-house option as alternative to public workshop.`
  }
  if (r.wiSubmits >= 2 || (r.wiCities && r.wiCities.split(',').length >= 2)) {
    return `Workshop-interest signer for ${r.wiSubmits} cities — date uncertain. Phone: confirm timing OR pitch in-house ($8k flat).`
  }
  if ((r.clicks ?? 0) >= 4) {
    return `${r.clicks} email clicks, no purchase. Phone or LinkedIn DM — they're reading everything but not buying.`
  }
  if (r.wiSubmits >= 1) {
    return `Workshop interest registered — warm. Personal email: confirm intent, offer dates or in-house alternative.`
  }
  if ((r.teamSize ?? 0) >= 8 && (r.opens ?? 0) >= 3) {
    return `Multi-clinician practice opening emails. Cold call the front desk, ask for the principal.`
  }
  if ((r.clicks ?? 0) >= 1) {
    return `Clicked through — warm. Personal email referencing what they clicked.`
  }
  return `Opening emails. Worth a personalised follow-up referencing their clinic-specific concussion caseload.`
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const states = (url.searchParams.get('states') || 'NSW,VIC,QLD,ACT,SA')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{2,4}$/.test(s)) // hard whitelist — only 2–4 uppercase letters allowed
  const minScore = Math.max(0, parseInt(url.searchParams.get('minScore') || '5', 10))
  // The Neon `sql` tag only binds primitives, not arrays. Build a CSV
  // string and split it back to a TEXT[] inside the query.
  const statesCsv = states.join(',')

  try {
    const { rows } = await sql<Row>`
      WITH email_engagement AS (
        SELECT LOWER(recipient) AS email,
               COUNT(*) FILTER (WHERE event_type='opened')::int  AS opens,
               COUNT(*) FILTER (WHERE event_type='clicked')::int AS clicks,
               MAX(created_at) FILTER (WHERE event_type='clicked') AS last_click_at,
               MAX(subject)    FILTER (WHERE event_type='clicked') AS last_clicked_subject
        FROM email_events
        WHERE created_at >= NOW() - INTERVAL '90 days'
          AND COALESCE(project, 'cea') = 'cea'
        GROUP BY LOWER(recipient)
      ),
      site_intent AS (
        SELECT LOWER(user_email) AS email,
               COUNT(*) FILTER (WHERE event_type='pricing_page')::int    AS pricing_views,
               COUNT(*) FILTER (WHERE event_type='checkout_start')::int  AS checkout_starts,
               COUNT(*) FILTER (WHERE path LIKE '/proposals/%' AND event_type='page_view')::int AS portal_views,
               MAX(created_at) FILTER (
                 WHERE event_type IN ('pricing_page','checkout_start','enrol_click') OR path LIKE '/proposals/%'
               ) AS last_site_intent_at
        FROM analytics_events
        WHERE created_at >= NOW() - INTERVAL '90 days'
          AND user_email IS NOT NULL
        GROUP BY LOWER(user_email)
      ),
      wi AS (
        SELECT LOWER(email) AS email,
               MIN(name)    AS name,
               COUNT(*)::int AS submits,
               STRING_AGG(DISTINCT city, ',') AS cities,
               MAX(created_at) AS last_submit_at
        FROM workshop_interest
        GROUP BY LOWER(email)
      ),
      converted AS (
        SELECT LOWER(email) AS email FROM users
        WHERE access_level IN ('online-only','full-course')
      ),
      unsubbed AS (
        SELECT LOWER(email) AS email FROM users WHERE nurture_unsubscribed = true
      ),
      pool AS (
        -- A. Cold prospect pool (has team-size data)
        SELECT
          pc.contact_email                        AS email,
          pc.short_name                           AS clinic,
          pc.contact_first_name                   AS first_name,
          pc.contact_full_name                    AS full_name,
          pc.contact_role                         AS role,
          pc.state, pc.city, pc.region,
          (COALESCE((pc.team->>'physiotherapists')::int,0)
           + COALESCE((pc.team->>'osteopaths')::int,0)
           + COALESCE((pc.team->>'exercisePhys')::int,0)
           + COALESCE((pc.team->>'sportsMedicineDoctors')::int,0)
           + COALESCE((pc.team->>'myotherapists')::int,0)
           + COALESCE((pc.team->>'remedialMassage')::int,0)
          )::int AS team_size,
          'prospect_clinic'::TEXT AS source
        FROM prospect_clinics pc
        WHERE pc.state = ANY (string_to_array(${statesCsv}, ','))
          AND pc.status NOT IN ('archived','bounced','won','lost')
        UNION ALL
        -- B. Workshop-interest signers who AREN'T already in the cold pool
        SELECT
          wi.email,
          NULL::TEXT,
          SPLIT_PART(wi.name, ' ', 1) AS first_name,
          wi.name                     AS full_name,
          NULL::TEXT                  AS role,
          NULL::TEXT, NULL::TEXT, wi.cities AS region,
          NULL::INT                   AS team_size,
          'workshop_interest'::TEXT   AS source
        FROM wi
        WHERE NOT EXISTS (
          SELECT 1 FROM prospect_clinics pc2
          WHERE LOWER(pc2.contact_email) = wi.email
        )
      ),
      scored AS (
        SELECT
          p.email, p.clinic, p.first_name AS "firstName", p.full_name AS "fullName",
          p.role, p.state, p.city, p.region, p.team_size AS "teamSize", p.source,
          COALESCE(e.opens, 0)::int  AS opens,
          COALESCE(e.clicks, 0)::int AS clicks,
          e.last_clicked_subject     AS "lastClickedSubject",
          e.last_click_at            AS "lastClickAt",
          COALESCE(s.pricing_views, 0)::int   AS "pricingViews",
          COALESCE(s.checkout_starts, 0)::int AS "checkoutStarts",
          COALESCE(s.portal_views, 0)::int    AS "portalViews",
          s.last_site_intent_at AS "lastSiteIntentAt",
          COALESCE(w.submits, 0)::int AS "wiSubmits",
          w.cities AS "wiCities",
          (
            COALESCE(s.pricing_views, 0) * 20
            + COALESCE(s.checkout_starts, 0) * 30
            + COALESCE(s.portal_views, 0) * 25
            + COALESCE(w.submits, 0) * 15
            + COALESCE(e.clicks, 0) * 5
            + COALESCE(e.opens, 0) * 2
            + CASE WHEN p.team_size >= 16 THEN 20 WHEN p.team_size >= 8 THEN 10 ELSE 0 END
          )::int AS "intentScore",
          GREATEST(
            COALESCE(e.last_click_at,       '1970-01-01'::timestamptz),
            COALESCE(s.last_site_intent_at, '1970-01-01'::timestamptz),
            COALESCE(w.last_submit_at,      '1970-01-01'::timestamptz)
          ) AS "lastSignalAt"
        FROM pool p
        LEFT JOIN email_engagement e ON e.email = LOWER(p.email)
        LEFT JOIN site_intent     s ON s.email = LOWER(p.email)
        LEFT JOIN wi               w ON w.email = LOWER(p.email)
        WHERE LOWER(p.email) NOT IN (SELECT email FROM converted)
          AND LOWER(p.email) NOT IN (SELECT email FROM unsubbed)
      )
      SELECT * FROM scored
      WHERE "intentScore" >= ${minScore}
      ORDER BY "intentScore" DESC, "teamSize" DESC NULLS LAST, "lastSignalAt" DESC
      LIMIT 60
    `

    // Add the angle recommendation row-by-row (TS-side keeps the SQL readable)
    const enriched = rows.map((r) => ({ ...r, angle: buildAngle(r) }))

    // ── Demand-by-location rollup ──
    // Anonymous + identified browsers grouped by AU state + city, to drive
    // "where should I host the next workshop" decisions. Uses (a) Vercel
    // IP geo we now persist on every event, (b) workshop_interest form
    // submissions, (c) prospect_clinics state/region for the registered
    // pool, (d) buyers' workshop_location preference.
    //
    // 90-day window — long enough to absorb seasonal noise, short enough
    // to reflect current demand.
    const { rows: demandByCity } = await sql<{
      city: string | null
      region: string | null
      ipBrowsers: number
      wiSubmits: number
      coldProspects: number
      buyersInRegion: number
      score: number
    }>`
      WITH ip_geo AS (
        SELECT
          COALESCE(NULLIF(city, ''), 'Unknown') AS city,
          COALESCE(NULLIF(region, ''), country) AS region,
          COUNT(DISTINCT session_id)::int AS ip_browsers
        FROM analytics_events
        WHERE created_at >= NOW() - INTERVAL '90 days'
          AND (country = 'AU' OR country IS NULL)
          AND (region IS NOT NULL OR city IS NOT NULL)
        GROUP BY 1, 2
      ),
      wi_geo AS (
        SELECT LOWER(city) AS city, NULL::TEXT AS region, COUNT(*)::int AS wi_submits
        FROM workshop_interest
        WHERE created_at >= NOW() - INTERVAL '90 days'
        GROUP BY LOWER(city)
      ),
      pc_geo AS (
        SELECT COALESCE(city, 'Unknown') AS city, state AS region, COUNT(*)::int AS cold_prospects
        FROM prospect_clinics
        WHERE status NOT IN ('archived','bounced')
        GROUP BY 1, 2
      ),
      buyer_geo AS (
        SELECT COALESCE(workshop_location, '(any)') AS city, COUNT(*)::int AS buyers_in_region
        FROM users
        WHERE access_level IN ('online-only','full-course')
        GROUP BY 1
      ),
      combined AS (
        SELECT city, region, ip_browsers, 0 AS wi_submits, 0 AS cold_prospects, 0 AS buyers_in_region FROM ip_geo
        UNION ALL
        SELECT city, region, 0, wi_submits, 0, 0 FROM wi_geo
        UNION ALL
        SELECT city, region, 0, 0, cold_prospects, 0 FROM pc_geo
        UNION ALL
        SELECT city, NULL, 0, 0, 0, buyers_in_region FROM buyer_geo
      )
      SELECT
        city,
        STRING_AGG(DISTINCT region, ',' ORDER BY region) AS region,
        SUM(ip_browsers)::int       AS "ipBrowsers",
        SUM(wi_submits)::int        AS "wiSubmits",
        SUM(cold_prospects)::int    AS "coldProspects",
        SUM(buyers_in_region)::int  AS "buyersInRegion",
        (SUM(ip_browsers) + SUM(wi_submits) * 5 + SUM(cold_prospects) * 2 + SUM(buyers_in_region) * 10)::int AS score
      FROM combined
      WHERE city IS NOT NULL AND city <> 'Unknown' AND city <> ''
      GROUP BY city
      HAVING SUM(ip_browsers) + SUM(wi_submits) + SUM(cold_prospects) + SUM(buyers_in_region) > 0
      ORDER BY score DESC
      LIMIT 30
    `

    return NextResponse.json({
      states,
      minScore,
      count: enriched.length,
      targets: enriched,
      demandByCity,
    })
  } catch (err) {
    console.error('[b2b-outreach-targets]', err)
    return NextResponse.json({ error: 'Query failed', detail: (err as Error).message }, { status: 500 })
  }
}
