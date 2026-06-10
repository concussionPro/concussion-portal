/**
 * GET /api/cron/prospect-process-scheduled
 *
 * Vercel cron entry. Runs every weekday morning Sydney time. Bypasses
 * admin auth (it's on /api/cron/*, not /api/admin/*) and authenticates via
 * the CRON_SECRET bearer header that Vercel injects automatically.
 *
 * Why this exists separately from the admin POST: before this, NOTHING was
 * automatically firing the cold-outreach send queue — the schedule existed
 * in prospect_clinics but only manual POSTs to the admin route triggered
 * delivery. Result: scheduled clinics piled up indefinitely.
 *
 * Day-of-week filter: the schedule places sends Mon-Sat (Sunday only is
 * skipped) per addBusinessDays. Cron fires Mon-Sat at 00:01 UTC, which
 * lands at:
 *   Mon-Fri ~10/11am Melbourne (winter/summer)
 *   Sat     ~10/11am Melbourne — within Zac's 8am-1pm Sat window
 * If nothing's due, the function exits cheaply.
 */
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { processScheduledSends, computeGateBlockedBreakdown } from '@/lib/prospect/process-scheduled'
import { computeAdaptiveCap } from '@/lib/prospect/adaptive-cap'
import { autoVerifyDueProspects } from '@/lib/prospect/hunter-verify'

export const maxDuration = 300

export async function GET(request: Request) {
  // Guard: only run on the primary project (custom domain) — prevents
  // duplicate runs if the deployment was forked into a second project.
  const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
  if (prodUrl && !prodUrl.includes('concussion-education-australia.com')) {
    return NextResponse.json({ skipped: true, reason: 'Not primary project' })
  }

  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET not configured — refusing to run')
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (
    !authHeader ||
    authHeader.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Auto-verify pass: prospects that are due/approaching but have never
  // been Hunter-verified (verification_score IS NULL) can NEVER pass the
  // HARD GATE — without this they strand silently. Capped at 25 lookups
  // per run to control Hunter credits; never throws.
  const autoVerify = await autoVerifyDueProspects(25)
  console.log(
    `[prospect cron] auto-verify examined=${autoVerify.examined} kept=${autoVerify.kept} ` +
      `bounced=${autoVerify.bounced} apiErrors=${autoVerify.apiErrors}` +
      (autoVerify.skipped ? ` skipped="${autoVerify.skipped}"` : ''),
  )

  // Data-driven daily cap. computeAdaptiveCap looks at rolling 30-day
  // complaint + bounce rates and the 7-day cold-send volume. It ramps up
  // on clean weeks and throttles down when complaints spike, so cold
  // outreach can't poison the shared sending identity without
  // self-correcting.
  const capDecision = await computeAdaptiveCap()
  console.log(
    `[prospect cron] adaptive-cap=${capDecision.cap}  ` +
      `30d_total_complaint=${(capDecision.metrics.totalComplaintRate30d * 100).toFixed(2)}%  ` +
      `30d_total_bounce=${(capDecision.metrics.totalBounceRate30d * 100).toFixed(2)}%  ` +
      `7d_cold_sends=${capDecision.metrics.coldSends7d}  ` +
      `7d_cold_complaint=${(capDecision.metrics.coldComplaintRate7d * 100).toFixed(2)}%  ` +
      `7d_cold_bounce=${(capDecision.metrics.coldBounceRate7d * 100).toFixed(2)}%  ` +
      `reason="${capDecision.reason}"`,
  )

  // Auto-promote (Zac 2026-06-10: "why am I manually approving? this is
  // what the engine is built for"). Hunter verification + per-send preflight
  // ARE the quality gate — researching prospects that are Hunter-clean and
  // have never been sent get promoted straight into the schedule. Marking
  // them due NOW is deliberate: the adaptive cap meters volume and the
  // size-tier ORDER BY decides sequence, so the backlog drains largest-
  // clinics-first at whatever rate reputation allows.
  const promoted = await sql`
    UPDATE prospect_clinics pc
    SET status = 'approved',
        scheduled_send_at = COALESCE(pc.scheduled_send_at, NOW()),
        next_template_slug = COALESCE(pc.next_template_slug, 'initial'),
        updated_at = NOW()
    WHERE pc.status = 'researching'
      AND pc.verification_score IS NOT NULL
      AND pc.verification_score >= 80
      AND COALESCE(pc.verification_role, FALSE) = FALSE
      AND COALESCE(pc.verification_accept_all, FALSE) = FALSE
      AND COALESCE(pc.verification_disposable, FALSE) = FALSE
      AND NOT EXISTS (
        SELECT 1 FROM prospect_outreach_log ol
        WHERE ol.clinic_id = pc.id AND ol.audit_key NOT LIKE '%:test:%'
      )
  `
  console.log(`[prospect cron] auto-promoted ${promoted.rowCount ?? 0} hunter-clean researching prospects into the schedule`)

  // Hunter HARD-GATE visibility: how many otherwise-due prospects are
  // currently stranded by the gate, and why. Read-only.
  const gateBlocked = await computeGateBlockedBreakdown()

  if (capDecision.cap === 0) {
    return NextResponse.json({
      skipped: true,
      reason: 'adaptive-cap=0',
      capDecision,
      autoVerify,
      gateBlocked,
    })
  }

  // New-creative safety ceiling (Zac 2026-06-11): the portal-led templates are
  // brand-new and unproven. Hold cold volume at 30/day regardless of the
  // adaptive ramp until their bounce/complaint profile is validated, then
  // raise COLD_SEND_DAILY_MAX to let the adaptive cap take over again. Sends
  // are also staggered 7-10 min apart inside processScheduledSends so 30/day
  // is delivered as a human cadence, never a burst.
  const COLD_SEND_DAILY_MAX = parseInt(process.env.COLD_SEND_DAILY_MAX || '30', 10) || 30
  const effectiveCap = Math.min(capDecision.cap, COLD_SEND_DAILY_MAX)
  console.log(
    `[prospect cron] adaptive-cap=${capDecision.cap} · new-creative ceiling=${COLD_SEND_DAILY_MAX} · effective=${effectiveCap}`,
  )

  // allowPatternGuess stays false: the SQL HARD GATE (Hunter score>=80,
  // non-role, non-accept-all, non-disposable) means a role mailbox can
  // never reach the per-row checks anyway — passing true here was dead,
  // misleading plumbing.
  const result = await processScheduledSends({
    dryRun: false,
    dailyCap: effectiveCap,
    allowPatternGuess: false,
  })

  console.log(
    `[prospect cron] due=${result.summary.due} sent=${result.summary.sent} ` +
      `byTemplate(initial=${result.summary.byTemplate.initial}, ` +
      `followup=${result.summary.byTemplate.followup}, ` +
      `final=${result.summary.byTemplate.final}) ` +
      `skipped(cap=${result.summary.skippedCap}, supp=${result.summary.skippedSuppressed}, ` +
      `lowConf=${result.summary.skippedLowConfidence}, ` +
      `signoff=${result.summary.skippedSignoffMissing}) ` +
      `failed=${result.summary.sendFailed} ` +
      `gateBlocked(total=${gateBlocked.total}, unverified=${gateBlocked.unverified}, ` +
      `lowScore=${gateBlocked.lowScore}, acceptAll=${gateBlocked.acceptAll}, ` +
      `role=${gateBlocked.role}, disposable=${gateBlocked.disposable})`,
  )

  return NextResponse.json({ ...result, capDecision, autoVerify, gateBlocked })
}
