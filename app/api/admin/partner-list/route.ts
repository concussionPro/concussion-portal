/**
 * GET /api/admin/partner-list
 *
 * Returns every partner_institutions row (tier ASC, name ASC) for the
 * admin Partnerships manager. Read-only; isolated to the partnership arm.
 * Auth: admin cookie / x-admin-key / Bearer.
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { listPartners } from '@/lib/partners/repo'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const partners = await listPartners()
    return NextResponse.json({ ok: true, partners }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'List failed', detail: message }, { status: 500 })
  }
}
