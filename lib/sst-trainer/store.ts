/**
 * SST Trainer — versioned local persistence (`sst:v1`).
 *
 * The app is a take-home instrument: a concussed patient closes the browser and
 * comes back tomorrow, so EVERYTHING clinically meaningful lives in
 * localStorage and rehydrates on launch. No accounts, no server session — the
 * clinic code + install UUID (patientRef) tie the device to the clinician.
 *
 * Design rules:
 *  - One versioned envelope. A parse/schema failure discards gracefully
 *    (never crash the patient UI on a corrupt blob).
 *  - The install UUID is generated ONCE per install and rides along as
 *    `patientRef` on every sync payload and live tick.
 *  - Failed clinic syncs queue here and retry on next launch / 'online'.
 */

import type { Condition, Prescription, SessionLog, TestModality } from './protocol'

// ── types moved from components/sst-trainer/WelcomeMode.tsx (component deleted) ──

export type TrainerMode = 'self-guided' | 'clinic-code'

export interface WelcomeSelection {
  mode: TrainerMode
  /** Opt-in consent for de-identified session data to be used to monitor and
   *  improve the service / care quality (QA/service-evaluation framing — NOT
   *  research-purpose; that distinction keeps collection out of the HREC gate). */
  dataConsent?: boolean
  clinicCode: string | null
  /** Patient name — only captured in clinic-code mode so the clinician can tell
   *  their patients apart in the dashboard (mirrors the preseason athlete name). */
  patientName: string | null
  condition: Condition
  /**
   * INTAKE (2026-08-09). Clinic-scoped minted identity plus the covariates a
   * threshold is uninterpretable without. Asked ONCE; a returning patient is
   * hydrated from stored state and a patient on a new device re-enters only the
   * code, because everything else already exists server-side against it.
   */
  patientCode?: string | null
  /** Local only — converted to daysSinceInjury on device, never transmitted. */
  injuryDate?: string | null
  ageBand?: string | null
  sex?: string | null
  /** Separate from `dataConsent` (quality assurance). Opt-in, declinable, and
   *  gated behind CONFIG.FEATURES.SST_RESEARCH_CONSENT_LIVE until an HREC has
   *  approved the wording. Declining must never affect care. */
  researchConsent?: boolean
}

// ── persisted shapes ─────────────────────────────────────────────────────────

export const STORE_KEY = 'sst:v1'
const STORE_VERSION = 1 as const

/** A session with its wall-clock timestamp (drives weekly ring + next-day check-in). */
export interface PersistedSession extends SessionLog {
  at: number
}

export interface PersistedTest {
  at: number
  interpretation: string
  hrt: number | null
  thresholdStage: number | null
  modality: TestModality | null
  restingSymptomScore: number
  /**
   * true when this test ran on the clinician-directed override (the only thing
   * that lifts the one-test-per-calendar-day rule). Recorded locally AND in the
   * synced payload so the clinician's report says so.
   */
  clinicianDirected?: boolean
  /**
   * How many minutes of the graded ramp were actually recorded (distinct
   * stages). A test that terminated at voluntary exhaustion reads as
   * 'no-intolerance' — the CLEARANCE-GRADE result — whether the ramp ran one
   * minute or the full PROTOCOL_STAGE_CAP, and nothing on the report said
   * which. "Exercise tolerance recovered" off a one-minute ramp is a very
   * different clinical fact from the same words off a completed protocol, so
   * the duration travels with the finding. Optional: absent on local history
   * written before 2026-08-06 and on any row whose stage table wasn't stored.
   */
  stagesRecorded?: number
}

/** A clinic-sync body that failed to send — retried on next launch / online. */
export interface QueuedSync {
  url: string
  body: Record<string, unknown>
  queuedAt: number
  /** unique identity for safe removal — absent on legacy queued entries */
  id?: string
}

export interface PersistedState {
  v: typeof STORE_VERSION
  /** install UUID — sent as patientRef with every sync payload + live tick */
  installId: string
  mode: TrainerMode
  clinicCode: string | null
  clinicName: string | null
  patientName: string | null
  dataConsent: boolean
  goal: string | null
  goalLabel: string | null
  selectedSymptomIds: string[]
  restingSymptomScore: number
  /** current prescription (+ when it was set — re-tests replace it) */
  prescription: (Prescription & { createdAt: number }) | null
  /** every graded-test result, newest last */
  thresholdHistory: PersistedTest[]
  /** sessions under the CURRENT prescription (progression evaluates these only) */
  sessions: PersistedSession[]
  /** sessions under prior prescriptions — display/history only */
  archivedSessions: PersistedSession[]
  verifiedSessions: number
  progressionCheckpoint: number
  /** sessions.length at the last applied band change — a change must be earned by fresh sessions */
  decisionCheckpoint: number
  lastRedFlagAt: number | null
  /** red-flag lock: test + training blocked until clinician-clearance acknowledgement */
  redFlagLocked: boolean
  redFlagClearedAt: number | null
  lastTestAt: number | null
  lastRegressAt: number | null
  /**
   * Next-day check-in "Skip for now" marker — the calendar day
   * (Date.toDateString()) the patient last skipped. A skip holds for the rest
   * of that day so reopening the app doesn't re-ambush them; the check-in
   * returns tomorrow (the session's nextDayCheckin stays unanswered).
   */
  checkinSkippedOn: string | null
  /**
   * INTAKE (2026-08-09), persisted (2026-08-11 — onboarding captured these and
   * the page dropped them: nothing persisted, nothing transmitted). The code is
   * the clinic-scoped minted identity every server write needs; the covariates
   * ride locally so a returning patient is never re-asked. `injuryDate` stays
   * LOCAL ONLY — converted to daysSinceInjury on device, never transmitted.
   */
  patientCode: string | null
  injuryDate: string | null
  ageBand: string | null
  sex: string | null
  researchConsent: boolean
  /**
   * DAILY check-in (the rest-day comparator — distinct from the session-anchored
   * next-day check-in above): the local calendar day (YYYY-MM-DD) last answered,
   * and the score given. The score is kept so a session completed later the
   * same day can re-send the row with trained=true (the server upserts on
   * clinic+patient+date) without asking the patient the same question twice.
   */
  dailyCheckinOn: string | null
  dailyCheckinScore: number | null
  pendingSyncs: QueuedSync[]
}

// ── install id ───────────────────────────────────────────────────────────────

function generateInstallId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    // very old WebViews: still unique-enough, still stable once persisted
    return `sst-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  }
}

export function defaultState(): PersistedState {
  return {
    v: STORE_VERSION,
    installId: generateInstallId(),
    mode: 'clinic-code',
    clinicCode: null,
    clinicName: null,
    patientName: null,
    dataConsent: false,
    goal: null,
    goalLabel: null,
    selectedSymptomIds: [],
    restingSymptomScore: 0,
    prescription: null,
    thresholdHistory: [],
    sessions: [],
    archivedSessions: [],
    verifiedSessions: 0,
    progressionCheckpoint: 0,
    decisionCheckpoint: 0,
    lastRedFlagAt: null,
    redFlagLocked: false,
    redFlagClearedAt: null,
    lastTestAt: null,
    lastRegressAt: null,
    checkinSkippedOn: null,
    patientCode: null,
    injuryDate: null,
    ageBand: null,
    sex: null,
    researchConsent: false,
    dailyCheckinOn: null,
    dailyCheckinScore: null,
    pendingSyncs: [],
  }
}

// ── load / save / clear ──────────────────────────────────────────────────────

function storageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

/**
 * Load the persisted state. Returns null when nothing usable is stored — a
 * missing key, unparseable JSON, a version mismatch, or a shape that fails the
 * sanity checks all discard gracefully (the app just starts fresh).
 */
export function loadState(): PersistedState | null {
  if (!storageAvailable()) return null
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(STORE_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState> | null
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.v !== STORE_VERSION) return null
    if (typeof parsed.installId !== 'string' || !parsed.installId) return null
    // Merge over defaults so a field added in a later build never comes back
    // undefined for an early adopter (forward-compatible within v1).
    const base = defaultState()
    const state: PersistedState = { ...base, ...parsed, v: STORE_VERSION, installId: parsed.installId }
    // Schema sanity — arrays must be arrays; a broken prescription is discarded.
    if (!Array.isArray(state.sessions)) state.sessions = []
    if (!Array.isArray(state.archivedSessions)) state.archivedSessions = []
    if (!Array.isArray(state.thresholdHistory)) state.thresholdHistory = []
    if (!Array.isArray(state.pendingSyncs)) state.pendingSyncs = []
    if (!Array.isArray(state.selectedSymptomIds)) state.selectedSymptomIds = []
    if (state.prescription && typeof state.prescription.hrt !== 'number') state.prescription = null
    return state
  } catch {
    return null
  }
}

export function saveStateNow(state: PersistedState): void {
  if (!storageAvailable()) return
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(state))
  } catch {
    /* quota / private mode — persistence is best-effort */
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

/** Debounced save — call on every meaningful transition without thrashing I/O. */
export function saveStateDebounced(state: PersistedState, delayMs = 400): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    saveStateNow(state)
  }, delayMs)
}

/** Everything the page owns — the sync queue is owned by clinic-sync, not the page. */
export type PatientState = Omit<PersistedState, 'v' | 'pendingSyncs'>

/**
 * Debounced save of the page's state. The pendingSyncs queue is re-read from
 * disk AT FLUSH TIME so a sync queued during the debounce window is never
 * clobbered by a stale in-memory copy.
 */
export function savePatientStateDebounced(state: PatientState, delayMs = 400): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    const queue = loadState()?.pendingSyncs ?? []
    saveStateNow({ v: STORE_VERSION, ...state, pendingSyncs: queue })
  }, delayMs)
}

/**
 * "Start over" — wipes everything, including the install id.
 *
 * `preservePendingSyncs` keeps the failed-sync retry queue alive across the
 * wipe (2026-08-05: the clinician's "+ New patient" button called this and
 * silently destroyed every clinical event that hadn't reached the clinic yet).
 * The queued bodies already carry their own patientRef, so they still land
 * against the right patient after the install id is regenerated. When the
 * queue is empty the key is removed exactly as before.
 */
export function clearState(opts?: { preservePendingSyncs?: boolean }): void {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (!storageAvailable()) return
  const pending = opts?.preservePendingSyncs ? (loadState()?.pendingSyncs ?? []) : []
  try {
    if (pending.length) saveStateNow({ ...defaultState(), pendingSyncs: pending })
    else window.localStorage.removeItem(STORE_KEY)
  } catch {
    /* best-effort */
  }
}

// ── sync retry queue ─────────────────────────────────────────────────────────

const MAX_QUEUED_SYNCS = 50

/**
 * Append a failed clinic-sync body to the persisted retry queue (bypasses the
 * debounce — a queued clinical event must survive an immediate tab close).
 */
export function enqueuePendingSync(entry: QueuedSync): void {
  const state = loadState()
  if (!state) return
  const withId = entry.id
    ? entry
    : { ...entry, id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${entry.queuedAt}-${Math.random().toString(36).slice(2)}` }
  state.pendingSyncs = [...state.pendingSyncs, withId].slice(-MAX_QUEUED_SYNCS)
  saveStateNow(state)
}

/** Remove ONE processed entry by identity, preserving anything enqueued
 *  since the caller's snapshot (2026-08-05 round-4 #2: a whole-array replace
 *  from a stale snapshot destroyed events enqueued mid-flush). */
export function removePendingSync(entry: QueuedSync): void {
  const state = loadState()
  if (!state) return
  // Unique id first; legacy entries (pre-id) fall back to queuedAt+url+body —
  // same-millisecond distinct events must never remove each other
  // (round-5: two events settling in one microtask batch shared queuedAt).
  const i = state.pendingSyncs.findIndex((q) =>
    entry.id
      ? q.id === entry.id
      : q.queuedAt === entry.queuedAt && q.url === entry.url && JSON.stringify(q.body) === JSON.stringify(entry.body),
  )
  if (i === -1) return
  state.pendingSyncs = [...state.pendingSyncs.slice(0, i), ...state.pendingSyncs.slice(i + 1)]
  saveStateNow(state)
}

export function getPendingSyncs(): QueuedSync[] {
  return loadState()?.pendingSyncs ?? []
}
