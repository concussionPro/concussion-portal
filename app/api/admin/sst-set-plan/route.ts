import { NextRequest, NextResponse } from 'next/server'
import { isAdminHeaderRequest } from '@/lib/require-admin'
import { setSstClinicPlan, getClinicUsage, getClinic } from '@/lib/sst-trainer/clinic-registry'

/**
 * POST /api/admin/sst-set-plan  { code, plan?, tier? }
 *
 * Set ONE clinic's plan. Exists because the plan is read from KV first and only
 * falls back to Postgres when the KV record is missing or is active-without-a-tier
 * (getClinicUsage) — so a direct SQL update does NOT lift a clinic that KV still
 * says is on trial. `setSstClinicPlan` writes both, which is the only correct way.
 *
 * Why it was needed (2026-10-06): Zac's own clinic LSDQXR sat on `trial` — a
 * 3-patient LIFETIME cap, two already spent on test labels — hours before he ran
 * SST on real patients. The third patient would have 402'd mid-session.
 *
 * `tier` omitted on an active plan means UNLIMITED (see TIER_MONTHLY_PATIENT_CAP),
 * which is what a comped or owner clinic should be.
 *
 * Header auth only (isAdminHeaderRequest), never the cookie: this mutates
 * billing state, and the admin cookie is sameSite:'lax'.
 */
export async function POST(request: NextRequest) {
  if (!isAdminHeaderRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { code?: unknown; plan?: unknown; tier?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
  if (!/^[A-Z0-9]{4,12}$/.test(code)) {
    return NextResponse.json({ error: 'code required' }, { status: 400 })
  }
  const plan = body.plan === 'trial' ? 'trial' : 'active'
  const tier = typeof body.tier === 'string' && body.tier.trim() ? body.tier.trim() : undefined

  const before = await getClinicUsage(code)
  if (!(await getClinic(code))) {
    return NextResponse.json({ error: `no clinic ${code}` }, { status: 404 })
  }

  // tier undefined on an active plan = unlimited; no includedMonths, so no
  // renewal clock is stamped on a comped clinic.
  await setSstClinicPlan(code, plan, tier ? { tier } : undefined)

  const after = await getClinicUsage(code)
  console.log(`[admin] sst-set-plan ${code}: ${before.plan}/${before.cap ?? 'unlimited'} -> ${after.plan}/${after.cap ?? 'unlimited'}`)
  return NextResponse.json({
    success: true,
    code,
    before: { plan: before.plan, cap: before.cap, patientCount: before.patientCount, canAddPatient: before.canAddPatient },
    after: { plan: after.plan, cap: after.cap, patientCount: after.patientCount, canAddPatient: after.canAddPatient },
  })
}
