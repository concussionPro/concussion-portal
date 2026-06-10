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
import { teamTotal, clinicalCount, computePricing, clinicSizeBucket, hubPackPriceFor, dealTypeForClinicalCount, type DealType } from '@/lib/prospect/pricing'
import { classifyStage, isHunterClean, buildStageMatrix, type MatrixRowInput, type PipelineStage } from '@/lib/prospect/stage'
import { computeAdaptiveCap, type CapDecision } from '@/lib/prospect/adaptive-cap'

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
  // Hunter verification (lazy-migrated columns)
  verification_status: string | null
  verification_result: string | null
  verification_score: number | null
  verification_role: boolean | null
  verification_accept_all: boolean | null
  verification_webmail: boolean | null
  verification_disposable: boolean | null
  last_verified_at: string | null
  // Reply detection (set by /api/webhooks/resend-inbound)
  replied_at: string | null
  reply_text: string | null
}

interface OutreachLogRow {
  id: number
  clinic_id: number
  audit_key: string | null
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
  // Real time-on-portal signals derived from interaction_type='exit' rows.
  // dwell_ms on an exit event = total session duration (page-load → tab-close).
  // total_dwell_ms = sum across all sessions. max_dwell_ms = longest session.
  // engaged_sessions = sessions where dwell > 30s (not a bounce).
  total_dwell_ms: number | string
  max_dwell_ms: number | string
  engaged_sessions: number | string
  // Real CTA clicks ON the dashboard (book-call, pricing, talk, hub-link, etc).
  // Unfakeable — scanners can't fire client-side click events on a SPA.
  cta_clicks: number | string
  top_cta_target: string | null
  unique_sections: number | string
  deepest_section: string | null
}

interface EventSignalRow {
  clinic_id: number
  delivered_emails: number | string
  bounced_emails: number | string
  open_days: number | string
  total_open_events: number | string
  cal_clicks: number | string
  cal_click_days: number | string
  distinct_url_clicks: number | string
  product_clicks: number | string
  other_clicks: number | string
  last_event_at: string | null
  last_click_at: string | null
  last_clicked_subject: string | null
}

interface RealSessionRow {
  clinic_id: number
  real_sessions: number | string
  last_real_session_at: string | null
}

interface TalkRequestRow {
  email: string
}

interface FreeContentRow {
  source_prospect_slug: string
  scat_course_count: number | string
  preseason_count: number | string
  scat_course_first_at: string | null
  preseason_first_at: string | null
}

interface PortalFlowRow {
  clinic_id: number
  section_funnel: Record<string, number>
  cta_clicks: Record<string, number>
  exit_sections: Record<string, number>
  avg_dwell_ms: number | string | null
  deepest_section: string | null
}

interface FunnelAggregateRow {
  section: string
  views: number | string
  exits: number | string
  cta_clicks: number | string
  avg_exit_dwell_ms: number | string | null
  median_exit_dwell_ms: number | string | null
  unique_prospects: number | string
}

interface CtaAggregateRow {
  target: string
  clicks: number | string
  unique_prospects: number | string
}

interface ReviewQueueDbRow {
  id: number
  short_name: string
  city: string | null
  state: string | null
  status: string
  scheduled_send_at: string | null
  verification_score: number | null
  clinical_count: number | string
  hunter_clean: boolean
  team_enriched: boolean
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

    // Lazy-migrate portal view tracking columns. Same ALTERs live in the
    // /api/prospect/[token]/track endpoint, but those only fire when a
    // human visits a portal. The aggregation here references the columns
    // independently so we ensure they exist on every read.
    try {
      await sql`ALTER TABLE prospect_portal_views ADD COLUMN IF NOT EXISTS interaction_type TEXT NOT NULL DEFAULT 'view'`
      await sql`ALTER TABLE prospect_portal_views ADD COLUMN IF NOT EXISTS target TEXT`
      await sql`ALTER TABLE prospect_portal_views ADD COLUMN IF NOT EXISTS dwell_ms INTEGER`
      // email_events.user_agent is written by the new webhook path — ensure
      // it exists so the human-filtered open counting below can't 42703.
      await sql`ALTER TABLE email_events ADD COLUMN IF NOT EXISTS user_agent TEXT`
    } catch (err) {
      console.error('[prospect-engagement] portal column migration failed:', err)
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

    // Pull all sources in parallel.
    // Self/admin seed-data exclusion: any prospect_clinics row whose slug,
    // short_name, or contact_email signals it is a test/preview record
    // belonging to Zac himself (e.g. send-portal-preview seed → "Zac Preview
    // Practice", slug 'zac-preview-demo'). Without this filter Zac's own
    // browsing inflates the engagement metrics and pollutes the "Call now"
    // list with himself.
    const [clinics, outreach, views, eventSignals, realSessions, talkRequests, freeContent, funnelAggregate, ctaAggregate, portalFlow, reviewQueueRows, capDecision] = await Promise.all([
      filterId !== null && !isNaN(filterId)
        ? sql<ClinicDbRow>`SELECT * FROM prospect_clinics WHERE id = ${filterId}`
        : sql<ClinicDbRow>`
            SELECT * FROM prospect_clinics
            WHERE COALESCE(slug, '') NOT ILIKE 'zac-preview%'
              AND COALESCE(short_name, '') NOT ILIKE '%zac%preview%'
              AND COALESCE(LOWER(contact_email), '') NOT IN ('zac@concussion-education-australia.com', 'z.lew87@gmail.com')
              AND COALESCE(LOWER(contact_email), '') NOT LIKE '%@concussion-education-australia.com'
          `,
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
            WITH filtered AS (
              SELECT * FROM prospect_portal_views
              WHERE clinic_id = ${filterId}
                AND COALESCE(user_agent, '') !~* '(microsoft office|bingpreview|mimecast|barracuda|proofpoint|cloudmark|symantec|sophos|fortinet|trend micro|safelinks|headlesschrome|phantomjs|puppeteer|playwright|googlebot|bingbot|yandex|baidu|crawler|spider|slurp|facebook|linkedin|whatsapp|telegram|skype|wget|curl|python-requests|node-fetch|axios|httpie|go-http-client|java/|okhttp|powershell)'
            ),
            top_cta AS (
              SELECT clinic_id, target
              FROM filtered
              WHERE interaction_type = 'cta_click' AND target IS NOT NULL
              GROUP BY clinic_id, target
              ORDER BY COUNT(*) DESC
              LIMIT 1
            ),
            deepest AS (
              SELECT clinic_id, section_visited
              FROM filtered
              WHERE interaction_type IN ('view','section_view')
              GROUP BY clinic_id, section_visited
              ORDER BY COUNT(*) DESC
              LIMIT 1
            )
            SELECT f.clinic_id,
              COUNT(*)::text AS total,
              COUNT(DISTINCT f.viewed_at::date)::int AS view_days,
              MIN(f.viewed_at) AS first_viewed_at, MAX(f.viewed_at) AS last_viewed_at,
              COALESCE(SUM(CASE WHEN f.interaction_type = 'exit' AND f.dwell_ms IS NOT NULL THEN f.dwell_ms ELSE 0 END), 0)::bigint AS total_dwell_ms,
              COALESCE(MAX(CASE WHEN f.interaction_type = 'exit' AND f.dwell_ms IS NOT NULL THEN f.dwell_ms ELSE 0 END), 0)::int AS max_dwell_ms,
              COUNT(*) FILTER (WHERE f.interaction_type = 'exit' AND f.dwell_ms > 60000)::int AS engaged_sessions,
              COUNT(*) FILTER (WHERE f.interaction_type = 'cta_click')::int AS cta_clicks,
              (SELECT target FROM top_cta WHERE clinic_id = f.clinic_id) AS top_cta_target,
              COUNT(DISTINCT f.section_visited) FILTER (WHERE f.interaction_type IN ('view','section_view'))::int AS unique_sections,
              (SELECT section_visited FROM deepest WHERE clinic_id = f.clinic_id) AS deepest_section
            FROM filtered f
            GROUP BY f.clinic_id`
        : sql<PortalViewRow>`
            WITH filtered AS (
              SELECT * FROM prospect_portal_views
              WHERE COALESCE(user_agent, '') !~* '(microsoft office|bingpreview|mimecast|barracuda|proofpoint|cloudmark|symantec|sophos|fortinet|trend micro|safelinks|headlesschrome|phantomjs|puppeteer|playwright|googlebot|bingbot|yandex|baidu|crawler|spider|slurp|facebook|linkedin|whatsapp|telegram|skype|wget|curl|python-requests|node-fetch|axios|httpie|go-http-client|java/|okhttp|powershell)'
            ),
            top_cta AS (
              SELECT clinic_id, target
              FROM filtered
              WHERE interaction_type = 'cta_click' AND target IS NOT NULL
              GROUP BY clinic_id, target
              ORDER BY COUNT(*) DESC
              LIMIT 1
            ),
            deepest AS (
              SELECT clinic_id, section_visited
              FROM filtered
              WHERE interaction_type IN ('view','section_view')
              GROUP BY clinic_id, section_visited
              ORDER BY COUNT(*) DESC
              LIMIT 1
            )
            SELECT f.clinic_id,
              COUNT(*)::text AS total,
              COUNT(DISTINCT f.viewed_at::date)::int AS view_days,
              MIN(f.viewed_at) AS first_viewed_at, MAX(f.viewed_at) AS last_viewed_at,
              COALESCE(SUM(CASE WHEN f.interaction_type = 'exit' AND f.dwell_ms IS NOT NULL THEN f.dwell_ms ELSE 0 END), 0)::bigint AS total_dwell_ms,
              COALESCE(MAX(CASE WHEN f.interaction_type = 'exit' AND f.dwell_ms IS NOT NULL THEN f.dwell_ms ELSE 0 END), 0)::int AS max_dwell_ms,
              COUNT(*) FILTER (WHERE f.interaction_type = 'exit' AND f.dwell_ms > 60000)::int AS engaged_sessions,
              COUNT(*) FILTER (WHERE f.interaction_type = 'cta_click')::int AS cta_clicks,
              (SELECT target FROM top_cta WHERE clinic_id = f.clinic_id) AS top_cta_target,
              COUNT(DISTINCT f.section_visited) FILTER (WHERE f.interaction_type IN ('view','section_view'))::int AS unique_sections,
              (SELECT section_visited FROM deepest WHERE clinic_id = f.clinic_id) AS deepest_section
            FROM filtered f
            GROUP BY f.clinic_id`,
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
                AND audit_key NOT LIKE '%:test:%'
            )
            SELECT cs.clinic_id,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'delivered' THEN ee.email_id END)::int AS delivered_emails,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'bounced' THEN ee.email_id END)::int AS bounced_emails,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' AND (ee.user_agent IS NULL OR ee.user_agent !~* ${BOT_REGEX}) THEN ee.created_at::date END)::int AS open_days,
              COUNT(CASE WHEN ee.event_type = 'opened' AND (ee.user_agent IS NULL OR ee.user_agent !~* ${BOT_REGEX}) THEN 1 END)::int AS total_open_events,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url ~* '(cal\\.com|cal_booking|/calendar)' THEN ee.id END)::int AS cal_clicks,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url ~* '(cal\\.com|cal_booking|/calendar)' THEN ee.created_at::date END)::int AS cal_click_days,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url IS NOT NULL AND ee.click_url !~* '(unsubscribe|osteopathy\\.org\\.au)' THEN ee.click_url END)::int AS distinct_url_clicks,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url ~* '(/p/[^?]+|/pricing|/dashboard|/hub)' AND ee.click_url !~* '(cal\\.com|cal_booking)' THEN ee.id END)::int AS product_clicks,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url !~* '(cal\\.com|cal_booking|/p/|/pricing|/dashboard|/hub|/calendar)' THEN ee.id END)::int AS other_clicks,
              MAX(ee.created_at) AS last_event_at,
              MAX(ee.created_at) FILTER (WHERE ee.event_type = 'clicked') AS last_click_at,
              MAX(ee.subject)    FILTER (WHERE ee.event_type = 'clicked') AS last_clicked_subject
            FROM cold_sent cs
            JOIN email_events ee ON ee.email_id = cs.resend_email_id
            GROUP BY cs.clinic_id`
        : sql<EventSignalRow>`
            WITH cold_sent AS (
              SELECT clinic_id, resend_email_id
              FROM prospect_outreach_log
              WHERE resend_email_id IS NOT NULL
                AND audit_key NOT LIKE '%:test:%'
            )
            SELECT cs.clinic_id,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'delivered' THEN ee.email_id END)::int AS delivered_emails,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'bounced' THEN ee.email_id END)::int AS bounced_emails,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' AND (ee.user_agent IS NULL OR ee.user_agent !~* ${BOT_REGEX}) THEN ee.created_at::date END)::int AS open_days,
              COUNT(CASE WHEN ee.event_type = 'opened' AND (ee.user_agent IS NULL OR ee.user_agent !~* ${BOT_REGEX}) THEN 1 END)::int AS total_open_events,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url ~* '(cal\\.com|cal_booking|/calendar)' THEN ee.id END)::int AS cal_clicks,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url ~* '(cal\\.com|cal_booking|/calendar)' THEN ee.created_at::date END)::int AS cal_click_days,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url IS NOT NULL AND ee.click_url !~* '(unsubscribe|osteopathy\\.org\\.au)' THEN ee.click_url END)::int AS distinct_url_clicks,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url ~* '(/p/[^?]+|/pricing|/dashboard|/hub)' AND ee.click_url !~* '(cal\\.com|cal_booking)' THEN ee.id END)::int AS product_clicks,
              COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' AND ee.click_url !~* '(cal\\.com|cal_booking|/p/|/pricing|/dashboard|/hub|/calendar)' THEN ee.id END)::int AS other_clicks,
              MAX(ee.created_at) AS last_event_at,
              MAX(ee.created_at) FILTER (WHERE ee.event_type = 'clicked') AS last_click_at,
              MAX(ee.subject)    FILTER (WHERE ee.event_type = 'clicked') AS last_clicked_subject
            FROM cold_sent cs
            JOIN email_events ee ON ee.email_id = cs.resend_email_id
            GROUP BY cs.clinic_id`,
      // Real browser sessions on /p/[slug] — unfakeable engagement.
      // analytics_events.session_id filtered to non-server sessions, with
      // bot UAs filtered at write time. This is the strongest signal
      // (cannot be inflated by Defender/Mimecast/Proofpoint scanners).
      filterId !== null && !isNaN(filterId)
        ? sql<RealSessionRow>`
            SELECT pc.id AS clinic_id,
                   COUNT(DISTINCT ae.session_id)::int AS real_sessions,
                   MAX(ae.created_at)                 AS last_real_session_at
            FROM prospect_clinics pc
            JOIN analytics_events ae ON ae.path LIKE '/p/' || pc.slug || '%'
            WHERE pc.id = ${filterId}
              AND ae.created_at >= NOW() - INTERVAL '90 days'
              AND ae.session_id IS NOT NULL
              AND ae.session_id NOT LIKE 'server_%'
            GROUP BY pc.id`
        : sql<RealSessionRow>`
            SELECT pc.id AS clinic_id,
                   COUNT(DISTINCT ae.session_id)::int AS real_sessions,
                   MAX(ae.created_at)                 AS last_real_session_at
            FROM prospect_clinics pc
            JOIN analytics_events ae ON ae.path LIKE '/p/' || pc.slug || '%'
            WHERE ae.created_at >= NOW() - INTERVAL '90 days'
              AND ae.session_id IS NOT NULL
              AND ae.session_id NOT LIKE 'server_%'
            GROUP BY pc.id`,
      // Talk-request submissions — keyed by email. Used to mark
      // prospects DONE so they don't surface as "needs personal outreach".
      sql<TalkRequestRow>`SELECT DISTINCT LOWER(email) AS email FROM talk_requests`,
      // Free-content signups attributed back via users.source_prospect_slug
      // (captured at signup from ?prospect={slug} URL param on /scat-mastery
      // and /preseason/register). Per-prospect counts of:
      //   - SCAT mastery free-course signups (signup_source = 'free-course')
      //   - Pre-season baseline-testing registrations (signup_source = 'preseason')
      // Both are explicit buying-intent actions, even stronger than a
      // dashboard CTA click because the prospect filled out a form.
      sql<FreeContentRow>`
        SELECT source_prospect_slug,
          COUNT(*) FILTER (WHERE signup_source = 'free-course')::int AS scat_course_count,
          COUNT(*) FILTER (WHERE signup_source = 'preseason')::int  AS preseason_count,
          MIN(created_at) FILTER (WHERE signup_source = 'free-course') AS scat_course_first_at,
          MIN(created_at) FILTER (WHERE signup_source = 'preseason')  AS preseason_first_at
        FROM users
        WHERE source_prospect_slug IS NOT NULL
        GROUP BY source_prospect_slug
      `,
      // ── AGGREGATE EXIT FUNNEL — where prospects bail, where they engage ──
      // Across ALL prospect portals, group portal_views by section_visited
      // and compute: total section views (denominator), exits, CTA clicks,
      // avg/median dwell-before-exit, unique prospects who hit the section.
      // Bot-filtered. Powers the "Where prospects drop off" dashboard panel
      // — the single most actionable signal for fixing conversion blockers.
      sql<FunnelAggregateRow>`
        WITH filtered AS (
          SELECT * FROM prospect_portal_views
          WHERE viewed_at >= NOW() - INTERVAL '90 days'
            AND COALESCE(user_agent, '') !~* '(microsoft office|bingpreview|mimecast|barracuda|proofpoint|cloudmark|symantec|sophos|fortinet|trend micro|safelinks|headlesschrome|phantomjs|puppeteer|playwright|googlebot|bingbot|yandex|baidu|crawler|spider|slurp|facebook|linkedin|whatsapp|telegram|skype|wget|curl|python-requests|node-fetch|axios|httpie|go-http-client|java/|okhttp|powershell)'
            AND section_visited IS NOT NULL
            AND section_visited <> ''
        )
        SELECT
          section_visited AS section,
          COUNT(*) FILTER (WHERE interaction_type IN ('view','section_view'))::int AS views,
          COUNT(*) FILTER (WHERE interaction_type = 'exit')::int AS exits,
          COUNT(*) FILTER (WHERE interaction_type = 'cta_click')::int AS cta_clicks,
          AVG(dwell_ms) FILTER (WHERE interaction_type = 'exit' AND dwell_ms IS NOT NULL)::int AS avg_exit_dwell_ms,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY dwell_ms) FILTER (WHERE interaction_type = 'exit' AND dwell_ms IS NOT NULL)::int AS median_exit_dwell_ms,
          COUNT(DISTINCT clinic_id)::int AS unique_prospects
        FROM filtered
        GROUP BY section_visited
        HAVING COUNT(*) >= 5     -- bumped from 2 to 5 to filter noise (Jun 9)
        ORDER BY views DESC
      `,
      // CTA aggregate — which CTAs on the dashboard actually get clicked
      // across all portals. Tells us which buttons are doing the work and
      // which copy/positioning isnt pulling.
      sql<CtaAggregateRow>`
        SELECT
          target,
          COUNT(*)::int AS clicks,
          COUNT(DISTINCT clinic_id)::int AS unique_prospects
        FROM prospect_portal_views
        WHERE interaction_type = 'cta_click'
          AND target IS NOT NULL
          AND target <> ''
          AND viewed_at >= NOW() - INTERVAL '90 days'
          AND COALESCE(user_agent, '') !~* '(microsoft office|safelinks|mimecast|barracuda|proofpoint|googlebot|bingbot|crawler|wget|curl|python-requests|node-fetch)'
        GROUP BY target
        ORDER BY clicks DESC
        LIMIT 20
      `,
      portalFlowQuery,
      // ── REVIEW QUEUE — unsent, non-terminal prospects awaiting Zac's
      // approve/archive decision, organised by deal-type tier. "Unsent"
      // means: still at T1 ('initial') with zero non-test production
      // outreach-log rows. Ordering mirrors the send priority: deal-type
      // tier ASC (on-site → hub-pack → individual), then Hunter-clean
      // rows first (they're the ones the HARD GATE will actually let
      // fire), then earliest scheduled. The size-tier CASE is copied
      // verbatim from the lib/prospect/process-scheduled.ts ORDER BY —
      // keep in lockstep with clinicalCount() in lib/prospect/pricing.ts
      // (7 clinical keys, excludes practiceManager/admin).
      sql<ReviewQueueDbRow>`
        SELECT pc.id, pc.short_name, pc.city, pc.state, pc.status,
          pc.scheduled_send_at, pc.verification_score,
          (COALESCE((pc.team->>'osteopaths')::int, 0)
            + COALESCE((pc.team->>'physiotherapists')::int, 0)
            + COALESCE((pc.team->>'generalPractitioners')::int, 0)
            + COALESCE((pc.team->>'sportsMedicineDoctors')::int, 0)
            + COALESCE((pc.team->>'exercisePhys')::int, 0)
            + COALESCE((pc.team->>'myotherapists')::int, 0)
            + COALESCE((pc.team->>'remedialMassage')::int, 0)) AS clinical_count,
          (pc.verification_score IS NOT NULL
            AND pc.verification_score >= 80
            AND COALESCE(pc.verification_role, FALSE) = FALSE
            AND COALESCE(pc.verification_accept_all, FALSE) = FALSE
            AND COALESCE(pc.verification_disposable, FALSE) = FALSE) AS hunter_clean,
          (COALESCE(pc.notes, '') LIKE '%[team-enriched=%') AS team_enriched
        FROM prospect_clinics pc
        WHERE pc.next_template_slug = 'initial'
          AND pc.status NOT IN ('archived', 'lost', 'bounced', 'won', 'replied', 'engaged-elsewhere')
          AND NOT EXISTS (
            SELECT 1 FROM prospect_outreach_log ol
            WHERE ol.clinic_id = pc.id AND ol.audit_key NOT LIKE '%:test:%'
          )
          -- Same self/admin seed-data exclusion as the clinics query above
          AND COALESCE(pc.slug, '') NOT ILIKE 'zac-preview%'
          AND COALESCE(pc.short_name, '') NOT ILIKE '%zac%preview%'
          AND COALESCE(LOWER(pc.contact_email), '') <> 'z.lew87@gmail.com'
          AND COALESCE(LOWER(pc.contact_email), '') NOT LIKE '%@concussion-education-australia.com'
        ORDER BY
          CASE
            WHEN (COALESCE((pc.team->>'osteopaths')::int, 0)
                + COALESCE((pc.team->>'physiotherapists')::int, 0)
                + COALESCE((pc.team->>'generalPractitioners')::int, 0)
                + COALESCE((pc.team->>'sportsMedicineDoctors')::int, 0)
                + COALESCE((pc.team->>'exercisePhys')::int, 0)
                + COALESCE((pc.team->>'myotherapists')::int, 0)
                + COALESCE((pc.team->>'remedialMassage')::int, 0)) >= 6 THEN 0
            WHEN (COALESCE((pc.team->>'osteopaths')::int, 0)
                + COALESCE((pc.team->>'physiotherapists')::int, 0)
                + COALESCE((pc.team->>'generalPractitioners')::int, 0)
                + COALESCE((pc.team->>'sportsMedicineDoctors')::int, 0)
                + COALESCE((pc.team->>'exercisePhys')::int, 0)
                + COALESCE((pc.team->>'myotherapists')::int, 0)
                + COALESCE((pc.team->>'remedialMassage')::int, 0)) >= 2 THEN 1
            ELSE 2
          END ASC,
          CASE WHEN (pc.verification_score IS NOT NULL
            AND pc.verification_score >= 80
            AND COALESCE(pc.verification_role, FALSE) = FALSE
            AND COALESCE(pc.verification_accept_all, FALSE) = FALSE
            AND COALESCE(pc.verification_disposable, FALSE) = FALSE) THEN 0 ELSE 1 END ASC,
          pc.scheduled_send_at ASC NULLS LAST
        LIMIT 600
      `,
      // Adaptive daily cap — same computation the cron uses. Never lets a
      // cap failure kill the dashboard: degrades to null.
      computeAdaptiveCap().catch((err): null => {
        console.error('[prospect-engagement] computeAdaptiveCap failed:', err)
        return null
      }),
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
    const realSessionsByClinic = new Map<number, RealSessionRow>()
    for (const r of realSessions.rows) realSessionsByClinic.set(r.clinic_id, r)
    const talkRequestSet = new Set<string>()
    for (const t of talkRequests.rows) talkRequestSet.add(t.email)
    const freeContentByProspect = new Map<string, FreeContentRow>()
    for (const f of freeContent.rows) {
      if (f.source_prospect_slug) freeContentByProspect.set(f.source_prospect_slug.toLowerCase(), f)
    }

    // Build rich rows
    const prospects = clinics.rows.map((c) => {
      const sends = outreachByClinic.get(c.id) ?? []
      const view = viewsByClinic.get(c.id)
      const totalOpens = sends.reduce((acc, s) => acc + (typeof s.opened_count === 'string' ? parseInt(s.opened_count, 10) : s.opened_count), 0)
      const totalClicks = sends.reduce((acc, s) => acc + (typeof s.clicked_count === 'string' ? parseInt(s.clicked_count, 10) : s.clicked_count), 0)
      // Replies — the money signal. The inbound webhook mirrors the reply
      // onto the latest outreach-log row AND sets prospect_clinics.replied_at
      // / status='replied'. Use BOTH so a reply that matched the clinic but
      // not a log row (e.g. log row filtered, or pre-log manual send) still
      // counts. STOP replies land as status='lost' and are not "replies".
      const logReplies = sends.filter((s) => s.replied_at).length
      const clinicReplied = c.status === 'replied' || (!!c.replied_at && c.status !== 'lost')
      const replies = Math.max(logReplies, clinicReplied ? 1 : 0)
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
      // Real time-on-portal — dwell_ms on exit events is total session
      // duration (page-load → tab-close). Sum across sessions gives the
      // honest "how much time have they spent looking at this" answer.
      const portalTotalDwellMs = view ? Number(view.total_dwell_ms ?? 0) : 0
      const portalMaxDwellMs = view ? Number(view.max_dwell_ms ?? 0) : 0
      const portalEngagedSessions = view ? Number(view.engaged_sessions ?? 0) : 0
      const portalCtaClicks = view ? Number(view.cta_clicks ?? 0) : 0
      const portalTopCtaTarget = view?.top_cta_target ?? null
      const portalUniqueSections = view ? Number(view.unique_sections ?? 0) : 0
      const portalDeepestSection = view?.deepest_section ?? null
      const signal = signalsByClinic.get(c.id)
      const totalDelivered = signal ? Number(signal.delivered_emails ?? 0) : 0
      const totalBounced = signal ? Number(signal.bounced_emails ?? 0) : 0
      const openDays = signal ? Number(signal.open_days ?? 0) : 0
      const calClicks = signal ? Number(signal.cal_clicks ?? 0) : 0
      const calClickDays = signal ? Number(signal.cal_click_days ?? 0) : 0
      const distinctUrlClicks = signal ? Number(signal.distinct_url_clicks ?? 0) : 0
      const productClicks = signal ? Number(signal.product_clicks ?? 0) : 0
      const otherClicks = signal ? Number(signal.other_clicks ?? 0) : 0
      const lastClickedSubject = signal?.last_clicked_subject ?? null
      const realRow = realSessionsByClinic.get(c.id)
      const realSessionsCount = realRow ? Number(realRow.real_sessions ?? 0) : 0
      const lastRealSessionAt = realRow?.last_real_session_at ?? null
      const hasTalkRequest = c.contact_email ? talkRequestSet.has(c.contact_email.toLowerCase()) : false
      // Hunter quality — gates HOT tier promotion. Low-quality contacts
      // (score<80, role mailbox, accept-all domain) tend to be heavily
      // gateway-scanned and yield false-positive "engagement". Even when
      // they cross the score threshold, we hold them at WARM.
      const hunterScore = c.verification_score ?? null
      const isRoleMailbox = c.verification_role === true
      const isAcceptAll = c.verification_accept_all === true
      const isHighQualityEmail =
        hunterScore == null ||  // never verified - default trust until checked
        (hunterScore >= 80 && !isRoleMailbox && !isAcceptAll && c.verification_disposable !== true)
      const freeContent = c.slug ? freeContentByProspect.get(c.slug.toLowerCase()) : undefined
      const scatCourseSignups = freeContent ? Number(freeContent.scat_course_count ?? 0) : 0
      const preseasonSignups = freeContent ? Number(freeContent.preseason_count ?? 0) : 0
      const scatCourseFirstAt = freeContent?.scat_course_first_at ?? null
      const preseasonFirstAt = freeContent?.preseason_first_at ?? null
      const hasFreeContentSignup = scatCourseSignups > 0 || preseasonSignups > 0
      const everSent = sends.length > 0

      // ── Pipeline-stage classification (the matrix spine) ──
      // Production sends only — when ?includeTest=true the sends array
      // contains test previews too, so re-filter via audit_key here.
      const prodSends = includeTest
        ? sends.filter((s) => !(s.audit_key ?? '').includes(':test:'))
        : sends
      const hunterClean = isHunterClean({
        score: hunterScore,
        role: isRoleMailbox,
        acceptAll: isAcceptAll,
        disposable: c.verification_disposable === true,
      })
      const stage = classifyStage({
        status: c.status,
        hasBooking: !!c.cal_booked_at && c.cal_booking_status !== 'cancelled',
        hasInitialSend: prodSends.some((s) => s.template_slug === 'initial'),
        hasFollowupSend: prodSends.some((s) => s.template_slug === 'followup'),
        hasFinalSend: prodSends.some((s) => s.template_slug === 'final'),
        hunterClean,
      })
      const dealType = dealTypeForClinicalCount(clinicalCount(c.team))
      // Team-size confidence — the enrichment sweep tags notes with
      // [team-enriched=N/...] when it counted real clinicians from the
      // clinic website. Untagged rows are running on seeded defaults.
      const teamEnriched = (c.notes ?? '').includes('[team-enriched=')

      // Top non-reply signal — what the strongest engagement marker is
      // for this clinic. Drives both tier and "why call this prospect"
      // copy in the admin dashboard. Reordered 2026-06-08 to put REAL
      // portal interactions ahead of email "product clicks" — the latter
      // is mostly anti-malware scanner pre-fetches (Defender/Mimecast/
      // Proofpoint fetch every email link once), so "product_click=1"
      // with no real session is almost always a scanner.
      //
      // Hierarchy (strongest → weakest):
      //  cal_booked       : literal booking via cal.com webhook
      //  portal_cta_click : clicked a CTA on the dashboard itself (book/pricing/talk)
      //  portal_deep_dive : viewed 5+ unique sections (deep read)
      //  cal_click        : clicked cal.com link from email
      //  return_view      : came back on 2+ different days
      //  portal_long_dwell: session >60s on the portal (genuine read)
      //  multi_day_opens  : opens on 2+ different days
      //  product_click    : email click to /p/[slug] / /pricing (likely scanner)
      //  single_view      : one portal session
      //  single_open      : one email open (Apple MPP noise)
      const isCalBooked = c.cal_booking_status === 'booked' && c.cal_booked_at !== null
      // SCANNER-SUSPECT: portal sessions exist but every one was <30s.
      // Pattern of anti-malware link inspectors (Defender ATP, Cloudflare
      // Email Security, etc) that render the page in headless Chrome to
      // inspect links and close in 2-3s. IntersectionObserver fires for
      // every visible section during render → looks like "deep dive"
      // but no human dwell. Without engaged_sessions>=1 OR a dashboard
      // CTA click, no portal signal can be trusted.
      const scannerSuspect = portalUniqueSections > 0 && portalEngagedSessions === 0 && portalCtaClicks === 0
      const topSignal: 'cal_booked' | 'scat_course_signup' | 'preseason_signup' | 'portal_cta_click' | 'portal_deep_dive' | 'cal_click' | 'return_view' | 'portal_long_dwell' | 'product_click' | 'multi_day_opens' | 'scanner_suspect' | 'single_view' | 'single_open' | 'none' =
        isCalBooked ? 'cal_booked'
        : preseasonSignups > 0 ? 'preseason_signup'        // strongest free-content signal
        : scatCourseSignups > 0 ? 'scat_course_signup'     // submitted email for free SCAT course
        : portalCtaClicks > 0 ? 'portal_cta_click'
        : (portalUniqueSections >= 5 && portalEngagedSessions >= 1) ? 'portal_deep_dive'
        : calClickDays >= 2 ? 'cal_click'
        : (viewDays >= 2 && portalEngagedSessions >= 1) ? 'return_view'
        : portalMaxDwellMs >= 60_000 ? 'portal_long_dwell'
        : (openDays >= 2 && totalOpens >= 3) ? 'multi_day_opens'
        : scannerSuspect ? 'scanner_suspect'
        : productClicks > 0 ? 'product_click'
        : portalViews > 0 ? 'single_view'
        : totalOpens > 0 ? 'single_open'
        : 'none'

      // Engagement tier — REBUILT 2026-06-08 to make tier promotion
      // require ACTION TAKEN, not just time spent. Sub-60s dwell, single
      // sessions without clicks, and email-link clicks (scanner-prone)
      // no longer promote past warm.
      //
      // HOT = explicit buying-intent action:
      //   - Cal booked / talk request (already pulled into ENGAGED/REPLIED)
      //   - Dashboard CTA click (Book/Pricing/Talk - JS-only, scanner-immune)
      //   - Cal.com clicks on 2+ different days (single day = scanner)
      // WARM = real attention but no action yet:
      //   - 1+ engaged session (>60s real dwell)
      //   - Total portal time >= 3 minutes
      //   - Multi-day opens (>=2 days AND >=3 total opens)
      //   - Return-day view + engaged session
      // COLD = scanner-suspect / single open / nothing
      // Days since first send — used by both scoring (personal outreach
      // candidate window) and outreachStatus (GO NOW gate). Declared here
      // so engagementScore can reference it.
      const daysSinceFirstSend = lastSent?.sent_at
        ? Math.floor((Date.now() - new Date(lastSent.sent_at).getTime()) / 86_400_000)
        : null

      // ── BEHAVIOURAL LEAD SCORING (HubSpot / Marketo / Salesforce model) ──
      // Accumulating point score across every touch. Recency-weighted: any
      // signal in the last 7 days counts at full weight; older signals
      // contribute at 50%. Replied/Won are terminal states; all others
      // get tier-classified by score.
      //
      // Point weights — based on industry-standard B2B scoring + our
      // scanner-aware adjustments:
      //   Cal booked           : 200 pts (terminal-ish, booking confirmed)
      //   Reply / Talk-req     : 100 pts each
      //   Preseason signup     :  50 pts each (form submission, athletes)
      //   Free SCAT signup     :  40 pts each (form submission)
      //   Cal multi-day click  :  30 pts (real human revisit)
      //   Dashboard CTA click  :  20 pts each (client-side, scanner-immune)
      //   Engaged session >60s :  10 pts each (real dwell)
      //   Distinct URL click   :   5 pts each (anti-scanner email click)
      //   Portal session       :   3 pts each (even brief - some signal)
      //   Email open day       :   1 pt each day (MPP-noisy but cheap)
      //
      // Tier thresholds (calibrated against B2B benchmarks):
      //   COLD : score < 5    (Apple-MPP noise / scanner-only / nothing)
      //   WARM : score 5-24   (multiple touches, real interaction)
      //   HOT  : score 25+    (sustained engagement, monitor closely)
      // Score formula now scanner-aware end-to-end. When scannerSuspect:
      //   - distinct URL clicks are pre-fetches → 0 contribution
      //   - portal views are headless renders → 0 contribution
      //   - portal sessions are headless renders → already 0 (engaged=0)
      // Only signals that cannot be faked (cal booking, talk-req, free-content
      // form, dashboard CTA, multi-day cal clicks, engaged sessions >60s)
      // contribute when the prospect is flagged scanner-suspect.
      const engagementScore =
        (isCalBooked ? 200 : 0)
        + replies * 100
        + (hasTalkRequest ? 100 : 0)
        + preseasonSignups * 50
        + scatCourseSignups * 40
        + (calClickDays >= 2 ? 30 : 0)
        + portalCtaClicks * 20
        + portalEngagedSessions * 10
        + (scannerSuspect ? 0 : distinctUrlClicks * 5)
        + (scannerSuspect ? 0 : Math.min(portalViews, 10) * 3)
        // Open days: subtract 1 to suppress single Apple-MPP-day open
        // (1 day = 0 pts, 2+ days contribute at 1 pt each beyond the first)
        + Math.max(0, openDays - 1) * 1

      let engagementTier: 'cold' | 'warm' | 'hot' | 'engaged' | 'replied' | 'won' = 'cold'
      if (c.status === 'won') engagementTier = 'won'
      else if (replies > 0) engagementTier = 'replied'
      else if (isCalBooked || hasTalkRequest) engagementTier = 'engaged' // terminal: contact confirmed
      // Scanner-suspect AND low Hunter quality both block HOT promotion.
      // Low-quality emails (score<80, role mailbox, accept-all) over-report
      // engagement due to gateway scanning of shared inboxes.
      else if (engagementScore >= 25 && !scannerSuspect && isHighQualityEmail) engagementTier = 'hot'
      else if (engagementScore >= 5) engagementTier = 'warm'
      else engagementTier = 'cold'

      // Personal-outreach candidate — HOT tier prospects who have had time
      // to digest at least T1 (7+ days since first send) AND are still
      // active enough to warrant a manual nudge. Industry research:
      // Salesloft/HubSpot find 7-10d post-T1 is the optimal manual-touch
      // window when behavioural score sits in the upper quartile.
      const personalOutreachCandidate =
        engagementTier === 'hot' &&
        !isCalBooked && !hasTalkRequest && replies === 0 &&
        daysSinceFirstSend != null && daysSinceFirstSend >= 7 && daysSinceFirstSend <= 21

      // ── Outreach status — time-frame green-light for personal email.
      // Hot threshold tightened 2026-06-08 because anti-malware link
      // inspectors (Defender ATP, Cloudflare ES) render the portal in
      // headless Chrome, generating real session_ids + IntersectionObserver
      // section_views, then close in 2-3s. Without dwell or a client-side
      // CTA click, the data is unreliable.
      //
      // Trusted hot signals (any one promotes to hot):
      //   - cal.com booking confirmed
      //   - talk request submitted
      //   - cal.com clicked on 2+ different days (scanner only fetches once)
      //   - 1+ dashboard CTA click (client-side JS event — unfakeable)
      //   - 1+ engaged session (>30s on portal — real human dwell)
      //
      // Status windows once hot:
      //   cool       (0-48h)  : let them digest, don't seem desperate
      //   go         (48h-7d) : sweet spot for personal email — GO NOW
      //   last-chance (7-14d) : one tactical follow-up before drop
      //   long-nurture (14d+) : drop to quarterly seasonal cadence
      //   done       : booked / talk-req / replied
      //   not-hot    : never crossed the hot threshold (incl scanner-suspect)
      const isHot =
        isCalBooked ||
        hasTalkRequest ||
        hasFreeContentSignup ||      // signed up for free SCAT course or pre-season tool
        calClickDays >= 2 ||
        portalCtaClicks >= 1
      // Last signal across all channels — most recent of click / portal
      // view / real session / open. Drives the "today" engagement view.
      const lastSignalCandidates = [
        signal?.last_event_at,
        signal?.last_click_at,
        view?.last_viewed_at,
        lastRealSessionAt,
        scatCourseFirstAt,
        preseasonFirstAt,
      ].filter((d): d is string => !!d && new Date(d).getFullYear() > 2000)
      const lastSignalAt = lastSignalCandidates.length
        ? lastSignalCandidates.reduce((max, d) => (new Date(d).getTime() > new Date(max).getTime() ? d : max))
        : null
      const hoursSinceHotSignal = isHot && lastSignalAt
        ? Math.floor((Date.now() - new Date(lastSignalAt).getTime()) / 3_600_000)
        : null
      // Days since T1 send — gates GO NOW. Reaching out personally
      // before T1 has had a working week to land risks looking pushy
      // and competing with the prospects own fresh memory of T1.
      // Healthcare clinicians often batch-read on weekends, so wait
      // 5 calendar days minimum from T1 before allowing GO NOW.
      // (daysSinceFirstSend already computed earlier for engagement scoring)
      const MIN_DAYS_SINCE_T1_FOR_GO = 3
      // Windowing tightened 2026-06-08 based on Salesloft/HubSpot meeting-
      // conversion data: 48h-5d is the sweet spot (~3-day peak), conversion
      // drops 30% by day 5 and another 40% by day 7. Engaged signal at 7+
      // days is stale - memory of why they engaged has faded.
      //
      //   cool       (0-48h)     : digest window - dont seem desperate
      //   go         (48h-120h)  : 🟢 SWEET SPOT - 2-5 days post hot signal
      //   last-chance (120-240h) : 🟡 5-10d - one tactical follow-up
      //   long-nurture (240h+)   : 🔴 10d+ - quarterly cadence only
      let outreachStatus: 'cool' | 'go' | 'last-chance' | 'long-nurture' | 'done' | 'not-hot'
      if (isCalBooked || hasTalkRequest || replies > 0) {
        outreachStatus = 'done'
      } else if (!isHot || hoursSinceHotSignal == null) {
        outreachStatus = 'not-hot'
      } else if (hoursSinceHotSignal < 48 || (daysSinceFirstSend != null && daysSinceFirstSend < MIN_DAYS_SINCE_T1_FOR_GO)) {
        outreachStatus = 'cool'
      } else if (hoursSinceHotSignal <= 120) {        // 5 days
        outreachStatus = 'go'
      } else if (hoursSinceHotSignal <= 240) {        // 10 days
        outreachStatus = 'last-chance'
      } else {
        outreachStatus = 'long-nurture'
      }
      // Today's engagement boolean — any signal in the last 24h. Surfaces
      // "engaged today" rollup at the top of the dashboard.
      const engagedToday = !!lastSignalAt && (Date.now() - new Date(lastSignalAt).getTime()) < 86_400_000

      // ── Personal call recommendation — only for high-intent signals.
      // We don't call on a single open or single same-day portal view —
      // those signals are too noisy to spend Zac's time on. We DO call
      // for cal_click, return-day visits, and product clicks.
      //
      // Cal-booked clinics are SUPPRESSED from call-recommended — the
      // call is already on the calendar. They surface in their own
      // "Upcoming bookings" group instead. This stops the dashboard
      // from telling Zac to "call this person" when a meeting is locked.
      // Call-recommended = surface in "Call now" table. Requires LITERAL
      // action proof - never includes scanner-suspect prospects, never
      // includes prospects whose only signal is stale DB c.status='engaged'.
      // Aligned with the new HOT NOW threshold so both views agree on
      // who deserves a personal call.
      const callRecommended =
        everSent &&
        !isCalBooked &&
        !hasTalkRequest &&
        !scannerSuspect &&
        !['lost', 'bounced', 'archived', 'won', 'replied'].includes(c.status) &&
        (
          portalCtaClicks > 0 ||
          calClickDays >= 2 ||
          hasFreeContentSignup ||
          (portalMaxDwellMs >= 60_000 && openDays >= 2)
        )

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
        // Pipeline matrix fields — mutually exclusive stage, deal-type tier,
        // cron-gate pass/fail, team-size data confidence
        stage,
        dealType,
        hunterClean,
        teamEnriched,
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
        totalDelivered,           // distinct delivered emails (Resend webhook)
        totalBounced,             // distinct bounced emails
        totalOpens,
        totalClicks,
        replies,
        repliedAt: c.replied_at ?? null,
        replyText: c.reply_text ?? null,
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
        calClickDays,
        distinctUrlClicks,
        productClicks,
        otherClicks,
        lastClickedSubject,
        // Unfakeable signals + status (was duplicated to /admin/b2b-outreach)
        realSessions: realSessionsCount,
        lastRealSessionAt,
        outreachStatus,
        hoursSinceHotSignal,
        lastSignalAt,
        engagedToday,
        hasTalkRequest,
        // portal
        totalPortalViews: view ? parseInt(view.total, 10) : 0,
        viewDays,
        firstPortalViewAt: view?.first_viewed_at ?? null,
        lastPortalViewAt: view?.last_viewed_at ?? null,
        // Real engagement on the dashboard — unfakeable client-side signals
        portalTotalDwellMs,         // total seconds across all sessions
        portalMaxDwellMs,           // longest single session
        portalEngagedSessions,      // sessions >30s (not a bounce)
        portalCtaClicks,            // CTA clicks ON the dashboard
        portalTopCtaTarget,         // most-clicked CTA target ('book-call', etc)
        portalUniqueSections,       // distinct sections viewed
        portalDeepestSection,       // most-viewed section
        scannerSuspect,             // sessions exist but every one <30s — likely anti-malware pre-fetch
        // Free-content signups attributed back from cold-email URL param
        scatCourseSignups,          // count of users.signup_source='free-course' with this slug
        preseasonSignups,           // count of users.signup_source='preseason' with this slug
        scatCourseFirstAt,
        preseasonFirstAt,
        hasFreeContentSignup,
        // Behavioural lead score (accumulating point system, scanner-aware).
        // Tier classification flows from this: <5 cold, 5-24 warm, 25+ hot.
        engagementScore,
        // Personal-outreach candidate flag (HOT + 7-21d since T1, no booking)
        personalOutreachCandidate,
        daysSinceFirstSend,
        // Hunter email-verification status (drives email-quality filtering)
        hunterScore,
        hunterStatus: c.verification_status,
        hunterResult: c.verification_result,
        hunterRole: isRoleMailbox,
        hunterAcceptAll: isAcceptAll,
        hunterWebmail: c.verification_webmail === true,
        hunterDisposable: c.verification_disposable === true,
        lastVerifiedAt: c.last_verified_at,
        isHighQualityEmail,
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

    // ── STAGE MATRIX — the pipeline spine ──
    // Rows = deal-type tiers, columns = mutually exclusive stages. Every
    // non-archived prospect lands in exactly one cell (classifyStage is
    // exhaustive); poolSize reconciles with the sum of all cells. Computed
    // from the prospect rows already in memory — no extra query, and always
    // live (the team-enrichment sweep rewrites counts pool-wide).
    const matrixRows: MatrixRowInput[] = prospects
      .filter((p) => p.status !== 'archived')
      .map((p) => ({ stage: p.stage, dealType: p.dealType, dealValue: p.dealValue, status: p.status }))
    const stageMatrix = buildStageMatrix(
      matrixRows,
      prospects.filter((p) => p.status === 'archived').length,
    )

    // ── TODAY — what the machine is doing right now ──
    // All computed live from rows already in memory. Terminal set mirrors
    // the cron driver-query exclusion in lib/prospect/process-scheduled.ts.
    const CRON_TERMINAL = new Set(['archived', 'lost', 'bounced', 'engaged', 'won', 'engaged-elsewhere', 'replied'])
    const now = Date.now()
    const todayUtc = new Date().toISOString().slice(0, 10)
    const endOfTomorrowUtc = new Date(now)
    endOfTomorrowUtc.setUTCDate(endOfTomorrowUtc.getUTCDate() + 1)
    endOfTomorrowUtc.setUTCHours(23, 59, 59, 999)
    const autoVerifyHorizon = now + 3 * 86_400_000 // mirrors autoVerifyDueProspects (NOW() + 3 days)

    // Production sends today (UTC). Default outreach query already excludes
    // test sends; re-filter when includeTest=true.
    const prodOutreachRows = includeTest
      ? outreach.rows.filter((o) => !(o.audit_key ?? '').includes(':test:'))
      : outreach.rows
    const sentToday = prodOutreachRows.filter(
      (o) => new Date(o.sent_at).toISOString().slice(0, 10) === todayUtc,
    ).length

    const inCronQueue = (p: (typeof prospects)[number]) =>
      p.nextTemplateSlug != null && p.scheduledSendAt != null && !CRON_TERMINAL.has(p.status)
    // Due through end of tomorrow AND Hunter-clean — what the cron will fire.
    const dueTomorrow = prospects.filter(
      (p) => inCronQueue(p) && new Date(p.scheduledSendAt!).getTime() <= endOfTomorrowUtc.getTime() && p.hunterClean,
    ).length
    // Never-verified prospects inside the auto-verify window — what the
    // cron's Hunter pass (25/run) will chew through next.
    const unverifiedDue = prospects.filter(
      (p) => inCronQueue(p) && new Date(p.scheduledSendAt!).getTime() <= autoVerifyHorizon && p.hunterScore == null,
    ).length
    // HARD-GATE blocked: due NOW but failing the Hunter gate — stranded
    // until re-verified / enriched. Reason buckets can overlap; total is
    // distinct prospects. TS mirror of computeGateBlockedBreakdown().
    const gateBlockedRows = prospects.filter(
      (p) => inCronQueue(p) && new Date(p.scheduledSendAt!).getTime() <= now && !p.hunterClean,
    )
    const gateBlocked = {
      total: gateBlockedRows.length,
      unverified: gateBlockedRows.filter((p) => p.hunterScore == null).length,
      lowScore: gateBlockedRows.filter((p) => p.hunterScore != null && p.hunterScore < 80).length,
      role: gateBlockedRows.filter((p) => p.hunterRole).length,
      acceptAll: gateBlockedRows.filter((p) => p.hunterAcceptAll).length,
      disposable: gateBlockedRows.filter((p) => p.hunterDisposable).length,
    }

    const cap: CapDecision | null = capDecision
    const today = {
      sentToday,
      cap: cap?.cap ?? null,
      capReason: cap?.reason ?? null,
      dueTomorrow,
      unverifiedDue,
      gateBlocked,
    }

    // Funnel + CTA aggregates — across-all-portals view for the "where
    // prospects drop off" panel. Computed once per request, sent down
    // so the UI can render the conversion-bottleneck story without
    // recomputing client-side.
    const funnelSections = funnelAggregate.rows.map(r => ({
      section: r.section,
      views: Number(r.views ?? 0),
      exits: Number(r.exits ?? 0),
      ctaClicks: Number(r.cta_clicks ?? 0),
      uniqueProspects: Number(r.unique_prospects ?? 0),
      avgExitDwellMs: r.avg_exit_dwell_ms != null ? Number(r.avg_exit_dwell_ms) : null,
      medianExitDwellMs: r.median_exit_dwell_ms != null ? Number(r.median_exit_dwell_ms) : null,
      exitRate: Number(r.views ?? 0) > 0 ? Number(r.exits ?? 0) / Number(r.views ?? 0) : 0,
      ctaRate: Number(r.views ?? 0) > 0 ? Number(r.cta_clicks ?? 0) / Number(r.views ?? 0) : 0,
    }))
    const ctaTargets = ctaAggregate.rows.map(r => ({
      target: r.target,
      clicks: Number(r.clicks ?? 0),
      uniqueProspects: Number(r.unique_prospects ?? 0),
    }))

    // Review queue — unsent, non-terminal prospects ordered by send
    // priority (tier ASC → Hunter-clean first → earliest scheduled).
    // dealType derives from the SQL clinical sum via the same
    // dealTypeForClinicalCount() boundaries the breakdown uses.
    const reviewQueue = reviewQueueRows.rows.map((r) => {
      const clinical = Number(r.clinical_count ?? 0)
      const hunterClean = r.hunter_clean === true
      // These rows are by definition unsent + non-terminal, so the stage
      // can only be ready / awaiting-approval / blocked.
      const stage: PipelineStage = classifyStage({
        status: r.status,
        hasBooking: false,
        hasInitialSend: false,
        hasFollowupSend: false,
        hasFinalSend: false,
        hunterClean,
      })
      return {
        id: r.id,
        shortName: r.short_name,
        city: r.city,
        state: r.state,
        clinicalCount: clinical,
        dealType: dealTypeForClinicalCount(clinical),
        status: r.status,
        hunterScore: r.verification_score,
        hunterClean,
        scheduledSendAt: r.scheduled_send_at,
        stage,
        teamEnriched: r.team_enriched === true,
      }
    })

    return NextResponse.json({
      ok: true,
      count: prospects.length,
      prospects,
      aggregates,
      funnelSections,
      ctaTargets,
      reviewQueue,
      // Pipeline rebuild (2026-06-10): matrix spine + today's machine state
      // + the adaptive cap the cron will apply. Additive — all prior fields
      // unchanged.
      stageMatrix,
      today,
      capDecision: cap,
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
  totalDelivered: number
  totalBounced: number
  totalOpens: number
  totalClicks: number
  totalPortalViews: number
  replies: number
  engagementTier: string
  callRecommended: boolean
  hunterResult: string | null
  lastVerifiedAt: string | null
  sends: Array<{ templateSlug: string }>
  clinicalCount: number
  nextTemplateSlug: string | null
  hunterScore: number | null
  hunterRole: boolean
  hunterAcceptAll: boolean
  hunterDisposable: boolean
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

  const DEAD_STATUS = new Set(['lost', 'archived', 'bounced', 'engaged-elsewhere'])

  let totalDelivered = 0
  let totalBouncedEmails = 0

  // ── DEAL-TYPE BREAKDOWN (on-site / hub-pack / individual) ──
  // Tier boundaries live in dealTypeForClinicalCount() in
  // lib/prospect/pricing.ts — the same >=6 / 2-5 / <=1 clinical split
  // the cron send-priority CASE uses. Counted over the full pool (like
  // coldFunnel) so totals reconcile with `pooled`; dealValueTotal
  // excludes dead statuses (mirrors revenue.totalRevenuePotential) and
  // sums the same offer-matched computed dealValue used everywhere else
  // in this route (there is no deal-value column in the DB).
  const emptyTierStats = () => ({
    total: 0,
    hunterClean: 0,     // score>=80 AND not role/accept-all/disposable — passes the HARD GATE
    gateBlocked: 0,     // the rest — stranded until re-verified / enriched
    unsentQueued: 0,    // next='initial', zero production sends, non-terminal — the review-queue population
    sent: 0,            // ≥1 production send
    replied: 0,
    dealValueTotal: 0,  // non-dead only
  })
  const dealTypeBreakdown: Record<DealType, ReturnType<typeof emptyTierStats>> = {
    'on-site': emptyTierStats(),
    'hub-pack': emptyTierStats(),
    'individual': emptyTierStats(),
  }
  // Terminal statuses for the review queue — matches the exclusion list
  // in the reviewQueue SQL above ('engaged' stays reviewable).
  const REVIEW_TERMINAL = new Set(['archived', 'lost', 'bounced', 'won', 'replied', 'engaged-elsewhere'])

  // ── COLD-OUTREACH FUNNEL (clinic-level stage counts, full pool) ──
  // pooled → verified (Hunter deliverable) → T1/T2/T3 sent → delivered →
  // opened → clicked → portal viewed → replied → lost/unsubscribed.
  // Counted over ALL prospects (incl. dead) so the funnel shows true
  // attrition; the rate metrics below stay non-dead-scoped as before.
  const coldFunnel = {
    pooled: 0,
    verifiedAny: 0,          // Hunter has checked the address
    verifiedDeliverable: 0,  // Hunter says deliverable (sendable)
    sentClinics: 0,          // ≥1 production send
    t1Sent: 0, t2Sent: 0, t3Sent: 0,
    deliveredClinics: 0,     // ≥1 delivered event
    openedClinics: 0,        // ≥1 human-filtered open
    clickedClinics: 0,       // ≥1 click
    portalViewedClinics: 0,  // ≥1 portal view
    repliedClinics: 0,       // the money signal
    wonClinics: 0,
    lostClinics: 0,          // STOP replies / explicit rejection
    bouncedClinics: 0,
  }

  for (const p of prospects) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1
    byOffer[p.recommendedOffer] = (byOffer[p.recommendedOffer] ?? 0) + 1
    bySizeBucket[p.sizeBucket] = (bySizeBucket[p.sizeBucket] ?? 0) + 1
    byEngagementTier[p.engagementTier] = (byEngagementTier[p.engagementTier] ?? 0) + 1
    if (p.callRecommended) callRecommendedCount += 1

    // Funnel stage counts — full pool
    coldFunnel.pooled += 1
    if (p.lastVerifiedAt) coldFunnel.verifiedAny += 1
    if (p.hunterResult === 'deliverable') coldFunnel.verifiedDeliverable += 1
    if (p.totalSends > 0) coldFunnel.sentClinics += 1
    for (const s of p.sends) {
      if (s.templateSlug === 'initial') coldFunnel.t1Sent += 1
      else if (s.templateSlug === 'followup') coldFunnel.t2Sent += 1
      else if (s.templateSlug === 'final') coldFunnel.t3Sent += 1
    }
    if (p.totalDelivered > 0) coldFunnel.deliveredClinics += 1
    if (p.totalOpens > 0) coldFunnel.openedClinics += 1
    if (p.totalClicks > 0) coldFunnel.clickedClinics += 1
    if (p.totalPortalViews > 0) coldFunnel.portalViewedClinics += 1
    if (p.replies > 0) coldFunnel.repliedClinics += 1
    if (p.status === 'won') coldFunnel.wonClinics += 1
    if (p.status === 'lost') coldFunnel.lostClinics += 1
    if (p.status === 'bounced') coldFunnel.bouncedClinics += 1

    // Deal-type tier rollup — full pool, dealValueTotal non-dead only
    const tierStats = dealTypeBreakdown[dealTypeForClinicalCount(p.clinicalCount)]
    tierStats.total += 1
    const hunterClean =
      p.hunterScore != null && p.hunterScore >= 80 &&
      !p.hunterRole && !p.hunterAcceptAll && !p.hunterDisposable
    if (hunterClean) tierStats.hunterClean += 1
    else tierStats.gateBlocked += 1
    if (p.nextTemplateSlug === 'initial' && p.totalSends === 0 && !REVIEW_TERMINAL.has(p.status)) {
      tierStats.unsentQueued += 1
    }
    if (p.totalSends > 0) tierStats.sent += 1
    if (p.replies > 0) tierStats.replied += 1
    if (!DEAD_STATUS.has(p.status)) tierStats.dealValueTotal += p.dealValue

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
    totalDelivered += p.totalDelivered
    totalBouncedEmails += p.totalBounced
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
  const deliveryRate = totalSends > 0 ? totalDelivered / totalSends : 0

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
      totalSends, totalDelivered, totalBouncedEmails, totalOpens, totalClicks, totalViews, totalReplies, wins,
      sendOpenRate, openClickRate, sendReplyRate, replyToWinRate, deliveryRate,
    },
    coldFunnel,
    dealTypeBreakdown,
  }
}
