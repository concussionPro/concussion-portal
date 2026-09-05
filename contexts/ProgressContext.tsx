'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'

export interface ModuleProgress {
  moduleId: number
  completed: boolean
  quizScore: number | null
  quizTotalQuestions: number | null
  quizCompleted: boolean
  quizAnswers: Record<string, number> | null // Individual quiz answers: { questionId: selectedOptionIndex }
  quizSubmittedAt: Date | null
  /**
   * How many times this module's quiz has been SUBMITTED. Retakes are unlimited
   * by design (a knowledge check is a learning device, not an exam invigilation
   * problem) — but they were previously invisible: updateQuizScore overwrote in
   * place, so a 75%/80% pass behind an AHPRA CPD certificate was unfalsifiable.
   * Attempts are now counted and timestamped, so a pass can be read in context.
   */
  quizAttempts: number
  /** ISO timestamp + score of every submission, oldest first (capped). */
  quizAttemptHistory: Array<{ at: string; score: number; total: number }> | null
  startedAt: Date | null
  completedAt: Date | null
  activeStudyMinutes: number // NEW: actual tracked study time
  lastActiveAt: Date | null  // NEW: last time user was actively studying
}

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline' | 'demo'

interface ProgressContextType {
  progress: Record<number, ModuleProgress>
  syncState: SyncState
  restoredFromServer: boolean
  isInitialized: boolean
  updateQuizScore: (moduleId: number, score: number, totalQuestions: number, answers?: Record<string, number>) => void
  saveQuizAnswers: (moduleId: number, answers: Record<string, number>) => void
  markModuleComplete: (moduleId: number) => void
  markModuleStarted: (moduleId: number) => void
  trackActiveStudy: (moduleId: number) => void
  flushSave: () => Promise<void>
  getTotalCompletedModules: () => number
  getTotalCPDPoints: () => number
  getTotalStudyTime: () => number
  getModuleProgress: (moduleId: number) => ModuleProgress
  isModuleComplete: (moduleId: number) => boolean
  isModuleStarted: (moduleId: number) => boolean
  canMarkModuleComplete: (moduleId: number) => boolean
  resetProgress: () => void
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

const STORAGE_KEY = 'concussion-pro-progress'

/**
 * Wipe every learner-scoped browser key on sign-out.
 *
 * STORAGE_KEY is NOT user-scoped and was never cleared by either logout handler
 * (2026-08-06 state audit) — only by resetProgress. On a shared clinic machine
 * that is a cross-account leak with a CPD document at the end of it: user A
 * studies and signs out; user B signs in; loadProgress reads A's blob and
 * reconcileLoadedProgress deliberately unions "the more advanced side" into B's
 * server snapshot, so B inherits A's completed flags, quiz scores AND quiz
 * answers, the debounced save persists them to B's row, and /api/certificate
 * re-verifies A's answers and issues B a certificate for a course B never sat.
 * Section checkpoints (`module-N-checkpoint`, `ep-module-N-checkpoint`) leak the
 * same way, less severely.
 */
export function clearLocalLearnerState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    for (const k of Object.keys(localStorage)) {
      if (/^(ep-)?module-\d+-checkpoint$/.test(k)) localStorage.removeItem(k)
    }
  } catch {
    /* private mode / storage disabled — nothing to clear */
  }
}
// Backoff schedule for a failed progress save (ms). Bounded — after the last
// attempt we stop and rely on localStorage plus the next progress change.
const SAVE_RETRY_DELAYS = [2000, 5000, 15000, 45000]

// EP (Concussion Rehab Mastery) modules are namespaced to 201-208 in the shared
// progress store so they can never collide with flagship modules 1-8.
// URLs stay /ep-course/modules/1-8 — the EP surfaces map display id → 200 + id.
export const EP_MODULE_ID_OFFSET = 200
const isEpModuleId = (moduleId: number) => moduleId >= 201 && moduleId <= 208
// EP quizzes pass at 80% (matches all EP UI copy); flagship + SCAT pass at 75%.
export function quizPassThreshold(moduleId: number): number {
  return isEpModuleId(moduleId) ? 0.8 : 0.75
}

function createDefaultModuleProgress(moduleId: number): ModuleProgress {
  return {
    moduleId,
    completed: false,
    quizScore: null,
    quizTotalQuestions: null,
    quizCompleted: false,
    quizAnswers: null,
    quizSubmittedAt: null,
    quizAttempts: 0,
    quizAttemptHistory: null,
    startedAt: null,
    completedAt: null,
    activeStudyMinutes: 0,
    lastActiveAt: null,
  }
}

function getDefaultProgress(): Record<number, ModuleProgress> {
  const defaults: Record<number, ModuleProgress> = {}
  // Paid modules 1-8
  for (let i = 1; i <= 8; i++) {
    defaults[i] = createDefaultModuleProgress(i)
  }
  // Free modules 101-104. 101-103 are the SCAT6 Mastery course (the 3-module
  // free certificate); 104 is the standalone "Concussion Care Has Changed"
  // awareness short course, which is separately free and separately surfaced.
  // 104 was previously missing here, so its progress had no default entry —
  // the accessors are defensive enough that nothing crashed, but the free short
  // course was the one module the store didn't know existed.
  for (let i = 101; i <= 104; i++) {
    defaults[i] = createDefaultModuleProgress(i)
  }
  // EP course modules 201-208 (namespaced — see EP_MODULE_ID_OFFSET)
  for (let i = 201; i <= 208; i++) {
    defaults[i] = createDefaultModuleProgress(i)
  }
  return defaults
}

// Parse stored progress, handling migration from old format.
// Exported for tests — the merge rules below are the only thing standing
// between a flaky network and a clinician's lost modules.
export function parseStoredProgress(data: Record<string, ModuleProgress>): Record<number, ModuleProgress> {
  const parsed: Record<number, ModuleProgress> = {}
  Object.keys(data).forEach((key) => {
    const entry = data[key]
    if (entry.startedAt) entry.startedAt = new Date(entry.startedAt)
    if (entry.completedAt) entry.completedAt = new Date(entry.completedAt)
    if (entry.lastActiveAt) entry.lastActiveAt = new Date(entry.lastActiveAt)
    if (entry.quizSubmittedAt) entry.quizSubmittedAt = new Date(entry.quizSubmittedAt)
    // Migrate: add new fields if missing
    if (entry.activeStudyMinutes === undefined) entry.activeStudyMinutes = 0
    if (entry.lastActiveAt === undefined) entry.lastActiveAt = null
    if (entry.quizAnswers === undefined) entry.quizAnswers = null
    if (entry.quizSubmittedAt === undefined) entry.quizSubmittedAt = null
    // Pre-2026-08 records have no attempt counter. A completed quiz must count
    // as at least ONE attempt — never zero, which would read as "never sat".
    if (typeof entry.quizAttempts !== 'number') entry.quizAttempts = entry.quizCompleted ? 1 : 0
    if (entry.quizAttemptHistory === undefined) entry.quizAttemptHistory = null
    parsed[Number(key)] = entry
  })
  return parsed
}

// Merge two progress records for the same module, preferring the MORE ADVANCED
// state on every axis. Used when the server load resolves so it can never
// clobber progress made while the fetch was in flight (e.g. the Module-1
// startedAt activation event fired in the first seconds on the page).
/** Keep the newest MAX_ATTEMPT_HISTORY submissions; retakes are unlimited but
 *  the stored blob is not, and the progress row is sent on every save. */
const MAX_ATTEMPT_HISTORY = 25

/** Union two attempt logs by timestamp, oldest first, capped. */
function mergeAttemptHistory(
  a: ModuleProgress['quizAttemptHistory'],
  b: ModuleProgress['quizAttemptHistory'],
): ModuleProgress['quizAttemptHistory'] {
  if (!a && !b) return null
  const seen = new Map<string, { at: string; score: number; total: number }>()
  for (const e of [...(a ?? []), ...(b ?? [])]) {
    if (e && typeof e.at === 'string') seen.set(e.at, e)
  }
  const all = [...seen.values()].sort((x, y) => x.at.localeCompare(y.at))
  return all.slice(-MAX_ATTEMPT_HISTORY)
}

function mergeModuleProgress(a: ModuleProgress, b: ModuleProgress): ModuleProgress {
  const earliest = (x: Date | null, y: Date | null) =>
    x && y ? (x.getTime() <= y.getTime() ? x : y) : x || y
  const latest = (x: Date | null, y: Date | null) =>
    x && y ? (x.getTime() >= y.getTime() ? x : y) : x || y

  // Quiz fields travel together — take them from whichever record is further
  // along (completed quiz beats in-progress; higher score beats lower).
  const aQuizRank = a.quizCompleted ? 2 + (a.quizScore ?? 0) : a.quizAnswers ? 1 : 0
  const bQuizRank = b.quizCompleted ? 2 + (b.quizScore ?? 0) : b.quizAnswers ? 1 : 0
  const quizSource = bQuizRank > aQuizRank ? b : a

  // In-progress answers: prefer the set with more questions answered.
  const aAnswerCount = a.quizAnswers ? Object.keys(a.quizAnswers).length : 0
  const bAnswerCount = b.quizAnswers ? Object.keys(b.quizAnswers).length : 0

  return {
    moduleId: a.moduleId,
    completed: a.completed || b.completed,
    quizScore: quizSource.quizScore,
    quizTotalQuestions: quizSource.quizTotalQuestions,
    quizCompleted: a.quizCompleted || b.quizCompleted,
    quizAnswers: quizSource.quizCompleted
      ? quizSource.quizAnswers
      : bAnswerCount > aAnswerCount
        ? b.quizAnswers
        : a.quizAnswers,
    quizSubmittedAt: latest(a.quizSubmittedAt, b.quizSubmittedAt),
    // Attempts only ever go UP: a device that saw fewer submissions must never
    // erase attempts recorded elsewhere. History merges by timestamp.
    quizAttempts: Math.max(a.quizAttempts || 0, b.quizAttempts || 0),
    quizAttemptHistory: mergeAttemptHistory(a.quizAttemptHistory, b.quizAttemptHistory),
    startedAt: earliest(a.startedAt, b.startedAt),
    completedAt: earliest(a.completedAt, b.completedAt),
    activeStudyMinutes: Math.max(a.activeStudyMinutes || 0, b.activeStudyMinutes || 0),
    lastActiveAt: latest(a.lastActiveAt, b.lastActiveAt),
  }
}

export function mergeProgress(
  current: Record<number, ModuleProgress>,
  incoming: Record<number, ModuleProgress>
): Record<number, ModuleProgress> {
  const merged: Record<number, ModuleProgress> = { ...getDefaultProgress(), ...current }
  Object.keys(incoming).forEach((key) => {
    const id = Number(key)
    merged[id] = merged[id] ? mergeModuleProgress(merged[id], incoming[id]) : incoming[id]
  })
  return merged
}

/**
 * What the store holds once the initial load resolves.
 *
 * THREE sources, all of which can hold work the others do not:
 *  - `current`   — whatever happened on this page while the fetch was in flight
 *                  (markModuleStarted fires within a second of mount);
 *  - `local`     — localStorage, the ONLY home of any save that never reached
 *                  the server (offline session, a 500 that outlived the retry
 *                  schedule, a tab closed inside the debounce window);
 *  - `server`    — the cross-device record, null when the fetch failed or the
 *                  account has none yet.
 *
 * The loader used to read `local` purely to decide whether to show a "restored
 * from server" banner, then overwrite it with the server snapshot — so a
 * clinician who studied on flaky clinic wifi lost the modules they finished the
 * moment they next opened the course. mergeProgress always keeps the MORE
 * ADVANCED side, so unioning all three can only ever add.
 */
export function reconcileLoadedProgress(
  current: Record<number, ModuleProgress>,
  local: Record<number, ModuleProgress> | null,
  server: Record<number, ModuleProgress> | null,
): Record<number, ModuleProgress> {
  let merged = local ? mergeProgress(current, local) : mergeProgress(current, {})
  if (server) merged = mergeProgress(merged, server)
  return merged
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Record<number, ModuleProgress>>(getDefaultProgress())
  const [isInitialized, setIsInitialized] = useState(false)
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [restoredFromServer, setRestoredFromServer] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const syncClearRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef(progress)
  const hasPendingSaveRef = useRef(false)
  // Bounded retry for a failed server save. Progress is the one thing in this
  // app that must not be lost: localStorage always has it, but the SERVER copy
  // is what drives cross-device resume, the certificate trigger and the CPD
  // record. A save that fails and is never retried silently desynchronises them.
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryAttemptRef = useRef(0)
  /** Latest attemptSave, so the retry can re-enter without self-referencing. */
  const attemptSaveRef = useRef<(() => Promise<void>) | null>(null)
  /** True after GET /api/progress 2xx — skip anonymous POSTs that 401 on public pages. */
  const backendAuthedRef = useRef(false)

  // Keep ref in sync for beforeunload handler
  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  /**
   * setProgress that ALSO advances progressRef in the same tick.
   *
   * The effect above only runs after React re-renders, but flushSave() and the
   * pagehide sendBeacon both read progressRef SYNCHRONOUSLY. So the flush fired
   * by module completion (`markModuleComplete(); await flushSave()`) posted the
   * snapshot from BEFORE the completion — the module-8 "completed" flag that
   * unlocks the certificate reached the server only if the user stayed on the
   * page long enough for the 2-second debounce to fire again.
   *
   * The updater must therefore run OUTSIDE setProgress. Advancing the ref from
   * inside the setState updater does not fix this: React defers that updater
   * to the render phase, so `markModuleComplete(); await flushSave()` still
   * read the pre-completion snapshot. Verified 2026-08-06 — finishing all 8 EP
   * modules left every server record at `completed: false` (quiz results, saved
   * by the later debounce, persisted fine) and /api/certificate answered 403
   * "Course not yet completed" to a buyer who had passed every quiz.
   *
   * Chaining off progressRef.current is safe because the ref is advanced here
   * synchronously on every commit, so two commits in one tick still compose.
   */
  const commitProgress = useCallback(
    (updater: (prev: Record<number, ModuleProgress>) => Record<number, ModuleProgress>) => {
      const next = updater(progressRef.current)
      progressRef.current = next
      setProgress(next)
    },
    [],
  )

  // Load progress from backend on mount
  useEffect(() => {
    async function loadProgress() {
      if (typeof window !== 'undefined') {
        // Read the LOCAL copy up front. It is not just a cache: any save that
        // never reached the server (offline study session, a 500 that outlived
        // the retry schedule, a tab closed inside the debounce window) survives
        // ONLY here. Merging it in — rather than merely inspecting it for the
        // "restored" banner — is what stops the next page load from silently
        // destroying a clinician's completed modules.
        let local: Record<number, ModuleProgress> | null = null
        try {
          const localStored = localStorage.getItem(STORAGE_KEY)
          if (localStored) local = parseStoredProgress(JSON.parse(localStored))
        } catch (error) {
          console.error('Failed to parse stored progress:', error)
        }
        const hadLocalData = !!local && Object.values(local).some(p => p.completed || p.startedAt)

        try {
          setSyncState('syncing')
          // TIMEOUT, because `isInitialized` gates the save effect below —
          // and that effect is the ONLY writer of localStorage and the only
          // thing that arms `hasPendingSaveRef` for the pagehide beacon. On
          // flaky clinic wifi a fetch can hang for minutes rather than reject,
          // and for that whole window a clinician's work exists only in React
          // state: nothing on disk, nothing beaconed if the tab dies. Aborting
          // drops us into the localStorage fallback, which initialises the
          // store and starts persisting.
          const response = await fetch('/api/progress', {
            credentials: 'include',
            signal: AbortSignal.timeout(15000),
          })
          if (response.ok) {
            backendAuthedRef.current = true
            const data = await response.json()
            if (data.success && data.progress) {
              const parsed = parseStoredProgress(data.progress)

              // NOW write server data — functional merge so any progress made
              // while this fetch was in flight (startedAt, quiz answers) is
              // preserved rather than clobbered by the server snapshot, and the
              // local copy is unioned in ahead of it (mergeProgress always
              // keeps the MORE ADVANCED side, so the server can only add).
              commitProgress(prev => {
                const merged = reconcileLoadedProgress(prev, local, parsed)
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
                return merged
              })

              if (!hadLocalData) {
                const serverHasData = Object.values(parsed).some(p => p.completed || p.startedAt)
                if (serverHasData) {
                  setRestoredFromServer(true)
                }
              }

              setSyncState('synced')
              setIsInitialized(true)
              // Auto-clear synced after 3s
              syncClearRef.current = setTimeout(() => setSyncState('idle'), 3000)
              return
            }
          }
          setSyncState('idle')
        } catch (error) {
          console.error('Failed to load progress from backend:', error)
          setSyncState(navigator.onLine ? 'error' : 'offline')
        }

        // Fallback to localStorage (already parsed above)
        if (local) commitProgress(prev => reconcileLoadedProgress(prev, local, null))
        setIsInitialized(true)
      }
    }

    loadProgress()

    // Listen for online/offline events
    const handleOnline = () => setSyncState(prev => prev === 'offline' ? 'idle' : prev)
    const handleOffline = () => setSyncState('offline')
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Flush pending saves when the user leaves or backgrounds the page.
    // beforeunload alone is unreliable (never fires on mobile Safari / when a
    // tab is killed from the background) — pagehide + visibilitychange(hidden)
    // are the events that actually fire on mobile.
    const flushPending = () => {
      if (backendAuthedRef.current && hasPendingSaveRef.current) {
        const body = JSON.stringify({ progress: progressRef.current })
        const ok = navigator.sendBeacon('/api/progress', new Blob([body], { type: 'application/json' }))
        if (ok) hasPendingSaveRef.current = false
      }
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushPending()
    }
    window.addEventListener('beforeunload', flushPending)
    window.addEventListener('pagehide', flushPending)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeunload', flushPending)
      window.removeEventListener('pagehide', flushPending)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (syncClearRef.current) clearTimeout(syncClearRef.current)
    }
  }, [])

  /**
   * Push the CURRENT progress to the server, retrying a failure with backoff.
   *
   * Two rules that were previously broken:
   *  1. `hasPendingSaveRef` is cleared ONLY on a confirmed 2xx. It used to be
   *     cleared immediately after the fetch resolved, before checking
   *     `response.ok` — so an HTTP error also disarmed the pagehide sendBeacon,
   *     and the save was lost with no retry. (A thrown network error skipped
   *     that line and kept the flag, so the two failure modes behaved
   *     differently and the quieter one was the unrecoverable one.)
   *  2. A failure schedules a bounded retry. Without it, a transient 500 on the
   *     save carrying "module 8 complete" never reached the server, and the
   *     next attempt only happened if the user changed something else.
   *
   * Always sends progressRef.current, so a retry carries the LATEST state
   * rather than a stale snapshot from when the failure occurred.
   */
  const attemptSave = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (!backendAuthedRef.current) {
      hasPendingSaveRef.current = false
      setSyncState('idle')
      return
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    const scheduleRetry = () => {
      if (retryAttemptRef.current >= SAVE_RETRY_DELAYS.length) return // give up quietly; localStorage still holds it
      const delay = SAVE_RETRY_DELAYS[retryAttemptRef.current]
      retryAttemptRef.current += 1
      // Re-enter through the ref, not the const binding — a `const` arrow
      // referencing itself is a temporal-dead-zone hazard (and lint error).
      retryTimeoutRef.current = setTimeout(() => void attemptSaveRef.current?.(), delay)
    }
    try {
      setSyncState('syncing')
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: progressRef.current }),
        credentials: 'include',
      })
      if (response.ok) {
        hasPendingSaveRef.current = false
        retryAttemptRef.current = 0
        // Demo/review sessions acknowledge the POST with { demo: true } and
        // deliberately do not persist — surface 'demo' so every quiz UI shows
        // "Demo — progress not saved" (not idle, not red Save failed).
        let demo = false
        try {
          const data = await response.clone().json()
          demo = !!data?.demo
        } catch { /* non-JSON ok body */ }
        if (demo) {
          setSyncState('demo')
          return
        }
        setSyncState('synced')
        if (syncClearRef.current) clearTimeout(syncClearRef.current)
        syncClearRef.current = setTimeout(() => setSyncState('idle'), 3000)
        return
      }
      if (response.status === 401 || response.status === 403) {
        backendAuthedRef.current = false
        hasPendingSaveRef.current = false
        setSyncState('idle')
        return
      }
      // Other failures — keep the pending flag so pagehide can still beacon it out.
      console.error('Progress save rejected by server:', response.status)
      setSyncState('error')
      scheduleRetry()
    } catch (error) {
      console.error('Failed to save progress to backend:', error)
      setSyncState(navigator.onLine ? 'error' : 'offline')
      scheduleRetry()
    }
  }, [])

  // Keep the ref current in an effect — writing a ref during render is a
  // React purity violation.
  useEffect(() => {
    attemptSaveRef.current = attemptSave
  }, [attemptSave])

  // Retry a pending save the moment connectivity returns, rather than waiting
  // out the backoff.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onOnline = () => {
      if (hasPendingSaveRef.current) {
        retryAttemptRef.current = 0
        void attemptSave()
      }
    }
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('online', onOnline)
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    }
  }, [attemptSave])

  // Debounced save to backend + localStorage
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return

    // Save to localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))

    // Debounce backend save (avoid excessive API calls during active tracking)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    hasPendingSaveRef.current = true
    saveTimeoutRef.current = setTimeout(() => void attemptSave(), 2000) // 2-second debounce

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
    // attemptSave is a stable useCallback([]) that always reads progressRef,
    // so including it can never re-trigger this effect.
  }, [progress, isInitialized, attemptSave])

  /**
   * Record a quiz SUBMISSION. The latest score/answers still overwrite (the
   * certificate route re-verifies the stored answers server-side, so the live
   * set must be the latest), but the attempt is now COUNTED and timestamped —
   * previously a retake overwrote the record in place, leaving no evidence that
   * a passing score took five goes. Retakes stay unlimited; they are simply no
   * longer invisible.
   */
  const updateQuizScore = (moduleId: number, score: number, totalQuestions: number, answers?: Record<string, number>) => {
    commitProgress((prev) => {
      const currentModule = prev[moduleId] || createDefaultModuleProgress(moduleId)
      const at = new Date()
      const history = [
        ...(currentModule.quizAttemptHistory ?? []),
        { at: at.toISOString(), score, total: totalQuestions },
      ].slice(-MAX_ATTEMPT_HISTORY)
      return {
        ...prev,
        [moduleId]: {
          ...currentModule,
          quizScore: score,
          quizTotalQuestions: totalQuestions,
          quizCompleted: true,
          quizAnswers: answers || null,
          quizSubmittedAt: at,
          quizAttempts: (currentModule.quizAttempts || 0) + 1,
          quizAttemptHistory: history,
        },
      }
    })
  }

  // Save in-progress quiz answers without marking quiz as complete
  const saveQuizAnswers = (moduleId: number, answers: Record<string, number>) => {
    commitProgress((prev) => {
      const currentModule = prev[moduleId] || createDefaultModuleProgress(moduleId)
      return {
        ...prev,
        [moduleId]: {
          ...currentModule,
          quizAnswers: Object.keys(answers).length > 0 ? answers : null,
        },
      }
    })
  }

  const markModuleComplete = (moduleId: number) => {
    commitProgress((prev) => {
      const currentModule = prev[moduleId] || createDefaultModuleProgress(moduleId)
      return {
        ...prev,
        [moduleId]: {
          ...currentModule,
          completed: true,
          completedAt: new Date(),
        },
      }
    })
  }

  // NEW: Mark a module as started (for "in progress" state)
  const markModuleStarted = (moduleId: number) => {
    commitProgress((prev) => {
      const currentModule = prev[moduleId] || createDefaultModuleProgress(moduleId)
      if (currentModule.startedAt) return prev // Already started
      return {
        ...prev,
        [moduleId]: {
          ...currentModule,
          startedAt: new Date(),
          lastActiveAt: new Date(),
        },
      }
    })
  }

  // NEW: Track active study time (called periodically from module pages)
  const trackActiveStudy = (moduleId: number) => {
    commitProgress((prev) => {
      const currentModule = prev[moduleId] || createDefaultModuleProgress(moduleId)
      const now = new Date()
      let additionalMinutes = 0

      if (currentModule.lastActiveAt) {
        const elapsed = (now.getTime() - currentModule.lastActiveAt.getTime()) / (1000 * 60)
        // Only count if user was active within the last 5 minutes
        // (prevents counting time when tab is backgrounded)
        if (elapsed > 0 && elapsed <= 5) {
          additionalMinutes = elapsed
        }
      }

      return {
        ...prev,
        [moduleId]: {
          ...currentModule,
          activeStudyMinutes: currentModule.activeStudyMinutes + additionalMinutes,
          lastActiveAt: now,
          startedAt: currentModule.startedAt || now,
        },
      }
    })
  }

  const getTotalCompletedModules = () => {
    // Only count paid modules (1-8) for the main counter
    return Object.values(progress)
      .filter((p) => p.moduleId >= 1 && p.moduleId <= 8 && p.completed)
      .length
  }

  const getTotalCPDPoints = () => {
    // 1 CPD hour per completed online module (8 total online)
    return getTotalCompletedModules()
  }

  const getTotalStudyTime = () => {
    // Use activeStudyMinutes for accurate tracking, convert to hours
    const totalMinutes = Object.values(progress).reduce((total, p) => {
      return total + (p.activeStudyMinutes || 0)
    }, 0)

    // If no active tracking data, fall back to completed module time estimates
    if (totalMinutes === 0) {
      return Object.values(progress).reduce((total, p) => {
        if (p.startedAt && p.completedAt) {
          const hours = (p.completedAt.getTime() - p.startedAt.getTime()) / (1000 * 60 * 60)
          return total + Math.min(hours, 4) // Cap at 4 hours per module
        }
        return total
      }, 0)
    }

    return totalMinutes / 60
  }

  const getModuleProgress = (moduleId: number): ModuleProgress => {
    return (
      progress[moduleId] ||
      getDefaultProgress()[moduleId] ||
      createDefaultModuleProgress(moduleId)
    )
  }

  const isModuleComplete = (moduleId: number): boolean => {
    return progress[moduleId]?.completed || false
  }

  // NEW: Check if module has been started but not completed
  const isModuleStarted = (moduleId: number): boolean => {
    const mod = progress[moduleId]
    return mod ? !!mod.startedAt && !mod.completed : false
  }

  const canMarkModuleComplete = (moduleId: number): boolean => {
    const moduleProgress = progress[moduleId]
    if (!moduleProgress) return false

    return !!(
      moduleProgress.quizCompleted &&
      moduleProgress.quizScore !== null &&
      moduleProgress.quizTotalQuestions !== null &&
      moduleProgress.quizTotalQuestions > 0 &&
      moduleProgress.quizScore / moduleProgress.quizTotalQuestions >= quizPassThreshold(moduleId)
    )
  }

  const resetProgress = () => {
    commitProgress(() => getDefaultProgress())
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      // Clear server-side progress
      fetch('/api/progress', { method: 'DELETE', credentials: 'include' }).catch(() => {})
    }
  }

  /**
   * Immediately flush any pending save to the backend (call before navigation).
   *
   * Delegates to attemptSave so the flush inherits its two guarantees: the
   * pending flag is cleared ONLY on a confirmed 2xx (a failed flush used to
   * clear it anyway, disarming the pagehide sendBeacon — the module-completion
   * save was then lost with no retry), and a failure schedules the bounded
   * retry instead of ending in a console line.
   */
  const flushSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    retryAttemptRef.current = 0
    await attemptSave()
  }

  return (
    <ProgressContext.Provider
      value={{
        progress,
        syncState,
        restoredFromServer,
        isInitialized,
        updateQuizScore,
        saveQuizAnswers,
        markModuleComplete,
        markModuleStarted,
        trackActiveStudy,
        flushSave,
        getTotalCompletedModules,
        getTotalCPDPoints,
        getTotalStudyTime,
        getModuleProgress,
        isModuleComplete,
        isModuleStarted,
        canMarkModuleComplete,
        resetProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const context = useContext(ProgressContext)
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return context
}
