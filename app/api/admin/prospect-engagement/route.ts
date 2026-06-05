/**
 * GET /api/admin/prospect-engagement
 *
 * Returns rich engagement metrics for every prospect — clinic details,
 * team breakdown, location, cohort tier recommendation, travel band,
 * full email send history, opens/clicks/views, and last-activity signals.
 *
 * Optional ?clinicId=N narrows to one clinic.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'
import type { ClinicTeam, CohortRecommendation, TravelBand } from '@/lib/prospect/types'
import { teamTotal, clinicalCount, computePricing, clinicSizeBucket, hubPackPriceFor } from '@/lib/prospect/pricing'

interface ClinicDbRow {
  id: number
  slug: string
  access_key: string
  name: string
  short_name: string
  city: string
  state: string
  region: string
  contact_first_name: string
  contact_full_name: string
  contact_email: string
  contact_role: string | null
  contact_discipline: string
  team: ClinicTeam
  travel_band: string
  travel_surcharge: number
  cohort_recommendation: string
  status: string
  research_source: string
  valid_until: string
  notes: string | null
  created_at: string
  updated_at: string
  scheduled_send_at: string | null
  next_template_slug: string | null
  priority_wave: string | null
  pitch_variant: string | null
  cal_booked_at: string | null
  cal_booking_id: string | null
  cal_booking_status: string | null
}

interface OutreachLogRow {
  id: number
  clinic_id: number
  template_slug: string
  email_subject: string
  email_body: string
  sent_at: string
  resend_email_id: string | null
  opened_count: number | string
  clicked_count: number | string
  replied_at: string | null
  reply_text: string | null
  reply_sentiment: string | null
}

interface PortalViewRow {
  clinic_id: number
  total: string
  view_days: number | string
  first_viewed_at: string | null
  last_viewed_at: string | null
}

interface EventSignalRow {
  clinic_id: number
  open_days: number | string
  total_open_events: number | string
  cal_clicks: number | string
  product_clicks: number | string
  other_clicks: number | string
  last_event_at: string | null
}

interface PortalFlowRow {
  clinic_id: number
  section_funnel: Record<string, number>
  cta_clicks: Record<string, number>
  exit_sections: Record<string, number>
  avg_dwell_ms: number | string | null
  deepest_section: string | null
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Bootstrap check — schema not applied → empty + clear status
    const { rows: tableCheck } = await sql<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'prospect_clinics'
      ) AS exists
    `
    if (!tableCheck[0]?.exists) {
      return NextResponse.json({
        ok: true,
        count: 0,
        prospects: [],
        status: 'schema-not-applied',
        message: 'Run lib/prospect/schema.sql against the production Postgres to create prospect_clinics + related tables.',
      })
    }

    const url = new URL(req.url)
    const clinicIdFilter = url.searchParams.get('clinicId')
    const filterId = clinicIdFilter ? parseInt(clinicIdFilter, 10) : null

    // includeTest=true returns all sends including test samples sent to zac@
    // for review. Default behaviour: filter test sends out of the analytics
    // counters so "Sends: 5" reflects real production sends to prospects only,
    // not test+prod mixed. Test sends are tagged via audit_key containing ':test:'.
    const includeTest = url.searchParams.get('includeTest') === 'true'

    // ── Engagement-signal recalibration (2026-06-05) ──────────────────────
    // The previous heuristic (`totalOpens >= 3 → hot`) over-weighted single-
    // open noise from Apple Mail Privacy Protection, which pre-fetches every
    // open the moment the email lands in the inbox (often 2-3 prefetches
    // across iCloud devices for one read). The recalibrated signals favour
    // research-backed predictors of B2B cold-meeting conversion:
    //
    //   STRONGEST  →  reply
    //                 cal.com click (literal booking flow click)
    //                 product-link click (dashboard CTA / pricing / hub link)
    //                 return-day portal view (>1 calendar day of views)
    //                 multi-day opens (opens spanning 2+ calendar days)
    //   WEAKER    →   single-day opens, single portal view
    //
    // Salesloft 2023 published: clicks on cold email → 14.6% meeting rate
    // vs 1.8% opens-only. Apollo 2024 healthcare benchmarks: 35-45% open
    // rate but 1-2% click rate is normal (clinicians research by Googling
    // rather than clicking). Reply rates with OA-endorsed + named-author
    // framing trend 4-6% (vs 1-3% generic B2B services).
    //
    // We classify clicks by destination URL — cal.com clicks are highest
    // intent (the prospect has decided to book), product clicks (dashboard
    // / pricing / hub) signal active research, "other" clicks (unsubscribe,
    // SCAT pack) carry minimal call-recommendation weight on their own.

    // Portal flow aggregator — section funnel, CTA clicks, exit drop-off.
    // Bot-filtered. Surfaces per-clinic JSON blobs of section→count and
    // target→count, plus dwell stats. Returns empty {} for clinics with
    // no events; route handles missing rows gracefully.
    const BOT_REGEX = "(microsoft office|bingpreview|mimecast|barracuda|proofpoint|cloudmark|symantec|sophos|fortinet|trend micro|safelinks|headlesschrome|phantomjs|puppeteer|playwright|googlebot|bingbot|yandex|baidu|crawler|spider|slurp|facebook|linkedin|whatsapp|telegram|skype|wget|curl|python-requests|node-fetch|axios|httpie|go-http-client|java/|okhttp|powershell)"
    const portalFlowQuery = filterId !== null && !isNaN(filterId)
      ? sql<PortalFlowRow>`
          WITH filtered AS (
            SELECT * FROM prospect_portal_views
            WHERE clinic_id = ${filterId}
              AND COALESCE(user_agent, '') !~* ${BOT_REGEX}
          ),
          sec AS (
            SELECT clinic_id, section_visited, COUNT(*)::int AS n
            FROM filtered WHERE interaction_type IN ('view', 'section_view')
            GROUP BY clinic_id, section_visited
          ),
          cta AS (
            SELECT clinic_id, target, COUNT(*)::int AS n
            FROM filtered WHERE interaction_type = 'cta_click' AND target IS NOT NULL
            GROUP BY clinic_id, target
          ),
          exits AS (
            SELECT clinic_id, section_visited, COUNT(*)::int AS n
            FROM filtered WHERE interaction_type = 'exit'
            GROUP BY clinic_id, section_visited
          ),
          dwell AS (
            SELECT clinic_id, AVG(dwell_ms)::int AS avg_dwell_ms
            FROM filtered WHERE interaction_type = 'exit' AND dwell_ms IS NOT NULL
            GROUP BY clinic_id
          )
          SELECT
            f.clinic_id,
            COALESCE((SELECT jsonb_object_agg(section_visited, n) FROM sec WHERE clinic_id = f.clinic_id), '{}'::jsonb) AS section_funnel,
            COALESCE((SELECT jsonb_object_agg(target, n) FROM cta WHERE clinic_id = f.clinic_id), '{}'::jsonb) AS cta_clicks,
            COALESCE((SELECT jsonb_object_agg(section_visited, n) FROM exits WHERE clinic_id = f.clinic_id), '{}'::jsonb) AS exit_sections,
            (SELECT avg_dwell_ms FROM dwell WHERE clinic_id = f.clinic_id) AS avg_dwell_ms,
            NULL::text AS deepest_section
          FROM (SELECT DISTINCT clinic_id FROM filtered) f`
      : sql<PortalFlowRow>`
          WITH filtered AS (
            SELECT * FROM prospect_portal_views
            WHERE COALESCE(user_agent, '') !~* ${BOT_REGEX}
          ),
          sec AS (
            SELECT clinic_id, section_visited, COUNT(*)::int AS n
            FROM filtered WHERE interaction_type IN ('view', 'section_view')
            GROUP BY clinic_id, section_visited
          ),
          cta AS (
            SELECT clinic_id, target, COUNT(*)::int AS n
            FROM filtered WHERE interaction_type = 'cta_click' AND target IS NOT NULL
            GROUP BY clinic_id, target
          ),
          exits AS (
            SELECT clinic_id, section_visited, COUNT(*)::int AS n
            FROM filtered WHERE interaction_type = 'exit'
            GROUP BY clinic_id, section_visited
          ),
          dwell AS (
            SELECT clinic_id, AVG(dwell_ms)::int AS avg_dwell_ms
            FROM filtered WHERE interaction_type = 'exit' AND dwell_ms IS NOT NULL
            GROUP BY clinic_id
          )
          SELECT
            f.clinic_id,
            COALESCE((SELECT jsonb_object_agg(section_visited, n) FROM sec WHERE clinic_id = f.clinic_id), '{}'::jsonb) AS section_funnel,
            COALESCE((SELECT jsonb_object_agg(target, n) FROM cta WHERE clinic_id = f.clinic_id), '{}'::jsonb) AS cta_clicks,
            COALESCE((SELECT jsonb_object_agg(section_visited, n) FROM exits WHERE clinic_id = f.clinic_id), '{}'::jsonb) AS exit_sections,
            (SELECT avg_dwell_ms FROM dwell WHERE clinic_id = f.clinic_id) AS avg_dwell_ms,
            NULL::text AS deepest_section
          FROM (SELECT DISTINCT clinic_id FROM filtered) f`

    // Pull all six sources in parallel
    const [clinics, outreach, views, eventSignals, portalFlow] = await Promise.all([
      filterId !== null && !isNaN(filterId)
        ? sql<ClinicDbRow>`SELECT * FROM prospect_clinics WHERE id = ${filterId}`
        : sql<ClinicDbRow>`SELECT * FROM prospect_clinics`,
      includeTest
        ? (filterId !== null && !isNaN(filterId)
            ? sql<OutreachLogRow>`SELECT * FROM prospect_outreach_log WHERE clinic_id = ${filterId} ORDER BY sent_at DESC`
            : sql<OutreachLogRow>`SELECT * FROM prospect_outreach_log ORDER BY sent_at DESC`)
        : (filterId !== null && !isNaN(filterId)
            ? sql<OutreachLogRow>`SELECT * FROM prospect_outreach_log WHERE clinic_id = ${filterId} AND audit_key NOT LIKE '%:test:%' ORDER BY sent_at DESC`
            : sql<OutreachLogRow>`SELECT * FROM prospect_outreach_log WHERE audit_key NOT LIKE '%:test:%' ORDER BY sent_at DESC`),
      // Filter out bot / scanner user agents (Microsoft 365 SafeLinks,
      // Mimecast, Proofpoint, Barracuda, etc) — they pre-fetch every link
      // in every email for malware scanning. Without this filter Brisbane
      // Physio showed 0 opens / 3 clicks, which is physically impossible
      // for human behaviour. The recorded raw view rows stay intact (for
      // audit) but the aggregate counts here surface humans-only.
      filterId !== null && !isNaN(filterId)
        ? sql<PortalViewRow>`
            SELECT clinic_id, COUNT(*)::text AS total,
              COUNT(DISTINCT viewed_at::date)::int AS view_days,
              MIN(viewed_at) AS first_viewed_at, MAX(viewed_at) AS last_viewed_at
            FROM prospect_portal_views
            WHERE clinic_id = ${filterId}
              AND COALESCE(user_agent, '') !~* '(microsoft office|bingpreview|mimecast|barracuda|proofpoint|cloudmark|symantec|sophos|fortinet|trend micro|safelinks|headlesschrome|phantomjs|puppeteer|playwright|googlebot|bingbot|yandex|baidu|crawler|spider|slurp|facebook|linkedin|whatsapp|telegram|skype|wget|curl|python-requests|node-fetch|axios|httpie|go-http-client|java/|okhttp|powershell)'
            GROUP BY clinic_id`
        : sql<PortalViewRow>`
            SELECT clinic_id, COUNT(*)::text AS total,
              COUNT(DISTINCT viewed_at::date)::int AS view_days,
              MIN(viewed_at) AS first_viewed_at, MAX(viewed_at) AS last_viewed_at
            FROM prospect_portal_views
            WHERE COALESCE(user_agent, '') !~* '(microsoft office|bingpreview|mimecast|barracuda|proofpoint|cloudmark|symantec|sophos|fortinet|trend micro|safelinks|headlesschrome|phantomjs|puppeteer|playwright|googlebot|bingbot|yandex|baidu|crawler|spider|slurp|facebook|linkedin|whatsapp|telegram|skype|wget|curl|python-requests|node-fetch|axios|httpie|go-http-client|java/|okhttp|powershell)'
            GROUP BY clinic_id`,
      // Email-event signal aggregator — joins email_events to
      // prospect_outreach_log via resend_email_id and computes:
      //   - open_days: distinct calendar days with opens (MPP-resistant)
      //   - cal_clicks: clicks to cal.com (literal booking intent)
      //   - product_clicks: clicks to dashboard /p/{slug} or /pricing (research)
      //   - other_clicks: SCAT pack / unsubscribe / etc (weak)
      filterId !== null && !isNaN(filterId)
        ? sql<EventSignalRow>`
            WITH cold_sent AS (
              SELECT clinic_id, resend_email_id
              FROM prospect_outreach_log
              WHERE clinic_id = ${filterId} AND resend_email_id IS NOT NULL
            )
            SELECT cs.clinic_id,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' THEN ee.created_at::date END)::int AS open_days,
              COUNT(CASE WHEN ee.event_type = 'opened' THEN 1 END)::int AS total_open_events,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url ~* '(cal\\.com|cal_booking|/calendar)' THEN ee.id END)::int AS cal_clicks,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url ~* '(/p/[^?]+|/pricing|/dashboard|/hub)' AND ee.click_url !~* '(cal\\.com|cal_booking)' THEN ee.id END)::int AS product_clicks,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url !~* '(cal\\.com|cal_booking|/p/|/pricing|/dashboard|/hub|/calendar)' THEN ee.id END)::int AS other_clicks,
              MAX(ee.created_at) AS last_event_at
            FROM cold_sent cs
            JOIN email_events ee ON ee.email_id = cs.resend_email_id
            GROUP BY cs.clinic_id`
        : sql<EventSignalRow>`
            WITH cold_sent AS (
              SELECT clinic_id, resend_email_id
              FROM prospect_outreach_log
              WHERE resend_email_id IS NOT NULL
            )
            SELECT cs.clinic_id,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' THEN ee.created_at::date END)::int AS open_days,
              COUNT(CASE WHEN ee.event_type = 'opened' THEN 1 END)::int AS total_open_events,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url ~* '(cal\\.com|cal_booking|/calendar)' THEN ee.id END)::int AS cal_clicks,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url ~* '(/p/[^?]+|/pricing|/dashboard|/hub)' AND ee.click_url !~* '(cal\\.com|cal_booking)' THEN ee.id END)::int AS product_clicks,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url !~* '(cal\\.com|cal_booking|/p/|/pricing|/dashboard|/hub|/calendar)' THEN ee.id END)::int AS other_clicks,
              MAX(ee.created_at) AS last_event_at
            FROM cold_sent cs
            JOIN email_events ee ON ee.email_id = cs.resend_email_id
            GROUP BY cs.clinic_id`,
      portalFlowQuery,
    ])

    // Index helpers
    const outreachByClinic = new Map<number, OutreachLogRow[]>()
    for (const o of outreach.rows) {
      if (!outreachByClinic.has(o.clinic_id)) outreachByClinic.set(o.clinic_id, [])
      outreachByClinic.get(o.clinic_id)!.push(o)
    }
    const viewsByClinic = new Map<number, PortalViewRow>()
    for (const v of views.rows) viewsByClinic.set(v.clinic_id, v)
    const signalsByClinic = new Map<number, EventSignalRow>()
    for (const s of eventSignals.rows) signalsByClinic.set(s.clinic_id, s)
    const portalFlowByClinic = new Map<number, PortalFlowRow>()
    for (const f of portalFlow.rows) portalFlowByClinic.set(f.clinic_id, f)

    // Build rich rows
    const prospects = clinics.rows.map((c) => {
      const sends = outreachByClinic.get(c.id) ?? []
      const view = viewsByClinic.get(c.id)
      const totalOpens = sends.reduce((acc, s) => acc + (typeof s.opened_count === 'string' ? parseInt(s.opened_count, 10) : s.opened_count), 0)
      const totalClicks = sends.reduce((acc, s) => acc + (typeof s.clicked_count === 'string' ? parseInt(s.clicked_count, 10) : s.clicked_count), 0)
      const replies = sends.filter((s) => s.replied_at).length
      const lastSent = sends[0] // already ORDER BY sent_at DESC

      const pricing = computePricing(c.team, c.travel_band as TravelBand)
      const recoTier = c.cohort_recommendation as CohortRecommendation
      const recoCohort = pricing.cohortTiers.find((t) =>
        t.name === (recoTier === 'essential' ? 'Essential' : recoTier === 'full-team' ? 'Full team' : 'Recommended'),
      )!

      // Pick the deal value that MATCHES THE OFFER going to this clinic.
      // Small/medium clinics get Hub Pack ($1,497-$2,800ish). Large/enterprise
      // get on-site cohort ($8k-$15k). Previously this used the on-site
      // cohort total for EVERY clinic — inflating active pipeline ~6x for
      // 95% of prospects.
      const hubPricing = hubPackPriceFor(c.team)
      const dealValue =
        hubPricing.recommendedOffer === 'on-site-cohort' ? recoCohort.total : hubPricing.totalBase

      const stageProb: Record<string, number> = {
        researching: 0,
        approved: 0.05,
        sent: 0.05,
        opened: 0.1,
        engaged: 0.2,
        replied: 0.5,
        won: 1,
        lost: 0,
        archived: 0,
        bounced: 0,
      }
      const weightedValue = Math.round(dealValue * (stageProb[c.status] ?? 0))

      // ── Engagement tier — recalibrated against B2B + healthcare-CPD
      // benchmarks (see CTE comment block above). Strongest non-reply
      // signals: cal-click, return-day portal view, product-click,
      // multi-day opens. Single open / single same-day view = noise.
      const portalViews = view ? parseInt(view.total, 10) : 0
      const viewDays = view ? Number(view.view_days ?? 0) : 0
      const signal = signalsByClinic.get(c.id)
      const openDays = signal ? Number(signal.open_days ?? 0) : 0
      const calClicks = signal ? Number(signal.cal_clicks ?? 0) : 0
      const productClicks = signal ? Number(signal.product_clicks ?? 0) : 0
      const otherClicks = signal ? Number(signal.other_clicks ?? 0) : 0
      const everSent = sends.length > 0

      // Top non-reply signal — what the strongest engagement marker is
      // for this clinic. Drives both tier and "why call this prospect"
      // copy in the admin dashboard. cal_booked = literal booking via
      // cal.com webhook (strongest possible non-reply, non-won signal).
      const isCalBooked = c.cal_booking_status === 'booked' && c.cal_booked_at !== null
      const topSignal: 'cal_booked' | 'cal_click' | 'return_view' | 'product_click' | 'multi_day_opens' | 'single_view' | 'single_open' | 'none' =
        isCalBooked ? 'cal_booked'
        : calClicks > 0 ? 'cal_click'
        : viewDays >= 2 ? 'return_view'
        : productClicks > 0 ? 'product_click'
        : openDays >= 2 ? 'multi_day_opens'
        : portalViews > 0 ? 'single_view'
        : totalOpens > 0 ? 'single_open'
        : 'none'

      let engagementTier: 'cold' | 'warm' | 'hot' | 'engaged' | 'replied' | 'won' = 'cold'
      if (c.status === 'won') engagementTier = 'won'
      else if (replies > 0) engagementTier = 'replied'
      // ENGAGED = highest predictive non-reply signals → personal call
      // 1) Cal click (literal booking intent) OR
      // 2) Return-day portal view + any click (research + commitment) OR
      // 3) Product click + multi-day opens (research over time)
      else if (
        c.status === 'engaged' ||
        calClicks > 0 ||
        (viewDays >= 2 && (productClicks > 0 || otherClicks > 0 || calClicks > 0)) ||
        (productClicks > 0 && openDays >= 2)
      ) engagementTier = 'engaged'
      // HOT = single strong signal (one of these alone)
      // - Any product click (clicked the dashboard preview)
      // - Return-day view (came back another day)
      // - Multi-day opens AND total >= 3 (rules out Apple-MPP noise)
      else if (
        productClicks > 0 ||
        viewDays >= 2 ||
        (openDays >= 2 && totalOpens >= 3) ||
        otherClicks > 0
      ) engagementTier = 'hot'
      // WARM = real attention but not strong enough alone
      // - Multi-day opens (someone genuinely read more than once)
      // - Single portal view
      else if (openDays >= 2 || portalViews > 0) engagementTier = 'warm'
      else engagementTier = 'cold'

      // ── Personal call recommendation — only for high-intent signals.
      // We don't call on a single open or single same-day portal view —
      // those signals are too noisy to spend Zac's time on. We DO call
      // for cal_click, return-day visits, and product clicks.
      //
      // Cal-booked clinics are SUPPRESSED from call-recommended — the
      // call is already on the calendar. They surface in their own
      // "Upcoming bookings" group instead. This stops the dashboard
      // from telling Zac to "call this person" when a meeting is locked.
      const callRecommended =
        everSent &&
        !isCalBooked &&
        (engagementTier === 'engaged' || (engagementTier === 'hot' && (productClicks > 0 || viewDays >= 2 || calClicks > 0))) &&
        !['lost', 'bounced', 'archived', 'won', 'replied'].includes(c.status)

      return {
        // identifiers
        id: c.id,
        slug: c.slug,
        accessKey: c.access_key,
        name: c.name,
        shortName: c.short_name,
        // location
        city: c.city,
        state: c.state,
        region: c.region,
        // contact
        contactFirstName: c.contact_first_name,
        contactFullName: c.contact_full_name,
        contactEmail: c.contact_email,
        contactRole: c.contact_role,
        contactDiscipline: c.contact_discipline,
        // team
        team: c.team,
        clinicalCount: clinicalCount(c.team),
        totalCount: teamTotal(c.team),
        sizeBucket: clinicSizeBucket(c.team),
        hubPackPricing: hubPackPriceFor(c.team),
        // tier + pricing — dealValue reflects the offer going to this clinic
        // (Hub Pack for small/med, on-site cohort for large/enterprise)
        cohortRecommendation: c.cohort_recommendation,
        recoCohortClinicians: recoCohort.clinicians,
        recoCohortPerClinician: recoCohort.perClinician,
        recoCohortTotal: recoCohort.total,
        recommendedOffer: hubPricing.recommendedOffer,
        dealValue,
        weightedPipelineValue: weightedValue,
        // travel
        travelBand: c.travel_band,
        travelSurcharge: c.travel_surcharge,
        // status + lifecycle
        status: c.status,
        researchSource: c.research_source,
        validUntil: c.valid_until,
        notes: c.notes,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        scheduledSendAt: c.scheduled_send_at,
        nextTemplateSlug: c.next_template_slug,
        priorityWave: c.priority_wave,
        pitchVariant: c.pitch_variant,
        // cal.com booking — populated by /api/webhooks/cal
        calBookedAt: c.cal_booked_at ?? null,
        calBookingStatus: c.cal_booking_status ?? null,
        // outreach summary
        totalSends: sends.length,
        totalOpens,
        totalClicks,
        replies,
        lastSentAt: lastSent?.sent_at ?? null,
        lastSentTemplate: lastSent?.template_slug ?? null,
        lastSentSubject: lastSent?.email_subject ?? null,
        // engagement segmentation — drives admin dashboard warm/hot view
        engagementTier,
        callRecommended,
        topSignal,
        // calibrated signal counts — surfaced so admin can verify the
        // tier classification and write good "why call" copy
        openDays,
        calClicks,
        productClicks,
        otherClicks,
        // portal
        totalPortalViews: view ? parseInt(view.total, 10) : 0,
        viewDays,
        firstPortalViewAt: view?.first_viewed_at ?? null,
        lastPortalViewAt: view?.last_viewed_at ?? null,
        // portal flow — section funnel + CTA clicks + exit drop-off
        portalFlow: (() => {
          const f = portalFlowByClinic.get(c.id)
          if (!f) return null
          return {
            sectionFunnel: f.section_funnel ?? {},
            ctaClicks: f.cta_clicks ?? {},
            exitSections: f.exit_sections ?? {},
            avgDwellMs: f.avg_dwell_ms != null ? Number(f.avg_dwell_ms) : null,
          }
        })(),
        // per-send detail (most recent first)
        sends: sends.map((s) => ({
          id: s.id,
          templateSlug: s.template_slug,
          subject: s.email_subject,
          bodyPreview: s.email_body.slice(0, 600),
          sentAt: s.sent_at,
          resendEmailId: s.resend_email_id,
          openedCount: typeof s.opened_count === 'string' ? parseInt(s.opened_count, 10) : s.opened_count,
          clickedCount: typeof s.clicked_count === 'string' ? parseInt(s.clicked_count, 10) : s.clicked_count,
          repliedAt: s.replied_at,
          replyText: s.reply_text,
          replySentiment: s.reply_sentiment,
        })),
      }
    })

    // Aggregations
    const aggregates = buildAggregates(prospects)

    return NextResponse.json({
      ok: true,
      count: prospects.length,
      prospects,
      aggregates,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Query failed', detail: message }, { status: 500 })
  }
}

function buildAggregates(prospects: Array<{
  status: string
  region: string
  cohortRecommendation: string
  travelBand: string
  recoCohortTotal: number
  dealValue: number
  recommendedOffer: 'hub-pack' | 'on-site-cohort'
  sizeBucket: string
  weightedPipelineValue: number
  totalSends: number
  totalOpens: number
  totalClicks: number
  totalPortalViews: number
  replies: number
  engagementTier: string
  callRecommended: boolean
}>) {
  const byStatus: Record<string, number> = {}
  const byRegion: Record<string, number> = {}
  const byCohort: Record<string, number> = {}
  const byTravelBand: Record<string, number> = {}
  const byOffer: Record<string, number> = {}
  const bySizeBucket: Record<string, number> = {}
  const byEngagementTier: Record<string, number> = {}
  let callRecommendedCount = 0
  let totalRevenuePotential = 0
  let weightedPipeline = 0
  let hubPackPipelineValue = 0
  let onSitePipelineValue = 0
  let totalSends = 0
  let totalOpens = 0
  let totalClicks = 0
  let totalViews = 0
  let totalReplies = 0
  let wins = 0

  const DEAD_STATUS = new Set(['lost', 'archived', 'bounced'])

  for (const p of prospects) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1
    byOffer[p.recommendedOffer] = (byOffer[p.recommendedOffer] ?? 0) + 1
    bySizeBucket[p.sizeBucket] = (bySizeBucket[p.sizeBucket] ?? 0) + 1
    byEngagementTier[p.engagementTier] = (byEngagementTier[p.engagementTier] ?? 0) + 1
    if (p.callRecommended) callRecommendedCount += 1
    // Skip dead-status clinics from aggregate rollups + region/cohort/travel
    // groupings — they're inflating the visible pipeline & "outreach sent"
    // panes with prospects that will never convert.
    if (DEAD_STATUS.has(p.status)) continue
    byRegion[p.region] = (byRegion[p.region] ?? 0) + 1
    byCohort[p.cohortRecommendation] = (byCohort[p.cohortRecommendation] ?? 0) + 1
    byTravelBand[p.travelBand] = (byTravelBand[p.travelBand] ?? 0) + 1
    totalRevenuePotential += p.dealValue
    if (p.recommendedOffer === 'hub-pack') hubPackPipelineValue += p.dealValue
    else onSitePipelineValue += p.dealValue
    weightedPipeline += p.weightedPipelineValue
    totalSends += p.totalSends
    totalOpens += p.totalOpens
    totalClicks += p.totalClicks
    totalViews += p.totalPortalViews
    totalReplies += p.replies
    if (p.status === 'won') wins += 1
  }

  const sendOpenRate = totalSends > 0 ? totalOpens / totalSends : 0
  const openClickRate = totalOpens > 0 ? totalClicks / totalOpens : 0
  const sendReplyRate = totalSends > 0 ? totalReplies / totalSends : 0
  const replyToWinRate = totalReplies > 0 ? wins / totalReplies : 0

  return {
    byStatus,
    byRegion,
    byCohort,
    byTravelBand,
    byOffer,
    bySizeBucket,
    byEngagementTier,
    callRecommendedCount,
    revenue: {
      totalRevenuePotential,
      hubPackPipelineValue,
      onSitePipelineValue,
      weightedPipeline,
      wins,
    },
    funnel: {
      totalSends, totalOpens, totalClicks, totalViews, totalReplies, wins,
      sendOpenRate, openClickRate, sendReplyRate, replyToWinRate,
    },
  }
}
