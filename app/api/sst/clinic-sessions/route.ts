import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { getClinic, isRegisteredClinic, verifyViewKey } from '@/lib/sst-trainer/clinic-registry'

/**
 * GET /api/sst/clinic-sessions?code=CEA-1234&k=<viewKey>
 *
 * The clinician read-side of the SST data flow. Returns a clinic's sessions
 * grouped into patients (by patient_label) with each patient's HRt trajectory
 * and the CLEARANCE SIGNAL — a threshold re-test that returned 'no-intolerance'
 * means the patient can exercise to exhaustion without provoking symptoms
 * (recovered exercise tolerance) and is ready for the clinician's clearance
 * review. The Clinical Hub reads this. Read-only.
 *
 * AUTH (APP 11): patients HOLD the clinic code (it's printed on the QR card),
 * so the code alone must never read the roster. Every non-DEMO00 code also
 * requires the clinic's private viewKey via `&k=` (minted at provisioning,
 * delivered in the welcome email / admin). DEMO00 stays keyless — demo data.
 */
type Row = {
  patient_label: string | null
  /** install UUID from the patient app (payload.patientRef) — the stable
   *  per-device identity. Null only for builds that predate the field. */
  patient_ref: string | null
  session_type: string
  hrt_bpm: number | null
  band_low: number | null
  band_high: number | null
  condition: string | null
  payload: Record<string, unknown> | null
  created_at: string
}

/** Curated demo dataset for DEMO00 — three believable patients at different
 *  episode stages. Days are relative so the demo always looks current. */
function demoFixtureRows(): Row[] {
  const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString()
  const mk = (
    ref: string, label: string, type: 'threshold' | 'training', daysAgo: number,
    hrt: number | null, low: number | null, high: number | null,
    extra: Record<string, unknown> = {},
  ): Row => ({
    patient_label: label,
    patient_ref: ref,
    session_type: type,
    hrt_bpm: hrt,
    band_low: low,
    band_high: high,
    condition: 'concussion',
    payload: { patientRef: ref, hrVerified: true, hrSource: 'bluetooth', ...extra },
    created_at: day(daysAgo),
  } as unknown as Row)
  return [
    // Alex — mid-episode, progressing cleanly
    mk('demo-alex', 'Alex D', 'threshold', 12, 142, 114, 128, { interpretation: 'exercise-intolerance', terminationReason: 'symptom' }),
    mk('demo-alex', 'Alex D', 'training', 10, null, 114, 128, { minutesInBand: 19 }),
    mk('demo-alex', 'Alex D', 'training', 8, null, 114, 128, { minutesInBand: 20 }),
    mk('demo-alex', 'Alex D', 'training', 6, null, 118, 132, { minutesInBand: 20 }),
    mk('demo-alex', 'Alex D', 'threshold', 3, 156, 125, 140, { interpretation: 'exercise-intolerance', terminationReason: 'symptom' }),
    mk('demo-alex', 'Alex D', 'training', 1, null, 125, 140, { minutesInBand: 20 }),
    // Sam — fresh episode, first test done
    mk('demo-sam', 'Sam K', 'threshold', 2, 131, 105, 118, { interpretation: 'exercise-intolerance', terminationReason: 'symptom' }),
    mk('demo-sam', 'Sam K', 'training', 1, null, 105, 118, { minutesInBand: 17 }),
    // Jordan — late episode, near clearance
    mk('demo-jordan', 'Jordan P', 'threshold', 20, 138, 110, 124, { interpretation: 'exercise-intolerance', terminationReason: 'symptom' }),
    mk('demo-jordan', 'Jordan P', 'training', 17, null, 110, 124, { minutesInBand: 20 }),
    mk('demo-jordan', 'Jordan P', 'training', 14, null, 116, 130, { minutesInBand: 20 }),
    mk('demo-jordan', 'Jordan P', 'threshold', 9, 171, 137, 154, { interpretation: 'no-intolerance', terminationReason: 'exhaustion' }),
    mk('demo-jordan', 'Jordan P', 'training', 5, null, 137, 154, { minutesInBand: 20 }),
  ]
}

/** EVENT rows (payload.eventType 'test-aborted' / 'red-flag-cleared') are
 *  audit events, not graded tests: the write side forces interpretation
 *  'invalid' and nulls hrt_bpm/bands. They must stay in the trajectory (the
 *  hub's escalation ladder reads them to raise/downgrade attention) but must
 *  never be selected as the patient's LATEST test — a red-flag clearance would
 *  otherwise wipe the current HRt/band and demote the patient to "test
 *  pending". A legitimately invalid TEST (not enough data, no eventType or a
 *  threshold-* eventType) stays eligible — that IS the test-pending state. */
function isThresholdEventRow(r: Row): boolean {
  const e = typeof r.payload?.eventType === 'string' ? r.payload.eventType.toLowerCase() : ''
  return e === 'test-aborted' || e === 'red-flag-cleared'
}

export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get('code') || '').trim().toUpperCase()
  if (!code || code.length < 3) {
    return NextResponse.json({ error: 'clinic code required' }, { status: 400 })
  }
  const rl = await rateLimit({ key: `sst-sessions-read:${code}`, limit: 60, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  // Only registered clinic codes (KV `clinic:{code}`, same registry as the
  // write side) can read — an arbitrary code string must not enumerate
  // patient labels/HR data. DEMO00 serves the demo dataset only.
  if (!(await isRegisteredClinic(code))) {
    return NextResponse.json({ error: 'Clinic code not recognised' }, { status: 404 })
  }
  // Clinician read key — the patient-held code alone must not read the roster.
  const viewKey = request.nextUrl.searchParams.get('k')
  if (!(await verifyViewKey(code, viewKey))) {
    return NextResponse.json({ error: 'Clinician key required' }, { status: 401 })
  }
  try {
    // DEMO00: curated fixture, never the DB (2026-08-04 audit B2 — real rows
    // here meant one anonymous POST could deface every prospect's demo).
    const rows: Row[] = code === 'DEMO00' ? demoFixtureRows() : (await sql<Row>`
      SELECT patient_label, payload->>'patientRef' AS patient_ref,
             session_type, hrt_bpm, band_low, band_high, condition, payload, created_at
      FROM sst_clinic_sessions
      WHERE upper(clinic_code) = ${code}
      ORDER BY created_at ASC
    `).rows
    // IDENTITY: group by the install UUID (patientRef) — NOT the display name.
    // Grouping on patient_label alone merged two same-named patients at one
    // clinic into a single chart (one HRt trajectory, one session list, one
    // clearance signal) and collapsed every unnamed device into a shared
    // "Unidentified" patient. patientRef is the same stable per-device identity
    // /api/sst/live already keys on. Falls back to the label for pre-patientRef
    // rows so legacy history still groups the way it always did.
    const byPatient = new Map<string, { label: string; thresholds: Row[]; trainings: Row[] }>()
    for (const r of rows) {
      const label = (r.patient_label || '').trim() || 'Unidentified'
      const key = (r.patient_ref || '').trim() || `label:${label}`
      if (!byPatient.has(key)) byPatient.set(key, { label, thresholds: [], trainings: [] })
      const p = byPatient.get(key)!
      // Keep the most recent non-placeholder label for this device.
      if (label !== 'Unidentified') p.label = label
      if (r.session_type === 'threshold') p.thresholds.push(r)
      else p.trainings.push(r)
    }

    // Two DISTINCT patients can legitimately share a display name. Now that they
    // no longer merge, disambiguate them for the clinician instead of showing two
    // identical rows ("James M" / "James M (2)").
    const labelCounts = new Map<string, number>()
    for (const p of byPatient.values()) {
      labelCounts.set(p.label, (labelCounts.get(p.label) ?? 0) + 1)
    }
    const labelSeen = new Map<string, number>()

    const patients = [...byPatient.values()].map((p) => {
      let name = p.label
      if ((labelCounts.get(p.label) ?? 0) > 1) {
        const n = (labelSeen.get(p.label) ?? 0) + 1
        labelSeen.set(p.label, n)
        if (n > 1) name = `${p.label} (${n})`
      }
      // "Latest" = the last REAL graded test — event rows are excluded (above).
      const realTests = p.thresholds.filter((t) => !isThresholdEventRow(t))
      const latest = realTests[realTests.length - 1]
      const interp = (latest?.payload?.interpretation as string | undefined) ?? null
      return {
        name,
        condition: latest?.condition ?? null,
        hrt: latest?.hrt_bpm ?? null,
        bandLow: latest?.band_low ?? null,
        bandHigh: latest?.band_high ?? null,
        // serial MEASURED HRt = the recovery-trajectory instrument. Each point
        // carries provenance (source tier + verified) so the curve is
        // self-documenting. `verified` is derived server-side: a session whose
        // HR source is manual entry can NEVER plot as verified, regardless of
        // what the client claimed (integrity-not-accuracy line). `gated`
        // means clinic-code lane (registered code enforced above) — it is not
        // yet a per-session clinician-authorisation record.
        hrtTrajectory: p.thresholds.map((t) => {
          const src = (t.payload?.hrSource as string | undefined) ?? undefined
          return {
            date: t.created_at,
            hrt: t.hrt_bpm,
            source: src,
            verified: t.payload?.hrVerified === true && src !== 'manual' && src !== undefined,
            gated: true,
            interpretation: (t.payload?.interpretation as string | undefined) ?? null,
            // eventType is what lets the hub's deriveAttention see a
            // 'red-flag-cleared' event and DOWNGRADE the urgent banner —
            // without it a red flag stayed urgent forever for real clinics.
            eventType: (t.payload?.eventType as string | undefined) ?? null,
            modality: (t.payload?.modality as string | undefined) ?? null,
            verifiedReadingPct:
              typeof t.payload?.verifiedReadingPct === 'number' ? t.payload.verifiedReadingPct : null,
            patientRef: t.patient_ref ?? null,
          }
        }),
        sessions: p.trainings.map((t) => ({ date: t.created_at, ...(t.payload ?? {}) })),
        sessionCount: p.trainings.length,
        // 'no-intolerance' on a re-test = recovered → clinician clearance review
        clearanceReady: interp === 'no-intolerance',
        // GP-report trigger (owner 2026-07-06): Medicare CDM funds ~5 allied
        // health services/yr, with a written report owed to the referring GP
        // after the last one. The app doesn't record clinic visits, so the
        // proxy is clinic ENCOUNTER-EQUIVALENTS: each graded test + each
        // distinct training week (≈ one weekly review). Due at ≥5, or the
        // moment the patient is clearance-ready (report = the referral back).
        gpReportDue:
          interp === 'no-intolerance' ||
          // encounter-equivalents count REAL graded tests only — an aborted-test
          // or clearance-acknowledgement event row is not a clinic encounter
          realTests.length +
            new Set(p.trainings.map((t) => {
              const d = new Date(t.created_at)
              return `w${Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86400000 + 4) / 7)}`
            })).size >= 5,
        lastActivity: (p.trainings[p.trainings.length - 1] ?? latest)?.created_at ?? null,
      }
    })

    const clinicName = (await getClinic(code))?.clinicName ?? null
    return NextResponse.json({ clinicCode: code, clinicName, patientCount: patients.length, patients })
  } catch (err) {
    console.error('SST clinic-sessions read error:', err)
    return NextResponse.json({ error: 'Could not load sessions' }, { status: 500 })
  }
}
