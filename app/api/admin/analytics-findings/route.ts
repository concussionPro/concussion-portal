import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { ensureFindingsTable } from '@/lib/analytics-findings'
import { sql } from '@/lib/db'

/**
 * GET /api/admin/analytics-findings — the open optimisation work orders.
 *
 * This is the endpoint Claude reads when Zac says "run the analytics pass":
 * each open row is a concrete site change with evidence attached, produced
 * weekly by /api/cron/analytics-review and auto-resolved by the data when
 * the leak closes. ?all=1 includes resolved history.
 */
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await ensureFindingsTable()
  const all = request.nextUrl.searchParams.get('all') === '1'
  const { rows } = all
    ? await sql`SELECT * FROM analytics_findings ORDER BY status ASC, severity ASC, last_seen DESC`
    : await sql`SELECT * FROM analytics_findings WHERE status = 'open' ORDER BY severity ASC, first_seen ASC`
  return NextResponse.json({ findings: rows })
}
