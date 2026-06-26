import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

/**
 * GET /api/sst/clinic-sessions?code=CEA-1234
 *
 * The clinician read-side of the SST data flow. Returns a clinic's sessions
 * grouped into patients (by patient_label) with each patient's HRt trajectory
 * and the CLEARANCE SIGNAL — a threshold re-test that returned 'no-intolerance'
 * means the patient can exercise to exhaustion without provoking symptoms
 * (recovered exercise tolerance) and is ready for the clinician's clearance
 * review. The Clinical Hub reads this. Read-only.
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
        // serial HRt = the recovery curve
        hrtTrajectory: p.thresholds.map((t) => ({
          date: t.created_at,
          hrt: t.hrt_bpm,
          interpretation: (t.payload?.interpretation as string | undefined) ?? null,
        })),
        sessions: p.trainings.map((t) => ({ date: t.created_at, ...(t.payload ?? {}) })),
        sessionCount: p.trainings.length,
        // 'no-intolerance' on a re-test = recovered → clinician clearance review
        clearanceReady: interp === 'no-intolerance',
        lastActivity: (p.trainings[p.trainings.length - 1] ?? latest)?.created_at ?? null,
      }
    })

    return NextResponse.json({ clinicCode: code, patientCount: patients.length, patients })
  } catch (err) {
    console.error('SST clinic-sessions read error:', err)
    return NextResponse.json({ error: 'Could not load sessions' }, { status: 500 })
  }
}
