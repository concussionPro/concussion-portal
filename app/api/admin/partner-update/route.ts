/**
 * PATCH /api/admin/partner-update
 *
 * Body: { id: number, status?, contactName?, contactEmail?, contactRole? }
 * Updates mutable fields on one institution. Only provided fields change.
 * Isolated to the partnership arm — no email, no clinic-engine side effects.
 * Auth: admin cookie / x-admin-key / Bearer.
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { updatePartner } from '@/lib/partners/repo'
import type { PartnerStatus } from '@/lib/partners/helpers'

const VALID_STATUS: PartnerStatus[] = ['lead', 'contacted', 'active', 'declined']

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let raw: {
    id?: number
    status?: string
    contactName?: string | null
    contactEmail?: string | null
    contactRole?: string | null
  }
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof raw.id !== 'number') {
    return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 })
  }
  if (raw.status !== undefined && !VALID_STATUS.includes(raw.status as PartnerStatus)) {
    return NextResponse.json({ error: `Invalid status: ${raw.status}` }, { status: 400 })
  }

  try {
    const updated = await updatePartner(raw.id, {
      status: raw.status as PartnerStatus | undefined,
      contactName: raw.contactName,
      contactEmail: raw.contactEmail,
      contactRole: raw.contactRole,
    })
    if (!updated) {
      return NextResponse.json({ error: `Not found: ${raw.id}` }, { status: 404 })
    }
    return NextResponse.json({ ok: true, partner: updated }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Update failed', detail: message }, { status: 500 })
  }
}
