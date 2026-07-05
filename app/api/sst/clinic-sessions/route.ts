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
  session_type: string
  hrt_bpm: number | null
  band_low: number | null
  band_high: number | null
  condition: string | null
  payload: Record<string, unknown> | null
  created_at: string
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
    const { rows } = await sql<Row>`
      SELECT patient_label, session_type, hrt_bpm, band_low, band_high, condition, payload, created_at
      FROM sst_clinic_sessions
      WHERE upper(clinic_code) = ${code}
      ORDER BY created_at ASC
    `
    const byPatient = new Map<string, { thresholds: Row[]; trainings: Row[] }>()
    for (const r of rows) {
      const key = (r.patient_label || 'Unidentified').trim() || 'Unidentified'
      if (!byPatient.has(key)) byPatient.set(key, { thresholds: [], trainings: [] })
      const p = byPatient.get(key)!
      if (r.session_type === 'threshold') p.thresholds.push(r)
      else p.trainings.push(r)
    }

    const patients = [...byPatient.entries()].map(([name, p]) => {
      const latest = p.thresholds[p.thresholds.length - 1]
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
          p.thresholds.length +
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
