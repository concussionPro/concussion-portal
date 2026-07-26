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
  startedAt: Date | null
  completedAt: Date | null
  activeStudyMinutes: number // NEW: actual tracked study time
  lastActiveAt: Date | null  // NEW: last time user was actively studying
}

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

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

// Parse stored progress, handling migration from old format
function parseStoredProgress(data: Record<string, ModuleProgress>): Record<number, ModuleProgress> {
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
    parsed[Number(key)] = entry
  })
  return parsed
}

// Merge two progress records for the same module, preferring the MORE ADVANCED
// state on every axis. Used when the server load resolves so it can never
// clobber progress made while the fetch was in flight (e.g. the Module-1
// startedAt activation event fired in the first seconds on the page).
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
    startedAt: earliest(a.startedAt, b.startedAt),
    completedAt: earliest(a.completedAt, b.completedAt),
    activeStudyMinutes: Math.max(a.activeStudyMinutes || 0, b.activeStudyMinutes || 0),
    lastActiveAt: latest(a.lastActiveAt, b.lastActiveAt),
  }
}

function mergeProgress(
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

  // Keep ref in sync for beforeunload handler
  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  // Load progress from backend on mount
  useEffect(() => {
    async function loadProgress() {
      if (typeof window !== 'undefined') {
        try {
          setSyncState('syncing')
          const response = await fetch('/api/progress', { credentials: 'include' })
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.progress) {
              const parsed = parseStoredProgress(data.progress)
              // Check BEFORE overwriting localStorage
              const localStored = localStorage.getItem(STORAGE_KEY)
              const hadLocalData = localStored && Object.values(parseStoredProgress(JSON.parse(localStored))).some(p => p.completed || p.startedAt)

              // NOW write server data — functional merge so any progress made
              // while this fetch was in flight (startedAt, quiz answers) is
              // preserved rather than clobbered by the server snapshot.
              setProgress(prev => {
                const merged = mergeProgress(prev, parsed)
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

        // Fallback to localStorage
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            const parsed = parseStoredProgress(JSON.parse(stored))
            setProgress(prev => mergeProgress(prev, parsed))
          } catch (error) {
            console.error('Failed to parse stored progress:', error)
          }
        }
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
      if (hasPendingSaveRef.current) {
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
        setSyncState('synced')
        if (syncClearRef.current) clearTimeout(syncClearRef.current)
        syncClearRef.current = setTimeout(() => setSyncState('idle'), 3000)
        return
      }
      // Not ok — keep the pending flag so pagehide can still beacon it out.
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

  const updateQuizScore = (moduleId: number, score: number, totalQuestions: number, answers?: Record<string, number>) => {
    setProgress((prev) => {
      const currentModule = prev[moduleId] || createDefaultModuleProgress(moduleId)
      return {
        ...prev,
        [moduleId]: {
          ...currentModule,
          quizScore: score,
          quizTotalQuestions: totalQuestions,
          quizCompleted: true,
          quizAnswers: answers || null,
          quizSubmittedAt: new Date(),
        },
      }
    })
  }

  // Save in-progress quiz answers without marking quiz as complete
  const saveQuizAnswers = (moduleId: number, answers: Record<string, number>) => {
    setProgress((prev) => {
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
    setProgress((prev) => {
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
    setProgress((prev) => {
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
    setProgress((prev) => {
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
    setProgress(getDefaultProgress())
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      // Clear server-side progress
      fetch('/api/progress', { method: 'DELETE', credentials: 'include' }).catch(() => {})
    }
  }

  // Immediately flush any pending save to the backend (call before navigation)
  const flushSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: progressRef.current }),
        credentials: 'include',
      })
      hasPendingSaveRef.current = false
      if (!response.ok) {
        console.error('Failed to flush progress save:', response.status)
      }
    } catch (error) {
      console.error('Failed to flush progress save:', error)
    }
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
