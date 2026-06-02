/**
 * POST /api/admin/prospect-create
 *
 * Body: CreateClinicInput (see lib/prospect/repo.ts) — validUntil may be
 * passed as an ISO string for convenience.
 *
 * Auth: admin header / cookie.
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { createClinic } from '@/lib/prospect/repo'
import type { CreateClinicInput } from '@/lib/prospect/repo'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let raw: Partial<CreateClinicInput & { validUntil?: string | Date }>
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const required: Array<keyof CreateClinicInput> = [
    'slug', 'accessKey', 'name', 'shortName', 'city', 'state', 'region',
    'contactFirstName', 'contactFullName', 'contactEmail', 'contactDiscipline',
    'clinicWebsiteUrl', 'team', 'travelBand',
  ]
  for (const k of required) {
    if (raw[k] === undefined || raw[k] === null) {
      return NextResponse.json({ error: `Missing field: ${String(k)}` }, { status: 400 })
    }
  }

  const validUntil =
    raw.validUntil instanceof Date ? raw.validUntil :
    typeof raw.validUntil === 'string' ? new Date(raw.validUntil) :
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  try {
    const created = await createClinic({
      slug: raw.slug!,
      accessKey: raw.accessKey!,
      name: raw.name!,
      shortName: raw.shortName!,
      city: raw.city!,
      state: raw.state!,
      region: raw.region!,
      contactFirstName: raw.contactFirstName!,
      contactFullName: raw.contactFullName!,
      contactEmail: raw.contactEmail!,
      contactRole: raw.contactRole,
      contactDiscipline: raw.contactDiscipline!,
      clinicWebsiteUrl: raw.clinicWebsiteUrl!,
      team: raw.team!,
      localTargets: raw.localTargets,
      travelBand: raw.travelBand!,
      cohortRecommendation: raw.cohortRecommendation,
      status: raw.status,
      researchSource: raw.researchSource,
      validUntil,
      notes: raw.notes,
    })
    return NextResponse.json({ ok: true, clinic: created }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Insert failed', detail: message }, { status: 500 })
  }
}
