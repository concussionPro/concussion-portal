/**
 * POST /api/admin/partner-seed
 *
 * Creates the `partner_institutions` table (IF NOT EXISTS) and idempotently
 * UPSERTs the SOM seed list (ON CONFLICT (slug) DO NOTHING). Safe to re-run.
 *
 * Isolated to the partnership arm — does not touch the cold-clinic engine.
 * Auth: admin cookie / x-admin-key / Bearer.
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { seedPartners } from '@/lib/partners/repo'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { created, total } = await seedPartners()
    return NextResponse.json({ ok: true, created, total }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Seed failed', detail: message }, { status: 500 })
  }
}
