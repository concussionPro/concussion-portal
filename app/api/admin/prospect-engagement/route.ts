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
  first_viewed_at: string | null
  last_viewed_at: string | null
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

    // Pull all three tables in parallel
    const [clinics, outreach, views] = await Promise.all([
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
              MIN(viewed_at) AS first_viewed_at, MAX(viewed_at) AS last_viewed_at
            FROM prospect_portal_views
            WHERE clinic_id = ${filterId}
              AND COALESCE(user_agent, '') !~* '(microsoft office|bingpreview|mimecast|barracuda|proofpoint|cloudmark|symantec|sophos|fortinet|trend micro|safelinks|headlesschrome|phantomjs|puppeteer|playwright|googlebot|bingbot|yandex|baidu|crawler|spider|slurp|facebook|linkedin|whatsapp|telegram|skype|wget|curl|python-requests|node-fetch|axios|httpie|go-http-client|java/|okhttp|powershell)'
            GROUP BY clinic_id`
        : sql<PortalViewRow>`
            SELECT clinic_id, COUNT(*)::text AS total,
              MIN(viewed_at) AS first_viewed_at, MAX(viewed_at) AS last_viewed_at
            FROM prospect_portal_views
            WHERE COALESCE(user_agent, '') !~* '(microsoft office|bingpreview|mimecast|barracuda|proofpoint|cloudmark|symantec|sophos|fortinet|trend micro|safelinks|headlesschrome|phantomjs|puppeteer|playwright|googlebot|bingbot|yandex|baidu|crawler|spider|slurp|facebook|linkedin|whatsapp|telegram|skype|wget|curl|python-requests|node-fetch|axios|httpie|go-http-client|java/|okhttp|powershell)'
            GROUP BY clinic_id`,
    ])

    // Index helpers
    const outreachByClinic = new Map<number, OutreachLogRow[]>()
    for (const o of outreach.rows) {
      if (!outreachByClinic.has(o.clinic_id)) outreachByClinic.set(o.clinic_id, [])
      outreachByClinic.get(o.clinic_id)!.push(o)
    }
    const viewsByClinic = new Map<number, PortalViewRow>()
    for (const v of views.rows) viewsByClinic.set(v.clinic_id, v)

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

      // Engagement tier — segments prospects for outreach prioritisation.
      // Driven by total opens, total clicks, portal views, replies, and
      // status. Bot-filtered portal views already happens at the SQL layer.
      const portalViews = view ? parseInt(view.total, 10) : 0
      const everSent = sends.length > 0
      let engagementTier: 'cold' | 'warm' | 'hot' | 'engaged' | 'replied' | 'won' = 'cold'
      if (c.status === 'won') engagementTier = 'won'
      else if (replies > 0) engagementTier = 'replied'
      else if (c.status === 'engaged' || (totalClicks > 0 && portalViews > 0)) engagementTier = 'engaged'
      else if (totalClicks > 0 || portalViews >= 2 || totalOpens >= 3) engagementTier = 'hot'
      else if (totalOpens > 0 || portalViews > 0) engagementTier = 'warm'
      else engagementTier = 'cold'

      // Personal-call-recommended: clinic showed engagement signals but
      // hasn't booked a cal.com slot or replied yet. Zac's time is the
      // bottleneck — surface only the clinics where a manual call would
      // likely close. Suppress when clinic hasn't been sent to (no signal
      // yet) or is already in won/replied state (done) or lost/bounced.
      const callRecommended =
        everSent &&
        ['hot', 'engaged'].includes(engagementTier) &&
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
        // portal
        totalPortalViews: view ? parseInt(view.total, 10) : 0,
        firstPortalViewAt: view?.first_viewed_at ?? null,
        lastPortalViewAt: view?.last_viewed_at ?? null,
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
