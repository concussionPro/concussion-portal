/**
 * Clinic data-flow — sends a patient's SST events back to their clinician via
 * the CLINIC CODE they entered at intake. Fire-and-forget + best-effort: a
 * failed sync must NEVER block or break the patient's session UI. Only fires
 * when a clinic code is present (self-guided users send nothing).
 *
 * COMPLETENESS: every clinically meaningful event syncs, not just the happy
 * path. `eventType` (inside payload — the server whitelists top-level fields)
 * distinguishes:
 *   threshold-physiologic | threshold-no-intolerance | threshold-red-flag |
 *   test-aborted | red-flag-cleared | session-completed |
 *   session-symptom-stopped | session-abandoned
 *
 * RELIABILITY: a network-failed sync queues in the local store and retries on
 *   the next launch / 'online' event — a dropped connection must not lose a
 *   clinical event. The UX stays fire-and-forget (never blocks the patient).
 *
 * IDENTITY: the install UUID rides along as `patientRef` — inside payload for
 *   session syncs (server spreads payload as-is) and as a top-level field on
 *   live ticks (the live route ignores unknown fields; additive only — the
 *   server code is untouched).
 */

import { enqueuePendingSync, getPendingSyncs, setPendingSyncs, type QueuedSync } from './store'

export type SyncEventType =
  | 'threshold-physiologic'
  | 'threshold-no-intolerance'
  | 'threshold-red-flag'
  | 'test-aborted'
  | 'red-flag-cleared'
  | 'session-completed'
  | 'session-symptom-stopped'
  | 'session-abandoned'

export interface ClinicSyncInput {
  clinicCode?: string | null
  patientLabel?: string | null
  /** the server accepts exactly these two; eventType carries the nuance */
  sessionType: 'threshold' | 'training'
  eventType: SyncEventType
  /** install UUID — additive identity field, carried inside payload */
  patientRef?: string | null
  hrtBpm?: number | null
  bandLow?: number | null
  bandHigh?: number | null
  condition?: string | null
  payload?: Record<string, unknown>
}

const SESSION_URL = '/api/sst/session'

/**
 * LIVE in-session tick — pushes the patient's current HR/band every few seconds
 * WHILE training, so the clinician dashboard can watch in real time.
 * Fire-and-forget; ephemeral by design (a missed tick is never queued).
 */
export function pushLiveTick(input: {
  clinicCode?: string | null
  patientLabel?: string | null
  patientRef?: string | null
  bpm?: number | null
  bandLow?: number | null
  bandHigh?: number | null
  elapsedSec?: number | null
  phase?: string | null
}): void {
  const code = input.clinicCode?.trim()
  if (!code) return
  try {
    void fetch('/api/sst/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicCode: code,
        patientLabel: input.patientLabel ?? null,
        patientRef: input.patientRef ?? null,
        bpm: input.bpm ?? null,
        bandLow: input.bandLow ?? null,
        bandHigh: input.bandHigh ?? null,
        elapsedSec: input.elapsedSec ?? null,
        phase: input.phase ?? null,
      }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* best-effort — never throw into the patient UI */
  }
}

function buildBody(input: ClinicSyncInput, code: string): Record<string, unknown> {
  return {
    clinicCode: code,
    patientLabel: input.patientLabel ?? null,
    sessionType: input.sessionType,
    hrtBpm: input.hrtBpm ?? null,
    bandLow: input.bandLow ?? null,
    bandHigh: input.bandHigh ?? null,
    condition: input.condition ?? null,
    payload: {
      ...(input.payload ?? {}),
      eventType: input.eventType,
      patientRef: input.patientRef ?? null,
    },
  }
}

async function post(url: string, body: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true, // survive navigation away from the session screen
    })
    // 4xx = the server rejected it (bad code etc) — retrying will never help,
    // so treat as "handled" and don't queue. EXCEPTION (2026-08-04 audit):
    // 402 trial-full is TEMPORARY — the clinic can upgrade, at which point the
    // same write becomes valid. Dropping it silently lost the patient's whole
    // episode. Queue it for retry AND flag the state so the app can tell the
    // patient their spot isn't active yet.
    if (res.status === 402) {
      try { localStorage.setItem('sst:trial-full', String(Date.now())) } catch { /* private mode */ }
      return false // → caller queues for later resync
    }
    if (res.ok) {
      try { localStorage.removeItem('sst:trial-full') } catch { /* private mode */ }
    }
    return res.ok || (res.status >= 400 && res.status < 500)
  } catch {
    return false
  }
}

/**
 * Sync a clinical event. Fire-and-forget for the caller; on network failure the
 * body is queued in the persisted store and retried by flushPendingSyncs().
 */
export function syncSessionToClinic(input: ClinicSyncInput): void {
  const code = input.clinicCode?.trim()
  if (!code) return // self-guided — nothing flows
  const body = buildBody(input, code)
  try {
    void post(SESSION_URL, body).then((ok) => {
      if (!ok) enqueuePendingSync({ url: SESSION_URL, body, queuedAt: Date.now() })
    })
  } catch {
    /* best-effort: never throw into the patient UI */
  }
}

let flushing = false

/**
 * Retry every queued sync (call on launch and on the window 'online' event).
 * Sequential + re-entrancy-guarded; whatever still fails stays queued.
 */
export async function flushPendingSyncs(): Promise<void> {
  if (flushing) return
  flushing = true
  try {
    const queue = getPendingSyncs()
    if (!queue.length) return
    const stillFailed: QueuedSync[] = []
    for (const entry of queue) {
      const ok = await post(entry.url, entry.body)
      if (!ok) stillFailed.push(entry)
    }
    setPendingSyncs(stillFailed)
  } catch {
    /* best-effort */
  } finally {
    flushing = false
  }
}

// ── clinic-code validation (onboarding) ──────────────────────────────────────

export interface ClinicValidation {
  valid: boolean
  clinicName: string | null
}

/**
 * Validate a clinic code against GET /api/sst/validate-code?code=X →
 * { valid, clinicName } (rate-limited). Returns null when the check itself
 * failed (offline / 429 / 5xx) — the caller shows "couldn't check" and offers a
 * retry, distinct from a genuinely invalid code.
 */
const VALID_CODE_CACHE = 'sst:v1:validCodes'

/** Remember a code that validated, so a returning patient (or an App Reviewer)
 *  can get back in on a flaky/offline network instead of hitting a hard wall. */
function rememberValidCode(code: string, clinicName: string | null) {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(VALID_CODE_CACHE)
    const map = raw ? (JSON.parse(raw) as Record<string, string | { n: string; t: number }>) : {}
    // TTL'd entry (2026-08-04 audit P2-8: cached codes lived forever — a
    // deactivated clinic's patients could re-enrol offline indefinitely)
    map[code] = { n: clinicName ?? '', t: Date.now() }
    window.localStorage.setItem(VALID_CODE_CACHE, JSON.stringify(map))
  } catch {
    /* storage full / disabled — non-fatal */
  }
}

function recallValidCode(code: string): ClinicValidation | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(VALID_CODE_CACHE)
    if (!raw) return null
    const map = JSON.parse(raw) as Record<string, string | { n: string; t: number }>
    const hit = map[code]
    if (hit !== undefined) {
      // Legacy string entries have no timestamp — honour once, they'll be
      // rewritten with one on the next successful validation.
      if (typeof hit === 'string') return { valid: true, clinicName: hit || null }
      if (Date.now() - hit.t < 7 * 86400000) return { valid: true, clinicName: hit.n || null }
      return null // expired — force a live check
    }
  } catch {
    /* ignore */
  }
  return null
}

export async function validateClinicCode(code: string): Promise<ClinicValidation | null> {
  const trimmed = code.trim()
  if (!trimmed) return { valid: false, clinicName: null }
  // DEMO00 is the built-in shared demo clinic (server returns a synthetic record
  // for it). Short-circuit it client-side so the App Review demo path never
  // depends on a live network call.
  if (trimmed.toUpperCase() === 'DEMO00') return { valid: true, clinicName: 'Demo Clinic' }
  try {
    const res = await fetch(`/api/sst/validate-code?code=${encodeURIComponent(trimmed)}`)
    if (res.status === 429 || res.status >= 500) return recallValidCode(trimmed.toUpperCase())
    const data = (await res.json().catch(() => null)) as { valid?: unknown; clinicName?: unknown } | null
    if (!data) return res.ok ? { valid: false, clinicName: null } : recallValidCode(trimmed.toUpperCase())
    const result = {
      valid: data.valid === true,
      clinicName: typeof data.clinicName === 'string' && data.clinicName ? data.clinicName : null,
    }
    if (result.valid) rememberValidCode(trimmed.toUpperCase(), result.clinicName)
    return result
  } catch {
    // Offline / DNS / dropped request — fall back to a previously validated code
    // so a network blip shows the patient a soft state, not a locked-out wall.
    return recallValidCode(trimmed.toUpperCase())
  }
}
