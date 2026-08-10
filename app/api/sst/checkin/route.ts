import { NextRequest, NextResponse } from 'next/server'
import { normaliseClinicCode, DEMO_CLINIC_CODE } from '@/lib/sst-trainer/clinic-registry'
import { recordDailyCheckin } from '@/lib/sst-trainer/patient-registry'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'
import { isDemoUserId } from '@/lib/demo-session'

/**
 * DAILY CHECK-IN — POST /api/sst/checkin
 *
 * One symptom answer per patient per day, whether or not they trained. This is
 * the rest-day comparator: without the flare rate on days with no exertion, a
 * next-day flare after a session is uninterpretable, because concussion
 * symptoms fluctuate on their own.
 *
 * THIS DOES NOT CHANGE THE PRESCRIPTION. Non-training days already occur —
 * missed sessions, interlock pauses, clinician de-loads. They were simply
 * invisible because every symptom datum hung off a session record.
 *
 * Writes to sst_daily_checkins, never to sst_clinic_sessions: a check-in is not
 * a delivered session and must never reach the billing meter, the report's
 * "sessions delivered" row, or the adherence calculation.
 *
 * Patient-authenticated by clinic code + patient code, the same pair the app
 * already holds. Rate limited because it is an unauthenticated-by-password
 * write path.
 */

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request) || 'unknown'
  const limited = await rateLimit({ key: `sst-checkin:${ip}`, limit: 60, windowSec: 600 })
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await request.json().catch(() => ({}))
  const clinicCode = normaliseClinicCode(body?.clinicCode)
  if (!clinicCode) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  // The demo clinic must never write — same guard as every other write path.
  // (This route shipped 2026-08-09 without it; caught in the 08-11 demo sweep.)
  if (clinicCode === DEMO_CLINIC_CODE || isDemoUserId(clinicCode)) {
    return NextResponse.json({ error: 'Demo clinic is read-only' }, { status: 403 })
  }

  const ok = await recordDailyCheckin({
    clinicCode,
    patientCode: body?.patientCode,
    onDate: String(body?.onDate ?? ''),
    symptomScore: body?.symptomScore,
    // `trained` is asserted by the client from its own session log for that
    // date. It is NOT inferred server-side from whether a session row exists:
    // a session that failed to sync would otherwise silently reclassify a
    // training day as a rest day, which is the one misclassification that
    // directly corrupts the comparator.
    trained: body?.trained === true,
    missedReason: body?.missedReason,
    daysSinceInjury: typeof body?.daysSinceInjury === 'number' ? body.daysSinceInjury : null,
  })

  if (!ok) return NextResponse.json({ error: 'Could not record check-in' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
