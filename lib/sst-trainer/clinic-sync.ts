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
    // so treat as "handled" and don't queue. 5xx/network → retry later.
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
export async function validateClinicCode(code: string): Promise<ClinicValidation | null> {
  const trimmed = code.trim()
  if (!trimmed) return { valid: false, clinicName: null }
  try {
    const res = await fetch(`/api/sst/validate-code?code=${encodeURIComponent(trimmed)}`)
    if (res.status === 429 || res.status >= 500) return null
    const data = (await res.json().catch(() => null)) as { valid?: unknown; clinicName?: unknown } | null
    if (!data) return res.ok ? { valid: false, clinicName: null } : null
    return {
      valid: data.valid === true,
      clinicName: typeof data.clinicName === 'string' && data.clinicName ? data.clinicName : null,
    }
  } catch {
    return null
  }
}
