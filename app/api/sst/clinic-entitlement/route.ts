import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'
import { getClinicUsage, isExistingPatient, isRegisteredClinic } from '@/lib/sst-trainer/clinic-registry'

/**
 * GET /api/sst/clinic-entitlement?code=X[&patient=<label>]
 *
 * Public (code-only) read of a clinic's trial/usage state, so the patient
 * app can tell a BRAND-NEW patient when a clinic's free trial is full
 * ("ask them to subscribe"). Never exposes the viewKey or any PHI — just
 * plan + patient count + whether a new patient can be admitted.
 *
 * Clinical-safety rule: this gate only ever restricts admitting a NEW
 * patient; a patient already on the clinic's roster is never blocked — the
 * app passes ?patient=<label> and a label the clinic already knows answers
 * canAddPatient=true even when the cap is full (returning patient, new
 * device).
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
  // Existing-patient re-enrol path: when the cap is full, a label already on
  // the clinic's roster is never walled (clinical-safety rule above).
  let canAddPatient = usage.canAddPatient
  const patient = (req.nextUrl.searchParams.get('patient') || '').trim()
  if (!canAddPatient && patient && (await isExistingPatient(code, patient))) {
    canAddPatient = true
  }
  // Code-only callers (patients) get ONLY what the app needs to show a
  // trial-full message — never the clinic's roster size or billing plan (that's
  // business info; disclosing it to every code holder is an unnecessary leak).
  return NextResponse.json({
    cap: usage.cap,
    canAddPatient,
  })
}
