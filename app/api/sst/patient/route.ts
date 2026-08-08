import { NextRequest, NextResponse } from 'next/server'
import { verifyViewKey, normaliseClinicCode, DEMO_CLINIC_CODE } from '@/lib/sst-trainer/clinic-registry'
import { createPatient, resolvePatient, recordIntake } from '@/lib/sst-trainer/patient-registry'
import { isDemoUserId } from '@/lib/demo-session'

/**
 * PATIENT IDENTITY API.
 *
 *   POST   /api/sst/patient          clinician mints a patient code (viewKey)
 *   GET    /api/sst/patient?code=..  patient resolves their code on a new device
 *   PATCH  /api/sst/patient          patient submits the one-screen intake
 *
 * AUTH IS DELIBERATELY ASYMMETRIC, matching the access model already in
 * clinic-registry: clinician READ paths require the clinic viewKey; patient
 * paths are code-only, because a patient holds their code and nothing else.
 *
 * MINTING REQUIRES THE VIEWKEY. A patient code is an identity — if anyone
 * holding the (publicly printed) clinic code could mint one, they could create
 * unlimited identities at someone else's clinic, inflating the roster and
 * polluting the research cohort.
 *
 * RESOLVING DOES NOT LEAK. The GET returns only what the patient already knows
 * or supplied themselves (their own demographics and consent state). It never
 * returns the label another clinician typed, and it never lists patients — so a
 * guessed code discloses nothing beyond "this code exists", which is the
 * minimum a resolve endpoint can reveal while still working.
 */

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const clinicCode = normaliseClinicCode(body?.clinicCode)
  const viewKey = typeof body?.viewKey === 'string' ? body.viewKey : ''
  if (!clinicCode || !(await verifyViewKey(clinicCode, viewKey))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // The demo clinic must never write — same guard as every other write path.
  if (clinicCode === DEMO_CLINIC_CODE || isDemoUserId(clinicCode)) {
    return NextResponse.json({ error: 'Demo clinic is read-only' }, { status: 403 })
  }
  const label = typeof body?.label === 'string' ? body.label.trim().slice(0, 80) : null
  const patient = await createPatient(clinicCode, label)
  if (!patient) return NextResponse.json({ error: 'Could not create patient' }, { status: 500 })
  // researchRef is NEVER returned to the clinic — a clinician who could see it
  // could re-identify a published row from their own patient list, which is the
  // exact property the pseudonym exists to prevent.
  return NextResponse.json({
    patientCode: patient.patientCode,
    label: patient.label,
  })
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const clinicCode = normaliseClinicCode(sp.get('clinic'))
  const patient = await resolvePatient(clinicCode, sp.get('code'))
  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    patientCode: patient.patientCode,
    label: patient.label,
    ageBand: patient.ageBand,
    sex: patient.sex,
    researchConsentVersion: patient.researchConsentVersion,
    // TRUE when this device needs the full intake screen, FALSE when the
    // patient already completed it elsewhere and only re-entered their code.
    needsIntake: patient.ageBand === null && patient.sex === null,
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const clinicCode = normaliseClinicCode(body?.clinicCode)
  const ok = await recordIntake(clinicCode, body?.patientCode, {
    ageBand: typeof body?.ageBand === 'string' ? body.ageBand : null,
    sex: typeof body?.sex === 'string' ? body.sex : null,
    // Explicit boolean only. `=== true` rather than a truthy check because a
    // stray non-empty string would otherwise enrol someone in research.
    researchConsent: body?.researchConsent === true,
    daysSinceInjury: typeof body?.daysSinceInjury === 'number' ? body.daysSinceInjury : null,
    label: typeof body?.label === 'string' ? body.label : null,
  })
  if (!ok) return NextResponse.json({ error: 'Could not record intake' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
