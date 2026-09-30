import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { backfillAcquisition, acquisitionByRevenue, unattributedBuyers } from '@/lib/acquisition'

/**
 * Recover customer origins already stamped on purchase_complete events but
 * never promoted to the user row. Idempotent — only fills rows still null,
 * and recordAcquisition is write-once, so re-running cannot rewrite history.
 *
 * GET reports the current state without changing anything.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const [state, byRevenue] = await Promise.all([unattributedBuyers(), acquisitionByRevenue()])
  return NextResponse.json({ ...state, byRevenue })
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await backfillAcquisition()
  const [state, byRevenue] = await Promise.all([unattributedBuyers(), acquisitionByRevenue()])
  return NextResponse.json({ ...result, ...state, byRevenue })
}
