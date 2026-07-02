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
}

/** A clinic-sync body that failed to send — retried on next launch / online. */
export interface QueuedSync {
  url: string
  body: Record<string, unknown>
  queuedAt: number
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

/** "Start over" — wipes everything, including the install id. */
export function clearState(): void {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (!storageAvailable()) return
  try {
    window.localStorage.removeItem(STORE_KEY)
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
  state.pendingSyncs = [...state.pendingSyncs, entry].slice(-MAX_QUEUED_SYNCS)
  saveStateNow(state)
}

/** Replace the queue after a flush attempt (keep only what still failed). */
export function setPendingSyncs(remaining: QueuedSync[]): void {
  const state = loadState()
  if (!state) return
  state.pendingSyncs = remaining.slice(-MAX_QUEUED_SYNCS)
  saveStateNow(state)
}

export function getPendingSyncs(): QueuedSync[] {
  return loadState()?.pendingSyncs ?? []
}
