/**
 * Live in-session monitoring for the SST Trainer.
 *
 * The patient app pushes a heart-rate tick every few seconds WHILE training
 * (POST). The clinician dashboard polls the active patients for a clinic (GET)
 * to watch them run the rehab in real time. State lives in Vercel KV with a
 * short TTL so a patient automatically drops off the live view when they stop
 * (no tick for ~15s). Completed-session history is the separate, durable
 * sst_clinic_sessions store — this is ephemeral "right now" only.
 */
import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { rateLimit } from '@/lib/rate-limit'
import { isRegisteredClinic, verifyViewKey } from '@/lib/sst-trainer/clinic-registry'

// Clinic code must exist in the SAME KV registry the preseason tool and
// /api/sst/session use (`clinic:{code}`, via lib/sst-trainer/clinic-registry);
// DEMO00 is the shared demo code. Without this check anyone could write ticks
// for an arbitrary code string. READS additionally require the clinic's
// private viewKey (`&k=`) — patients hold the code, so code-only reads would
// expose the live roster to any patient (APP 11). Patient WRITES stay
// code-only.

const TICK_TTL = 15 // seconds — no tick within this and the patient is "gone"
const SET_TTL = 90 // seconds — the per-clinic active index

interface LiveTick {
  patientLabel: string
  /** install UUID from the patient app — the stable per-device identity.
   *  Null only for old app builds that predate the field. */
  patientRef: string | null
  bpm: number | null
  bandLow: number | null
  bandHigh: number | null
  zone: 'under' | 'in' | 'over' | null
  elapsedSec: number | null
  phase: string | null
  updatedAt: number
}

function keyFor(code: string, patient: string) {
  return `sstlive:${code}:${patient}`
}
function setKey(code: string) {
  return `sstlive:${code}`
}
function clean(s: unknown, max: number): string {
  return String(s ?? '').trim().slice(0, max)
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const code = clean(body.clinicCode, 40).toUpperCase()
  if (code.length < 3) return NextResponse.json({ error: 'clinic code required' }, { status: 400 })
  const rl = await rateLimit({ key: `sst-live:${code}`, limit: 120, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if (!(await isRegisteredClinic(code))) {
    return NextResponse.json({ error: 'Clinic code not recognised' }, { status: 404 })
  }
  const patientLabel = clean(body.patientLabel, 60) || 'Unidentified'
  // Install UUID — every current app build sends it on each tick. Two patients
  // with the same display name must not overwrite each other's live slot, so
  // when present it keys the KV entry (label stays the display string).
  const patientRef = clean(body.patientRef, 64) || null

  const bpmRaw = Number(body.bpm)
  const bpm = Number.isFinite(bpmRaw) && bpmRaw > 30 && bpmRaw < 240 ? Math.round(bpmRaw) : null
  const bandLow = Number.isFinite(Number(body.bandLow)) ? Math.round(Number(body.bandLow)) : null
  const bandHigh = Number.isFinite(Number(body.bandHigh)) ? Math.round(Number(body.bandHigh)) : null
  const zone =
    bpm != null && bandLow != null && bandHigh != null
      ? bpm < bandLow ? 'under' : bpm > bandHigh ? 'over' : 'in'
      : null
  const elapsedSec = Number.isFinite(Number(body.elapsedSec)) ? Math.round(Number(body.elapsedSec)) : null
  const phase = body.phase ? clean(body.phase, 32) : null

  const tick: LiveTick = { patientLabel, patientRef, bpm, bandLow, bandHigh, zone, elapsedSec, phase, updatedAt: Date.now() }

  // Key by the install UUID when the tick carries one (fallback: label, for old
  // builds). Ephemeral store (15–90s TTL) — no migration concern.
  const identity = patientRef ?? patientLabel
  try {
    await kv.set(keyFor(code, identity), tick, { ex: TICK_TTL })
    await kv.sadd(setKey(code), identity)
    await kv.expire(setKey(code), SET_TTL)
  } catch (err) {
    console.error('[sst-live] write failed:', err)
    return NextResponse.json({ error: 'write failed' }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const code = clean(params.get('code'), 40).toUpperCase()
  if (code.length < 3) return NextResponse.json({ error: 'clinic code required' }, { status: 400 })
  const rl = await rateLimit({ key: `sst-live-read:${code}`, limit: 60, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if (!(await isRegisteredClinic(code))) {
    return NextResponse.json({ error: 'Clinic code not recognised' }, { status: 404 })
  }
  // Clinician read key — patient-held code alone must not read the live view.
  if (!(await verifyViewKey(code, params.get('k')))) {
    return NextResponse.json({ error: 'Clinician key required' }, { status: 401 })
  }

  try {
    const members = (await kv.smembers(setKey(code))) as string[]
    if (!members?.length) return NextResponse.json({ code, active: [] })
    const states = await Promise.all(members.map((m) => kv.get<LiveTick>(keyFor(code, m))))
    const active = states.filter((s): s is LiveTick => !!s).sort((a, b) => b.updatedAt - a.updatedAt)
    // Prune index members whose tick has expired (best-effort).
    const stale = members.filter((m, i) => !states[i])
    if (stale.length) kv.srem(setKey(code), ...stale).catch(() => {})
    return NextResponse.json({ code, active })
  } catch (err) {
    console.error('[sst-live] read failed:', err)
    return NextResponse.json({ error: 'read failed' }, { status: 500 })
  }
}
