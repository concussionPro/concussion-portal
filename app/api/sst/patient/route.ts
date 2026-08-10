import { NextRequest, NextResponse } from 'next/server'
import { verifyViewKey, normaliseClinicCode, DEMO_CLINIC_CODE } from '@/lib/sst-trainer/clinic-registry'
import { createPatient, resolvePatient, recordIntake, closeEpisode, enrolSite } from '@/lib/sst-trainer/patient-registry'
import { isDemoUserId } from '@/lib/demo-session'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'

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
  const supplied = sp.get('code')

  /**
   * RATE LIMITED, TWO WAYS. A patient code is a six-character bearer credential
   * over a 28-character alphabet — ~4.8e8 combinations, which is enumerable in
   * hours against an unthrottled endpoint. Combined with a clinic code that is
   * printed on a QR card, an unlimited resolve endpoint would be a disclosure
   * of health-adjacent personal information under APP 11, and a direct fail on
   * the PracSuite security questionnaire.
   *
   * Per-CLINIC limits the damage of a single target; per-IP limits a broad
   * sweep. Both are needed: per-IP alone is defeated by rotating addresses,
   * per-clinic alone lets one address grind every clinic in parallel.
   */
  const ip = getClientIp(request) || 'unknown'
  const [byClinic, byIp] = await Promise.all([
    rateLimit({ key: `sst-patient-resolve:c:${clinicCode}`, limit: 20, windowSec: 600 }),
    rateLimit({ key: `sst-patient-resolve:i:${ip}`, limit: 40, windowSec: 600 }),
  ])
  if (!byClinic.ok || !byIp.ok) {
    console.warn(`[sst-patient] resolve throttled — clinic ${clinicCode || '?'} ip ${ip}`)
    return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 })
  }

  const patient = await resolvePatient(clinicCode, supplied)
  if (!patient) {
    // Logged so a sweep is visible in the runtime logs rather than silent.
    console.warn(`[sst-patient] resolve MISS — clinic ${clinicCode || '?'} ip ${ip}`)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  /**
   * DELIBERATELY RETURNS NO PERSONAL DATA.
   *
   * `label` is a NAME the clinician typed and was returned here in the first
   * cut — that made a guessed code disclose an identity, which is precisely the
   * thing the pseudonymous design exists to prevent. The patient already knows
   * who they are; the app does not need to be told.
   *
   * What is returned is only what the PATIENT THEMSELVES supplied (their own
   * age band, sex and consent state) so a second device can skip re-entry, plus
   * whether the intake screen is still needed. A guessed code therefore
   * discloses "this code exists" and nothing more.
   */
  return NextResponse.json({
    patientCode: patient.patientCode,
    ageBand: patient.ageBand,
    sex: patient.sex,
    researchConsentVersion: patient.researchConsentVersion,
    needsIntake: patient.ageBand === null && patient.sex === null,
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const clinicCode = normaliseClinicCode(body?.clinicCode)
  // The demo clinic must never write — same guard as POST/PUT above. PATCH
  // shipped 2026-08-09 without it; caught in the 08-11 demo sweep.
  if (clinicCode === DEMO_CLINIC_CODE || isDemoUserId(clinicCode)) {
    return NextResponse.json({ error: 'Demo clinic is read-only' }, { status: 403 })
  }
  const ok = await recordIntake(clinicCode, body?.patientCode, {
    ageBand: typeof body?.ageBand === 'string' ? body.ageBand : null,
    sex: typeof body?.sex === 'string' ? body.sex : null,
    // Explicit boolean only. `=== true` rather than a truthy check because a
    // stray non-empty string would otherwise enrol someone in research.
    researchConsent: body?.researchConsent === true,
    daysSinceInjury: typeof body?.daysSinceInjury === 'number' ? body.daysSinceInjury : null,
    baselineSymptomScore: typeof body?.baselineSymptomScore === 'number' ? body.baselineSymptomScore : null,
    dischargeSymptomScore: typeof body?.dischargeSymptomScore === 'number' ? body.dischargeSymptomScore : null,
    label: typeof body?.label === 'string' ? body.label : null,
  })
  if (!ok) return NextResponse.json({ error: 'Could not record intake' }, { status: 400 })
  return NextResponse.json({ ok: true })
}


/**
 * PUT /api/sst/patient — clinician closes an episode, or enrols the site.
 *
 * Both are clinician actions and both require the clinic viewKey. Episode
 * closure is what gives a threshold trajectory a terminus; without it there is
 * no prognostic analysis, only description.
 */
export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const clinicCode = normaliseClinicCode(body?.clinicCode)
  const viewKey = typeof body?.viewKey === 'string' ? body.viewKey : ''
  if (!clinicCode || !(await verifyViewKey(clinicCode, viewKey))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (clinicCode === DEMO_CLINIC_CODE || isDemoUserId(clinicCode)) {
    return NextResponse.json({ error: 'Demo clinic is read-only' }, { status: 403 })
  }

  if (body?.action === 'enrol-site') {
    const siteRef = await enrolSite(clinicCode, {
      siteName: typeof body?.siteName === 'string' ? body.siteName : null,
      approvalReference: typeof body?.approvalReference === 'string' ? body.approvalReference : null,
    })
    if (!siteRef) return NextResponse.json({ error: 'Could not enrol site' }, { status: 500 })
    // siteRef is NOT returned — it is an analysis-side pseudonym and showing it
    // to the clinic would let a site re-identify its own rows in a published
    // dataset, which is the property it exists to prevent.
    return NextResponse.json({ ok: true })
  }

  const ok = await closeEpisode(clinicCode, body?.patientCode, String(body?.outcome ?? ''), {
    daysInjuryToReturn: typeof body?.daysInjuryToReturn === 'number' ? body.daysInjuryToReturn : null,
    dischargeSymptomScore: typeof body?.dischargeSymptomScore === 'number' ? body.dischargeSymptomScore : null,
  })
  if (!ok) return NextResponse.json({ error: 'Could not close episode' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
