import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'
import { getClinicUsage, isRegisteredClinic } from '@/lib/sst-trainer/clinic-registry'

/**
 * GET /api/sst/clinic-entitlement?code=X
 *
 * Public (code-only) read of a clinic's trial/usage state, so the patient
 * app can tell a BRAND-NEW patient when a clinic's free trial is full
 * ("ask them to subscribe"). Never exposes the viewKey or any PHI — just
 * plan + patient count + whether a new patient can be admitted.
 *
 * Clinical-safety rule: this gate only ever restricts admitting a NEW
 * patient; a patient already on the clinic's roster is never blocked (the
 * app passes ?existing=1 once it knows the label is known).
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = await rateLimit({ key: `sst-entitlement:${ip}`, limit: 60, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const code = (req.nextUrl.searchParams.get('code') || '').trim().toUpperCase()
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 })
  if (!(await isRegisteredClinic(code))) {
    return NextResponse.json({ error: 'Clinic code not recognised' }, { status: 404 })
  }
  const usage = await getClinicUsage(code)
  return NextResponse.json({
    plan: usage.plan,
    patientCount: usage.patientCount,
    cap: usage.cap,
    canAddPatient: usage.canAddPatient,
  })
}
