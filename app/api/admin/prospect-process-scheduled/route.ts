/**
 * POST /api/admin/prospect-process-scheduled
 *
 * Admin manual fire for the cold-outreach send queue. The same core logic
 * is invoked by /api/cron/prospect-process-scheduled (every weekday at
 * 23:30 UTC ≈ 9:30am Sydney via vercel.json crons). Use this endpoint when
 * you want to fire ad-hoc outside the scheduled window.
 *
 * Body: { dryRun?: bool, dailyCap?: number, allowPatternGuess?: bool }
 * Default dryRun=true.
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { processScheduledSends } from '@/lib/prospect/process-scheduled'

const ZAC_INBOX = process.env.ZAC_INBOX ?? 'zac@concussion-education-australia.com'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { dryRun?: boolean; dailyCap?: number; allowPatternGuess?: boolean; force?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false
  const dailyCap = body.dailyCap ?? 15
  const allowPatternGuess = body.allowPatternGuess === true
  const force = body.force === true

  const result = await processScheduledSends({ dryRun, dailyCap, allowPatternGuess, force })

  if (result.summary.signoffMissing) {
    return NextResponse.json(
      { error: 'T1 template not signed off — POST /api/admin/prospect-template-signoff first' },
      { status: 403 },
    )
  }

  return NextResponse.json({
    summary: { ...result.summary, zacInbox: ZAC_INBOX },
    results: result.results,
  })
}
