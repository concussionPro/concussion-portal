/**
 * GET /api/admin/prospect-cap-decision
 *
 * Returns the adaptive daily cap the cron WOULD use right now, plus the
 * metrics that drove the decision. Use to audit ramp behaviour without
 * waiting for the cron to log.
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { computeAdaptiveCap } from '@/lib/prospect/adaptive-cap'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const decision = await computeAdaptiveCap()
  return NextResponse.json(decision)
}
