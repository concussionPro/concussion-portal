/**
 * Daily Outreach Report Cron — /api/cron/daily-outreach-report
 *
 * Runs at 8am AEST (22:00 UTC prev day) Mon–Fri via Vercel cron.
 *
 * Uses the outreach decision engine (lib/prospect/outreach-decision.ts) to
 * tell Zac, every morning, exactly WHO to personally email today and WHO to
 * leave in the automated T1→T2→T3 nurture sequence — each with plain-English
 * reasoning so he understands the call without opening the dashboard.
 *
 * Auth: Bearer CRON_SECRET (Vercel cron) OR x-admin-key (manual trigger),
 * matching the rest of the prospect crons.
 *
 * Data: per cold prospect with REAL portal engagement in the last 7 days, we
 * build the same engagement signals the admin engagement endpoint does
 * (section_funnel + max dwell + engaged sessions), run decideOutreach, then
 * split into "reach out personally" (direct) vs "continuing in nurture".
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'
import { decideOutreach, type OutreachDecision } from '@/lib/prospect/outreach-decision'
import { hubPackPriceFor, computePricing } from '@/lib/prospect/pricing'
import type { ClinicTeam, TravelBand } from '@/lib/prospect/types'

export const maxDuration = 60

// Bot / scanner user-agents to exclude — same list the engagement route uses.
const BOT_REGEX =
  "(microsoft office|bingpreview|mimecast|barracuda|proofpoint|cloudmark|symantec|sophos|fortinet|trend micro|safelinks|headlesschrome|phantomjs|puppeteer|playwright|googlebot|bingbot|yandex|baidu|crawler|spider|slurp|facebook|linkedin|whatsapp|telegram|skype|wget|curl|python-requests|node-fetch|axios|httpie|go-http-client|java/|okhttp|powershell)"

interface EngagedClinicRow {
  id: number
  slug: string
  short_name: string
  contact_full_name: string | null
  contact_first_name: string | null
  contact_email: string | null
  team: ClinicTeam | null
  travel_band: string | null
  cohort_recommendation: string | null
  section_funnel: Record<string, number>
  max_dwell_ms: number | string | null
  engaged_sessions: number | string | null
}

/**
 * Headline deal value — the SAME offer-matched figure the admin pipeline
 * shows (app/api/admin/prospect-engagement): Hub Pack base for a clinic that
 * gets the Hub Pack offer, on-site cohort total for one that gets on-site.
 *
 * This used to be a hand-rolled SQL CASE with literal 9000 / 1400 / 700 in it,
 * so the morning digest quoted a per-clinic value the dashboard disagreed with
 * and that no longer tracked lib/prospect/pricing.ts at all.
 */
function dealValueFor(row: EngagedClinicRow): number {
  const t = row.team ?? ({} as ClinicTeam)
  const hub = hubPackPriceFor(t)
  if (hub.recommendedOffer !== 'on-site-cohort') return hub.totalBase
  const pricing = computePricing(t, (row.travel_band as TravelBand) ?? 'within-2hr')
  const wanted =
    row.cohort_recommendation === 'essential' ? 'Essential'
    : row.cohort_recommendation === 'full-team' ? 'Full team'
    : 'Recommended'
  const reco = pricing.cohortTiers.find((c) => c.name === wanted) ?? pricing.cohortTiers[0]
  return reco?.total ?? hub.totalBase
}

interface DecidedClinic {
  row: EngagedClinicRow
  decision: OutreachDecision
}

// Auth — Bearer CRON_SECRET OR x-admin-key (manual trigger).
function isAuthorized(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY
  const headerKey = request.headers.get('x-admin-key')
  if (adminKey && headerKey && headerKey.length === adminKey.length) {
    try {
      if (crypto.timingSafeEqual(Buffer.from(headerKey), Buffer.from(adminKey))) return true
    } catch { /* length mismatch already guarded */ }
  }

  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader) {
    const expected = `Bearer ${cronSecret}`
    if (authHeader.length === expected.length) {
      try {
        if (crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) return true
      } catch { /* length mismatch already guarded */ }
    }
  }
  return false
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET && !process.env.ADMIN_API_KEY) {
    console.error('[daily-outreach-report] No CRON_SECRET / ADMIN_API_KEY configured — refusing to run')
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Bootstrap check — schema not applied → nothing to do.
    const { rows: tableCheck } = await sql<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'prospect_clinics'
      ) AS exists
    `
    if (!tableCheck[0]?.exists) {
      console.log('[daily-outreach-report] prospect_clinics not present — skipping')
      return NextResponse.json({ ok: true, skipped: 'schema-not-applied' })
    }

    // Ensure the portal-tracking columns exist (mirrors the engagement route's
    // lazy migration so the aggregation below can't 42703 on a fresh DB).
    try {
      await sql`ALTER TABLE prospect_portal_views ADD COLUMN IF NOT EXISTS interaction_type TEXT NOT NULL DEFAULT 'view'`
      await sql`ALTER TABLE prospect_portal_views ADD COLUMN IF NOT EXISTS target TEXT`
      await sql`ALTER TABLE prospect_portal_views ADD COLUMN IF NOT EXISTS dwell_ms INTEGER`
    } catch (err) {
      console.error('[daily-outreach-report] portal column migration failed:', err)
    }

    // Per-clinic engagement over the LAST 7 DAYS. Bot-filtered. Scope to
    // clinics with REAL engagement: a measured dwell (>0ms, from an exit
    // beacon scanners can't fire) OR a hit on a high-intent section. dealValue
    // is computed inline from the team JSON via the same Hub-Pack-vs-on-site
    // logic the dashboard uses, simplified to a per-clinician headline price.
    const { rows } = await sql<EngagedClinicRow>`
      WITH filtered AS (
        SELECT * FROM prospect_portal_views
        WHERE COALESCE(user_agent, '') !~* ${BOT_REGEX}
          AND viewed_at >= NOW() - INTERVAL '7 days'
      ),
      sec AS (
        SELECT clinic_id, section_visited, COUNT(*)::int AS n
        FROM filtered
        WHERE interaction_type IN ('view', 'section_view')
          AND section_visited IS NOT NULL AND section_visited <> ''
        GROUP BY clinic_id, section_visited
      ),
      agg AS (
        SELECT
          f.clinic_id,
          COALESCE(MAX(CASE WHEN f.interaction_type = 'exit' AND f.dwell_ms IS NOT NULL THEN f.dwell_ms ELSE 0 END), 0)::int AS max_dwell_ms,
          COUNT(*) FILTER (WHERE f.interaction_type = 'exit' AND f.dwell_ms >= 10000)::int AS engaged_sessions
        FROM filtered f
        GROUP BY f.clinic_id
      )
      SELECT
        pc.id,
        pc.slug,
        pc.short_name,
        pc.contact_full_name,
        pc.contact_first_name,
        pc.contact_email,
        agg.max_dwell_ms,
        agg.engaged_sessions,
        COALESCE((SELECT jsonb_object_agg(section_visited, n) FROM sec WHERE clinic_id = pc.id), '{}'::jsonb) AS section_funnel,
        pc.team,
        pc.travel_band,
        pc.cohort_recommendation
      FROM prospect_clinics pc
      JOIN agg ON agg.clinic_id = pc.id
      WHERE pc.status NOT IN ('archived', 'lost', 'bounced', 'won', 'replied', 'engaged-elsewhere')
        AND (
          agg.max_dwell_ms > 0
          OR EXISTS (
            SELECT 1 FROM sec
            WHERE sec.clinic_id = pc.id
              AND sec.section_visited IN ('pricing', 'module-1-trial', 'next-step', 'learning-suite', 'toolkit-pack', 'individual-signup', 'onsite-hero')
          )
        )
        -- Self/admin seed-data exclusion (same as engagement route).
        AND COALESCE(pc.slug, '') NOT ILIKE 'zac-preview%'
        AND COALESCE(pc.short_name, '') NOT ILIKE '%zac%preview%'
        AND COALESCE(LOWER(pc.contact_email), '') NOT IN ('zac@concussion-education-australia.com', 'z.lew87@gmail.com')
        AND COALESCE(LOWER(pc.contact_email), '') NOT LIKE '%@concussion-education-australia.com'
    `

    const engagedCount = rows.length

    // Zero engagement at all this week → don't send a barren email.
    if (engagedCount === 0) {
      console.log('[daily-outreach-report] No portal engagement in the last 7 days — no email sent')
      return NextResponse.json({ ok: true, engaged: 0, direct: 0, nurture: 0, sent: false })
    }

    // Run the decision engine on each clinic.
    const decided: DecidedClinic[] = rows.map((row) => ({
      row,
      decision: decideOutreach({
        sectionFunnel: row.section_funnel ?? {},
        maxDwellMs: Number(row.max_dwell_ms ?? 0),
        sessions: Number(row.engaged_sessions ?? 0) || 1,
      }),
    }))

    const direct = decided
      .filter((d) => d.decision.action === 'direct')
      .sort((a, b) => b.decision.score - a.decision.score)
    const nurture = decided
      .filter((d) => d.decision.action === 'nurture')
      .sort((a, b) => b.decision.score - a.decision.score)

    const subject = direct.length > 0
      ? `CEA — ${direct.length} clinic${direct.length > 1 ? 's' : ''} to personally email today`
      : 'CEA — your outreach actions for today (all in nurture)'

    const sent = await sendEmail({
      to: CONFIG.CONTACT_EMAIL,
      subject,
      html: buildReportEmail(direct, nurture, engagedCount),
      tags: [
        { name: 'type', value: 'daily-outreach-report' },
        { name: 'direct', value: String(direct.length) },
      ],
    })

    if (!sent) {
      console.error('[daily-outreach-report] sendEmail returned false')
      return NextResponse.json({
        ok: false,
        error: 'Report built but email failed to send',
        engaged: engagedCount,
        direct: direct.length,
        nurture: nurture.length,
      }, { status: 500 })
    }

    console.log(`[daily-outreach-report] Sent: ${engagedCount} engaged, ${direct.length} direct, ${nurture.length} nurture`)
    return NextResponse.json({
      ok: true,
      engaged: engagedCount,
      direct: direct.length,
      nurture: nurture.length,
      sent: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[daily-outreach-report] failed:', message)
    return NextResponse.json({ error: 'Report failed', detail: message }, { status: 500 })
  }
}

// ── Email template ──────────────────────────────────

function fmtMoney(v: number | string | null): string {
  const n = Number(v ?? 0)
  if (!n) return ''
  return `$${n.toLocaleString('en-AU')}`
}

function contactName(row: EngagedClinicRow): string {
  return row.contact_full_name || row.contact_first_name || 'the contact'
}

function buildReportEmail(direct: DecidedClinic[], nurture: DecidedClinic[], engagedCount: number): string {
  const dateLine = new Date().toLocaleDateString('en-AU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Australia/Melbourne',
  })

  const summary = `${engagedCount} clinic${engagedCount === 1 ? '' : 's'} engaged this week · ${direct.length} need a personal email · ${nurture.length} continuing in nurture.`

  // ── Direct list — the suggested manual outreach ──
  const directSection = direct.length > 0
    ? direct.map((d) => {
        const r = d.row
        const dv = fmtMoney(dealValueFor(r))
        const mailto = r.contact_email
          ? `<a href="mailto:${escapeHtml(r.contact_email)}?subject=${encodeURIComponent(`Concussion training for ${r.short_name}`)}" style="color: #047857; font-weight: 600; text-decoration: none;">${escapeHtml(r.contact_email)}</a>`
          : '<span style="color:#94a3b8;">no email on file</span>'
        const signals = d.decision.signals.length
          ? d.decision.signals.map((s) => `<span style="display:inline-block; background:#d1fae5; color:#065f46; font-size:11px; font-weight:600; padding:2px 8px; border-radius:999px; margin:2px 4px 2px 0;">${escapeHtml(s)}</span>`).join('')
          : ''
        return `
          <div style="background:#ecfdf5; border-left:4px solid #10b981; border-radius:8px; padding:16px; margin-bottom:14px;">
            <h3 style="margin:0 0 4px; font-size:15px; color:#065f46;">
              ${escapeHtml(r.short_name)}${dv ? ` <span style="font-weight:500; color:#059669;">· ${dv}</span>` : ''}
            </h3>
            <p style="margin:0 0 8px; font-size:13px; color:#334155;">
              ${escapeHtml(contactName(r))} · ${mailto}
            </p>
            <p style="margin:0 0 8px; font-size:13.5px; color:#1e293b;">${escapeHtml(d.decision.reason)}</p>
            ${signals ? `<div style="margin-top:6px;">${signals}</div>` : ''}
          </div>`
      }).join('')
    : `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:14px;">
        <p style="margin:0; font-size:14px; color:#475569;">
          No clinics warrant personal outreach today — all engaged prospects are still early; the sequence has them.
        </p>
      </div>`

  // ── Nurture summary — the "why not just continue" answer ──
  const nurtureTop = nurture.slice(0, 3)
  const nurtureSection = nurture.length > 0
    ? `
      <p style="margin:0 0 10px; font-size:13px; color:#475569;">
        ${nurture.length} engaged clinic${nurture.length === 1 ? ' is' : 's are'} better left in the automated sequence right now${nurtureTop.length ? ` — top ${nurtureTop.length}:` : '.'}
      </p>
      ${nurtureTop.map((d) => `
        <div style="padding:8px 0; border-top:1px solid #e2e8f0;">
          <span style="font-size:13px; font-weight:600; color:#334155;">${escapeHtml(d.row.short_name)}</span>
          <span style="font-size:12.5px; color:#64748b;"> — ${escapeHtml(d.decision.reason)}</span>
        </div>
      `).join('')}
      ${nurture.length > nurtureTop.length ? `<p style="margin:10px 0 0; font-size:12px; color:#94a3b8;">+ ${nurture.length - nurtureTop.length} more continuing in nurture.</p>` : ''}
    `
    : `<p style="margin:0; font-size:13px; color:#94a3b8;">Nothing else engaged this week.</p>`

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">
          CEA — your outreach actions for today
        </h1>
        <p style="font-size: 13px; color: #94a3b8; margin: 4px 0 0;">${dateLine}</p>
      </div>

      <p style="font-size: 14px; color: #334155; text-align:center; margin: 0 0 24px; font-weight:600;">
        ${escapeHtml(summary)}
      </p>

      <h2 style="font-size: 16px; color: #065f46; margin: 24px 0 12px;">
        &#128293; Reach out personally (${direct.length})
      </h2>
      ${directSection}

      <h2 style="font-size: 16px; color: #475569; margin: 28px 0 12px;">
        Nurturing (${nurture.length}) — no action needed
      </h2>
      ${nurtureSection}

      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        Decision engine · lib/prospect/outreach-decision · ConcussionPro portal
      </div>
    </div>
  `
}
