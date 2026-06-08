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
  /** Distinct email URLs the prospect clicked — caps anti-malware scanner
   *  inflation (Defender/Mimecast/Proofpoint pre-fetch every link once). */
  distinctUrlClicks: number
  /** Clicks on cal.com specifically — call-intent signal. */
  calClicks: number
  lastClickedSubject: string | null
  lastClickAt: string | null

  pricingViews: number
  checkoutStarts: number
  portalViews: number
  /** Real browser sessions on the prospect portal (analytics_events
   *  session_id). The most reliable engagement signal — bot UAs are
   *  filtered out at write time. */
  realSessions: number
  lastSiteIntentAt: string | null

  wiSubmits: number
  wiCities: string | null

  intentScore: number
  angle: string
  lastSignalAt: string | null

  // Promotion + cadence
  hasBookedCall: boolean
  hasTalkRequest: boolean
  inPersonalLane: boolean
  reachByDate: string | null
  priorityBucket: 'today' | 'this-week' | 'calm' | 'overdue' | 'done'
  personalScript: string | null
}

/**
 * When should Zac contact this prospect by?
 *
 * Cadence reflects how cold-outreach decay works in B2B healthcare: a
 * just-clicked prospect is at peak intent right now; waiting >7 days
 * after the signal lets them cool back to baseline.
 *
 * Tiers (intentScore-based):
 *   HOT  (≥30): reach within 24h of last signal
 *   Warm (≥20): within 3 days
 *   Engaged (≥10): within 7 days
 *   Cool (<10): not flagged — they go in the normal nurture
 *
 * Returns null when the prospect doesn't qualify for the personal lane.
 */
function computeReachByDate(intentScore: number, lastSignalAt: string | null): Date | null {
  if (!lastSignalAt) return null
  const last = new Date(lastSignalAt)
  if (isNaN(last.getTime())) return null
  if (intentScore >= 30) return new Date(last.getTime() + 1 * 86400_000)
  if (intentScore >= 20) return new Date(last.getTime() + 3 * 86400_000)
  if (intentScore >= 10) return new Date(last.getTime() + 7 * 86400_000)
  return null
}

function computePriorityBucket(reachBy: Date | null): Row['priorityBucket'] {
  if (!reachBy) return 'calm'
  const now = Date.now()
  const r = reachBy.getTime()
  if (r < now - 1 * 86400_000) return 'overdue'   // missed the window
  if (r <= now + 0.5 * 86400_000) return 'today'  // due within 12h
  if (r <= now + 7 * 86400_000) return 'this-week'
  return 'calm'
}

/**
 * Generate a personalised outreach script Zac can copy-paste / edit.
 *
 * The opening references their strongest signal: what they clicked,
 * the city they registered workshop interest for, the team size, etc.
 * Goal is a ~60-second-to-edit draft, not a perfect send.
 */
function buildPersonalScript(r: Omit<Row, 'angle' | 'hasBookedCall' | 'hasTalkRequest' | 'inPersonalLane' | 'reachByDate' | 'priorityBucket' | 'personalScript'>, lastSignalAt: string | null): string | null {
  if (r.intentScore < 10) return null
  const first = r.firstName || 'there'
  const clinic = r.clinic
  const team = r.teamSize ?? null
  const lines: string[] = []

  // Subject suggestion
  if (clinic) {
    lines.push(`Subject: Concussion training for the ${clinic} team — quick chat?`)
  } else {
    lines.push(`Subject: Concussion CPD — quick chat?`)
  }
  lines.push('')
  lines.push(`Hey ${first},`)
  lines.push('')

  // Body opener — reference their strongest signal
  if (r.checkoutStarts > 0) {
    lines.push(`Saw you started enrolling${clinic ? ` for ${clinic}` : ''} but didn't finish — anything I can clear up before you do? Happy to walk through pricing, AHPRA CPD hours, or how the cohort scheduling works for a team of ${team ?? 'your size'}.`)
  } else if (r.wiSubmits >= 2 || (r.wiCities && r.wiCities.split(',').length >= 2)) {
    const cities = r.wiCities?.split(',').map((c) => c.trim()).filter(Boolean).join(' and ') || 'multiple workshop cities'
    lines.push(`Saw you registered interest for both ${cities} workshops — sounds like the dates are the main question.`)
    lines.push('')
    lines.push(`Quick alternative: I run in-house team training onsite at clinics with 4–10 clinicians. Same content, same CPD hours, eliminates the travel question entirely. Worth a 15-min chat to see if it fits your rollout?`)
  } else if (r.portalViews >= 3) {
    lines.push(`Noticed you've been deep-diving the program portal for ${clinic ?? 'your team'} — appreciate the time you've put in.`)
    lines.push('')
    lines.push(`Two questions on my end: (1) is the timing about budget cycle, or scheduling? (2) is this for the whole clinical team or a subset? Happy to come back with a specific scope + price.`)
  } else if (r.pricingViews >= 2) {
    lines.push(`Saw you've looked at pricing a couple of times${clinic ? ` for ${clinic}` : ''} — if it's the public-workshop sticker that's the friction, the in-house option might fit better. Same content delivered onsite to your full team, $8k flat for clinics with 4–10 clinicians.`)
  } else if (r.clicks >= 3) {
    const subject = r.lastClickedSubject ? `"${r.lastClickedSubject}"` : 'the materials I sent'
    lines.push(`Saw you clicked through ${subject} a few times. Quick question — is ${clinic ?? 'your team'} currently seeing concussion cases consistently, or more sporadically? Just trying to gauge whether the program fits the way ${clinic ?? 'you work'} runs.`)
  } else if (r.wiSubmits === 1) {
    const city = r.wiCities?.split(',')[0]?.trim() || 'the workshop'
    lines.push(`Thanks for registering interest in the ${city} workshop. Quick one: would the in-house option work better for ${clinic ?? 'your team'}? Comes to ~$8k flat for 4–10 clinicians and removes the date question entirely.`)
  } else if ((team ?? 0) >= 8 && r.opens >= 3) {
    lines.push(`I've been sending materials to ${clinic ?? 'your clinic'} and noticed you've been opening them. A team of ${team} is roughly the sweet spot for the in-house training — happy to walk through what that looks like if you've got 15 min.`)
  } else if (r.opens >= 3) {
    lines.push(`Saw you've been opening the materials I've been sending. Anything specific drawing you in — the SCAT6/SCOAT6 angle, the workshop, or the in-house option for your team?`)
  } else {
    lines.push(`Wanted to check in directly rather than keep landing in your inbox via the automated sequence. Anything I can answer about the program for ${clinic ?? 'your team'}?`)
  }
  lines.push('')
  // Close
  lines.push(`If a 15-min call works, pick a time directly here: https://portal.concussion-education-australia.com/p/${(r.email?.split('@')[1] || '').replace(/\./g, '-')}`)
  lines.push(`Or just reply with what you'd like to know — happy to answer over email.`)
  lines.push('')
  lines.push(`— Zac`)
  return lines.join('\n')
}

function buildAngle(r: Omit<Row, 'angle' | 'hasBookedCall' | 'hasTalkRequest' | 'inPersonalLane' | 'reachByDate' | 'priorityBucket' | 'personalScript'>): string {
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
               -- DISTINCT-URL clicks: anti-malware scanners (Defender, Mimecast,
               -- Proofpoint, CF) pre-fetch every link in the email exactly once.
               -- Raw click count inflates 4-5x. Distinct URLs caps the scanner
               -- contribution and gives the real "different things the prospect
               -- actually clicked" signal.
               COUNT(DISTINCT click_url) FILTER (
                 WHERE event_type='clicked'
                 AND click_url IS NOT NULL
                 AND click_url NOT ILIKE '%unsubscribe%'
                 AND click_url NOT ILIKE '%osteopathy.org.au%'
               )::int AS distinct_url_clicks,
               COUNT(*) FILTER (
                 WHERE event_type='clicked' AND click_url ILIKE '%cal.com%'
               )::int AS cal_clicks,
               MAX(created_at) FILTER (WHERE event_type='clicked') AS last_click_at,
               MAX(subject)    FILTER (WHERE event_type='clicked') AS last_clicked_subject
        FROM email_events
        WHERE created_at >= NOW() - INTERVAL '90 days'
          AND COALESCE(project, 'cea') = 'cea'
        GROUP BY LOWER(recipient)
      ),
      -- Real browser sessions on the prospect portal — strongest signal.
      -- analytics_events captures actual browser session_ids (bot UAs
      -- filtered server-side at write time). Matched to clinic by slug.
      real_portal_sessions AS (
        SELECT LOWER(pc.contact_email) AS email,
               COUNT(DISTINCT ae.session_id)::int AS real_sessions,
               COUNT(DISTINCT ae.ip)::int         AS real_session_ips,
               MAX(ae.created_at)                 AS last_real_session_at
        FROM prospect_clinics pc
        JOIN analytics_events ae ON ae.path LIKE '/p/' || pc.slug || '%'
        WHERE ae.created_at >= NOW() - INTERVAL '90 days'
          AND ae.session_id IS NOT NULL
          AND ae.session_id NOT LIKE 'server_%'
        GROUP BY LOWER(pc.contact_email)
      ),
      -- prospect_portal_views is the AUTHORITATIVE source for portal browsing
      -- (analytics_events.user_email is unreliably populated). Join via
      -- clinic_id → contact_email so the engagement signal flows back
      -- through to the email-keyed pool below.
      portal_engagement AS (
        SELECT LOWER(pc.contact_email) AS email,
               COUNT(DISTINCT pv.id)::int                AS portal_views,
               COUNT(DISTINCT pv.viewer_ip)::int         AS portal_unique_ips,
               MAX(pv.viewed_at)                         AS last_portal_view_at
        FROM prospect_portal_views pv
        JOIN prospect_clinics pc ON pc.id = pv.clinic_id
        WHERE pv.viewed_at >= NOW() - INTERVAL '90 days'
        GROUP BY LOWER(pc.contact_email)
      ),
      site_intent AS (
        SELECT LOWER(user_email) AS email,
               COUNT(*) FILTER (WHERE event_type='pricing_page')::int    AS pricing_views,
               COUNT(*) FILTER (WHERE event_type='checkout_start')::int  AS checkout_starts,
               MAX(created_at) FILTER (
                 WHERE event_type IN ('pricing_page','checkout_start','enrol_click')
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
          COALESCE(e.distinct_url_clicks, 0)::int AS "distinctUrlClicks",
          COALESCE(e.cal_clicks, 0)::int          AS "calClicks",
          COALESCE(rs.real_sessions, 0)::int      AS "realSessions",
          e.last_clicked_subject     AS "lastClickedSubject",
          e.last_click_at            AS "lastClickAt",
          COALESCE(s.pricing_views, 0)::int   AS "pricingViews",
          COALESCE(s.checkout_starts, 0)::int AS "checkoutStarts",
          -- Portal views from prospect_portal_views (authoritative source).
          -- analytics_events.user_email was unreliably populated; the portal
          -- table tracks clinic_id directly.
          COALESCE(pe.portal_views, 0)::int    AS "portalViews",
          GREATEST(
            COALESCE(s.last_site_intent_at, '1970-01-01'::timestamptz),
            COALESCE(pe.last_portal_view_at, '1970-01-01'::timestamptz)
          ) AS "lastSiteIntentAt",
          COALESCE(w.submits, 0)::int AS "wiSubmits",
          w.cities AS "wiCities",
          (
            -- Real browser sessions are the strongest signal — actually
            -- unfakeable by anti-malware scanners. Each session is +25.
            COALESCE(rs.real_sessions, 0) * 25
            + COALESCE(s.pricing_views, 0) * 20
            + COALESCE(s.checkout_starts, 0) * 30
            -- Distinct-URL email clicks (scanner-deflated): +10 each. The
            -- raw click count carries half-weight now (+2) since most of
            -- it is scanner noise.
            + COALESCE(e.distinct_url_clicks, 0) * 10
            + COALESCE(e.clicks, 0) * 2
            + COALESCE(w.submits, 0) * 15
            + COALESCE(e.opens, 0) * 2
            + CASE WHEN p.team_size >= 16 THEN 20 WHEN p.team_size >= 8 THEN 10 ELSE 0 END
          )::int AS "intentScore",
          GREATEST(
            COALESCE(e.last_click_at,       '1970-01-01'::timestamptz),
            COALESCE(s.last_site_intent_at, '1970-01-01'::timestamptz),
            COALESCE(pe.last_portal_view_at, '1970-01-01'::timestamptz),
            COALESCE(w.last_submit_at,      '1970-01-01'::timestamptz)
          ) AS "lastSignalAt"
        FROM pool p
        LEFT JOIN email_engagement     e  ON e.email  = LOWER(p.email)
        LEFT JOIN site_intent          s  ON s.email  = LOWER(p.email)
        LEFT JOIN portal_engagement    pe ON pe.email = LOWER(p.email)
        LEFT JOIN real_portal_sessions rs ON rs.email = LOWER(p.email)
        LEFT JOIN wi                   w  ON w.email  = LOWER(p.email)
        WHERE LOWER(p.email) NOT IN (SELECT email FROM converted)
          AND LOWER(p.email) NOT IN (SELECT email FROM unsubbed)
      )
      SELECT * FROM scored
      WHERE "intentScore" >= ${minScore}
      ORDER BY "intentScore" DESC, "teamSize" DESC NULLS LAST, "lastSignalAt" DESC
      LIMIT 60
    `

    // Pull "have they already booked / submitted talk request?" so we can mark
    // them DONE and skip the "reach out" urgency calculation.
    const emails = rows.map((r) => r.email.toLowerCase()).filter(Boolean)
    const bookedSet = new Set<string>()
    const talkSet = new Set<string>()
    if (emails.length) {
      const emailsCsv = emails.join(',')
      const { rows: booked } = await sql<{ email: string }>`
        SELECT DISTINCT LOWER(attendee_email) AS email
        FROM cal_webhook_log
        WHERE LOWER(attendee_email) = ANY (string_to_array(${emailsCsv}, ','))
          AND trigger_event IN ('BOOKING_CREATED','BOOKING_RESCHEDULED')
      `
      for (const b of booked) bookedSet.add(b.email)
      const { rows: talks } = await sql<{ email: string }>`
        SELECT DISTINCT LOWER(email) AS email
        FROM talk_requests
        WHERE LOWER(email) = ANY (string_to_array(${emailsCsv}, ','))
      `
      for (const t of talks) talkSet.add(t.email)
    }

    // Enrich each row: angle, signal date sanitisation, promotion flag,
    // reach-by date, priority bucket, personalised email script.
    const enriched = rows.map((r) => {
      const lastSignal =
        r.lastSignalAt && new Date(r.lastSignalAt).getFullYear() > 2000
          ? r.lastSignalAt
          : null
      const emailLc = (r.email || '').toLowerCase()
      const hasBookedCall = bookedSet.has(emailLc)
      const hasTalkRequest = talkSet.has(emailLc)
      // Promotion rule: anyone with intent ≥20 AND no call booked AND no talk
      // request is "personal-lane". The cold cron should skip them so Zac's
      // personal email doesn't collide with a templated send.
      const inPersonalLane =
        r.intentScore >= 20 && !hasBookedCall && !hasTalkRequest
      const reachBy = computeReachByDate(r.intentScore, lastSignal)
      const priorityBucket: Row['priorityBucket'] = hasBookedCall || hasTalkRequest
        ? 'done'
        : computePriorityBucket(reachBy)
      const personalScript = buildPersonalScript(r, lastSignal)
      return {
        ...r,
        angle: buildAngle(r),
        lastSignalAt: lastSignal,
        hasBookedCall,
        hasTalkRequest,
        inPersonalLane,
        reachByDate: reachBy ? reachBy.toISOString() : null,
        priorityBucket,
        personalScript,
      }
    })

    // Re-sort: priority bucket first (today → this-week → calm → overdue → done),
    // then by intent score within bucket.
    const bucketOrder: Record<Row['priorityBucket'], number> = {
      'today': 0,
      'this-week': 1,
      'overdue': 2,
      'calm': 3,
      'done': 4,
    }
    enriched.sort((a, b) => {
      const ba = bucketOrder[a.priorityBucket] - bucketOrder[b.priorityBucket]
      if (ba !== 0) return ba
      return (b.intentScore || 0) - (a.intentScore || 0)
    })

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
