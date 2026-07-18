import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { kv } from '@vercel/kv'
import { sql } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'
import { getClinicUsage } from '@/lib/sst-trainer/clinic-registry'
import { detectThreshold, computePrescription } from '@/lib/sst-trainer/protocol'
import type { TestStage, TestInput, Condition } from '@/lib/sst-trainer/protocol'

/**
 * POST /api/sst/session
 *
 * Data flow back to the clinician via the patient's CLINIC CODE. When a patient
 * has entered a clinic code, the SST app posts each completed threshold test +
 * training session here so their treating clinician can review them (read by
 * code on the Clinical Hub). The clinic code is the key — no account needed on
 * the patient side. Isolated table (sst_clinic_sessions); never touches course
 * users or billing. Best-effort: a failure must never block the patient's
 * session UI, so the client fires this fire-and-forget.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit({ key: `sst-session:${ip}`, limit: 30, windowSec: 60 })
    if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const clinicCode = typeof body.clinicCode === 'string' ? body.clinicCode.trim().toUpperCase() : ''
    const sessionType = body.sessionType === 'threshold' || body.sessionType === 'training' ? body.sessionType : null
    if (!clinicCode || clinicCode.length < 3 || clinicCode.length > 40) {
      return NextResponse.json({ error: 'Valid clinic code required' }, { status: 400 })
    }
    if (!sessionType) {
      return NextResponse.json({ error: 'sessionType must be threshold|training' }, { status: 400 })
    }

    // Validate the clinic code against the SAME registry the preseason baseline
    // tool uses (Vercel KV `clinic:{code}`) — one clinic code for both tools.
    // DEMO00 is the shared demo code; anything else must be a registered clinic.
    const clinic =
      clinicCode === 'DEMO00'
        ? { clinicName: 'Demo Clinic' }
        : await kv.get<{ clinicName?: string }>(`clinic:${clinicCode}`)
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic code not recognised' }, { status: 404 })
    }
    const clinicName = clinic.clinicName ?? null

    const intOrNull = (v: unknown) => {
      const n = typeof v === 'number' ? v : Number(v)
      return Number.isFinite(n) && n > 0 && n < 1000 ? Math.round(n) : null
    }
    const patientLabel = typeof body.patientLabel === 'string' ? body.patientLabel.trim().slice(0, 80) || null : null
    const condition = typeof body.condition === 'string' ? body.condition.slice(0, 40) : null
    // Cap the payload so a malformed client can't write unbounded JSON.
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {}
    if (JSON.stringify(payload).length > 20_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    // Trial-cap ADMISSION gate (server-side — the UI gate in onboarding is a
    // crafted-client bypass otherwise). A genuinely NEW patient can't be admitted
    // past a full free trial; an ALREADY-COUNTED patient is NEVER blocked, so
    // mid-treatment data always syncs (clinical-safety rule). DEMO + unnamed
    // writes are exempt (can't attribute an unnamed session to a distinct patient).
    if (clinicCode !== 'DEMO00' && patientLabel) {
      const { rows: seen } = await sql<{ one: number }>`
        SELECT 1 AS one FROM sst_clinic_sessions
        WHERE upper(clinic_code) = ${clinicCode} AND trim(patient_label) = ${patientLabel}
        LIMIT 1
      `
      if (seen.length === 0) {
        const usage = await getClinicUsage(clinicCode)
        if (!usage.canAddPatient) {
          return NextResponse.json(
            { error: 'trial-full', message: 'This clinic’s free trial is full — ask your clinician to add you.' },
            { status: 402 },
          )
        }
      }
    }

    // ── Server-side reconciliation of the clinically-loaded fields ───────────
    // For a THRESHOLD test the clearance signal (`interpretation`) and the HRt
    // drive the GP report's clearance recommendation, so they must not be
    // trusted from the client body. Re-derive them from the raw stage data the
    // same client sent, using the SAME detectThreshold the client ran. A
    // tampered client can therefore no longer post interpretation:'no-intolerance'
    // + a fabricated HRt to trip clearanceReady — it would have to forge a full,
    // plausible stage table, which the clinician reviews and signs off. The band
    // is re-derived from the verified HRt to stay consistent.
    let storedHrt = intOrNull(body.hrtBpm)
    let storedBandLow = intOrNull(body.bandLow)
    let storedBandHigh = intOrNull(body.bandHigh)
    const payloadForStore: Record<string, unknown> = { ...(payload as Record<string, unknown>) }

    if (sessionType === 'threshold' && Array.isArray((payload as { stages?: unknown }).stages)) {
      const rawStages = (payload as { stages: unknown[] }).stages
      const stages: TestStage[] = rawStages
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map((s) => ({
          minute: Number(s.minute),
          heartRate: Number(s.heartRate),
          symptomScore: Number(s.symptomScore),
          hrVerified: s.hrVerified === true,
        }))
        .filter((s) => Number.isFinite(s.minute) && Number.isFinite(s.heartRate) && Number.isFinite(s.symptomScore))

      // Read the canonical key, falling back to the watch's legacy `restingSymptom`
      // key so older watch builds still reconcile against the right baseline.
      const rp = payload as { restingSymptomScore?: unknown; restingSymptom?: unknown }
      const restingRaw = Number(rp.restingSymptomScore ?? rp.restingSymptom)
      const resting = Number.isFinite(restingRaw) ? restingRaw : 0
      const termRaw = (payload as { termination?: unknown }).termination
      const termination = (typeof termRaw === 'string' ? termRaw : 'completed') as TestInput['termination']

      const derived = detectThreshold({ restingSymptomScore: resting, stages, termination })

      const claimedInterp = (payload as { interpretation?: unknown }).interpretation
      if (typeof claimedInterp === 'string' && claimedInterp !== derived.interpretation) {
        console.warn(
          `SST session: client interpretation '${claimedInterp}' != server-derived '${derived.interpretation}' (clinic ${clinicCode.slice(0, 3)}***) — using server value`,
        )
      }

      payloadForStore.interpretation = derived.interpretation
      payloadForStore.thresholdStage = derived.thresholdStage
      storedHrt = derived.hrt != null ? Math.round(derived.hrt) : null

      if (storedHrt != null) {
        try {
          const rx = computePrescription(storedHrt, ((condition as Condition) || 'concussion'))
          storedBandLow = rx.lowerBpm
          storedBandHigh = rx.upperBpm
        } catch {
          /* unrecognised condition → keep the client-provided band */
        }
      } else {
        storedBandLow = null
        storedBandHigh = null
      }
    }

    await sql`
      INSERT INTO sst_clinic_sessions
        (id, clinic_code, clinic_name, patient_label, session_type, hrt_bpm, band_low, band_high, condition, payload, created_at)
      VALUES (
        ${crypto.randomUUID()}, ${clinicCode}, ${clinicName}, ${patientLabel}, ${sessionType},
        ${storedHrt}, ${storedBandLow}, ${storedBandHigh},
        ${condition}, ${JSON.stringify(payloadForStore)}::jsonb, now()
      )
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('SST session ingest error:', err)
    return NextResponse.json({ error: 'Could not save session' }, { status: 500 })
  }
}
