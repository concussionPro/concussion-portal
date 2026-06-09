/**
 * POST /api/admin/prospect-fire-now
 *
 * Brings forward N prospects from future scheduled dates to TODAY,
 * then immediately fires the process-scheduled queue. Use to consume
 * unused daily cap headroom during business hours when the cron
 * already fired its morning batch.
 *
 * Body: { count?: number (default 10), dryRun?: bool }
 *
 * Selection rules:
 *  - Prefer clinics with a verified city (not Unknown) — better
 *    personalisation = better open rate
 *  - Prefer status='approved' over 'researching'
 *  - Skip clinics with bad first_name or short_name (data guard)
 *  - Skip clinics already fired (NOT EXISTS outreach_log for next_template_slug)
 *  - Skip clinics on email_suppression
 *
 * After bringing forward: directly invokes processScheduledSends with
 * force=true + allowPatternGuess=true so the cron logic runs unchanged.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'
import { processScheduledSends } from '@/lib/prospect/process-scheduled'
import { computeAdaptiveCap } from '@/lib/prospect/adaptive-cap'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { count?: number; dryRun?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun === true
  const requested = Math.max(1, Math.min(body.count ?? 10, 50))
  // bypassCap removed 2026-06-09: it was used to fire 30 emails to
  // un-verified contacts which burned the cold-7d bounce rate. The
  // adaptive cap exists to protect domain reputation. Bypass = no.
  const bypassCap = false

  // How many fired today already?
  const { rows: todayCount } = await sql<{ n: number }>`
    SELECT COUNT(*)::int AS n
    FROM prospect_outreach_log
    WHERE sent_at::date = CURRENT_DATE
      AND audit_key NOT LIKE '%manual%'
      AND resend_email_id IS NOT NULL
  `
  const firedToday = todayCount[0]?.n ?? 0
  const capDecision = await computeAdaptiveCap()
  const effectiveCap = bypassCap ? requested : capDecision.cap
  const headroom = Math.max(0, effectiveCap - firedToday)
  const bringForward = Math.min(requested, headroom)

  if (bringForward === 0) {
    return NextResponse.json({
      summary: {
        firedToday,
        cap: capDecision.cap,
        headroom,
        bringForward: 0,
        note: 'No headroom remaining today',
      },
    })
  }

  // Pick the best candidates from the future schedule.
  // Priority: verified city + status=approved + earliest scheduled
  const { rows: candidates } = await sql<{ id: number; slug: string; short_name: string; city: string | null; contact_first_name: string | null }>`
    SELECT pc.id, pc.slug, pc.short_name, pc.city, pc.contact_first_name
    FROM prospect_clinics pc
    WHERE pc.next_template_slug = 'initial'  -- T1 only — never accelerate T2/T3
      AND pc.status NOT IN ('archived', 'lost', 'bounced', 'engaged', 'won')
      AND pc.scheduled_send_at IS NOT NULL
      AND pc.scheduled_send_at::date > CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM prospect_outreach_log ol
        WHERE ol.clinic_id = pc.id AND ol.template_slug = pc.next_template_slug
      )
      AND COALESCE(pc.short_name, '') <> ''
      AND COALESCE(pc.short_name, '') !~* 'unknown'
      AND COALESCE(pc.contact_first_name, '') <> ''
      AND COALESCE(pc.contact_first_name, '') !~* '^(director|manager|principal|owner|founder|partner|ceo|md|head|chief|admin|reception|practice|clinic|info|unknown|n/a|na|none|test)\\s*$'
      -- HARD GATE: Hunter-clean only. Same rule as processScheduledSends.
      AND pc.verification_score IS NOT NULL
      AND pc.verification_score >= 80
      AND COALESCE(pc.verification_role, FALSE) = FALSE
      AND COALESCE(pc.verification_accept_all, FALSE) = FALSE
      AND COALESCE(pc.verification_disposable, FALSE) = FALSE
    ORDER BY
      CASE WHEN pc.city IS NOT NULL AND pc.city !~* 'unknown' THEN 0 ELSE 1 END,
      CASE pc.status WHEN 'approved' THEN 0 WHEN 'opened' THEN 1 ELSE 2 END,
      pc.scheduled_send_at ASC,
      pc.priority_wave ASC NULLS LAST
    LIMIT ${bringForward}
  `

  if (candidates.length === 0) {
    return NextResponse.json({
      summary: {
        firedToday, cap: capDecision.cap, headroom, bringForward: 0,
        note: 'No clean candidates available to bring forward',
      },
    })
  }

  if (!dryRun) {
    // Move scheduled_send_at to today UTC midnight for the selected
    const ids = candidates.map((c) => c.id)
    const idsJson = JSON.stringify(ids)
    await sql`
      UPDATE prospect_clinics
      SET scheduled_send_at = DATE_TRUNC('day', NOW()),
          updated_at = NOW()
      WHERE id::text = ANY(SELECT jsonb_array_elements_text(${idsJson}::jsonb))
    `
  }

  // Fire with force=true so today's date filter picks them up
  const result = dryRun
    ? null
    : await processScheduledSends({
        dryRun: false,
        dailyCap: headroom,
        allowPatternGuess: true,
        force: true,
      })

  return NextResponse.json({
    summary: {
      firedToday,
      cap: capDecision.cap,
      headroom,
      broughtForward: candidates.length,
      sentNow: result?.summary.sent ?? 0,
      byTemplate: result?.summary.byTemplate,
    },
    broughtForwardClinics: candidates.map((c) => ({
      shortName: c.short_name,
      city: c.city,
      slug: c.slug,
    })),
    sendResults: result?.results?.slice(0, 50),
  })
}
