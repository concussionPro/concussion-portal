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
 * Day-of-week filter: the schedule itself already only places sends on
 * Mon–Fri (no weekends) per buildSendSchedule + nextBusinessDay. The cron
 * still runs every day for defensive reasons (catches a Mon catch-up if
 * weekend was a public holiday) — if there's nothing due, the function
 * exits cheaply.
 */
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { processScheduledSends } from '@/lib/prospect/process-scheduled'
import { computeAdaptiveCap } from '@/lib/prospect/adaptive-cap'

export const maxDuration = 60

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

  // Data-driven daily cap. computeAdaptiveCap looks at rolling 30-day
  // complaint + bounce rates and the 7-day cold-send volume. It ramps up
  // on clean weeks and throttles down when complaints spike, so cold
  // outreach can't poison the shared sending identity without
  // self-correcting.
  const capDecision = await computeAdaptiveCap()
  console.log(
    `[prospect cron] adaptive-cap=${capDecision.cap}  ` +
      `complaint_rate=${(capDecision.metrics.complaintRate * 100).toFixed(2)}%  ` +
      `bounce_rate=${(capDecision.metrics.bounceRate * 100).toFixed(2)}%  ` +
      `cold_sends_7d=${capDecision.metrics.coldSends7d}  ` +
      `reason="${capDecision.reason}"`,
  )

  if (capDecision.cap === 0) {
    return NextResponse.json({
      skipped: true,
      reason: 'adaptive-cap=0',
      capDecision,
    })
  }

  // allowPatternGuess: true → cron sends to generic mailboxes (info@,
  // reception@, etc) when no verified direct email is available. Per Zac:
  // "just try info@ or reception@" — accept the slightly higher complaint
  // risk on these because the adaptive cap auto-throttles if domain
  // reputation drops below threshold.
  const result = await processScheduledSends({
    dryRun: false,
    dailyCap: capDecision.cap,
    allowPatternGuess: true,
  })

  console.log(
    `[prospect cron] due=${result.summary.due} sent=${result.summary.sent} ` +
      `byTemplate(initial=${result.summary.byTemplate.initial}, ` +
      `followup=${result.summary.byTemplate.followup}, ` +
      `final=${result.summary.byTemplate.final}) ` +
      `skipped(cap=${result.summary.skippedCap}, supp=${result.summary.skippedSuppressed}, ` +
      `lowConf=${result.summary.skippedLowConfidence}, ` +
      `signoff=${result.summary.skippedSignoffMissing}) ` +
      `failed=${result.summary.sendFailed}`,
  )

  return NextResponse.json({ ...result, capDecision })
}
