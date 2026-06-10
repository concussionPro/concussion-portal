/**
 * GET /api/cron/prospect-verify
 *
 * Dedicated Hunter verification pass — drains the PENDING-APPROVAL backlog
 * (every unverified active prospect, not just those scheduled within 3 days)
 * so the whole researching pool gets parsed by Hunter's algo and becomes
 * auto-promotable. Runs independently of the send cron so verification
 * throughput isn't throttled by the 25/run just-in-time pass.
 *
 * Surfaces credit exhaustion (Hunter "maxing out per day") explicitly in the
 * response + a monitoring alert, instead of silently stalling.
 *
 * Auth: CRON_SECRET bearer (Vercel injects it). Same pattern as the send cron.
 */
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { verifyPendingApprovals } from '@/lib/prospect/hunter-verify'
import { logCriticalError } from '@/lib/monitoring'

export const maxDuration = 300

export async function GET(request: Request) {
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

  // Big batch + budget — this pass exists to actually clear the backlog.
  // ~1.5s per Hunter SMTP check → ~120 lookups fits inside the 240s budget,
  // and we stop early on credit exhaustion.
  const result = await verifyPendingApprovals(120, 240_000)

  console.log(
    `[prospect-verify cron] examined=${result.examined} kept=${result.kept} bounced=${result.bounced} ` +
      `apiErrors=${result.apiErrors} creditExhausted=${result.creditExhausted} remaining=${result.remaining}`,
  )

  // Make a daily max-out VISIBLE instead of a silent stall.
  if (result.creditExhausted) {
    await logCriticalError(new Error('Hunter API maxed out (credit/rate limit)'), {
      examinedThisRun: result.examined,
      remainingUnverified: result.remaining,
      action: 'Top up Hunter credits or wait for the monthly reset — pending approvals stall until then.',
    }).catch((e) => console.error('[prospect-verify cron] alert failed:', e))
  }

  return NextResponse.json({ ok: true, ...result })
}
