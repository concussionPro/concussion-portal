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

  // Production cron: dailyCap from env, default 5 (conservative ramp after
  // the /api/prospect/unsubscribe 404 was fixed — bake at 5/weekday for a
  // week, then raise via env).
  const dailyCap = parseInt(process.env.PROSPECT_CRON_DAILY_CAP ?? '5', 10)
  const result = await processScheduledSends({
    dryRun: false,
    dailyCap,
    allowPatternGuess: false,
  })

  if (result.summary.signoffMissing) {
    console.error('[prospect cron] T1 template not signed off — skipping run')
    return NextResponse.json({ skipped: true, reason: 'signoff-missing' })
  }

  console.log(
    `[prospect cron] due=${result.summary.due} sent=${result.summary.sent} ` +
      `skipped(cap=${result.summary.skippedCap}, supp=${result.summary.skippedSuppressed}, ` +
      `lowConf=${result.summary.skippedLowConfidence}) failed=${result.summary.sendFailed}`,
  )

  return NextResponse.json(result)
}
