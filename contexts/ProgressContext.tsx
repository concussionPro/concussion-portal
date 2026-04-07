'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'

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
  // SCAT free modules 101-103
  for (let i = 101; i <= 103; i++) {
    defaults[i] = createDefaultModuleProgress(i)
  }
  return defaults
}

// Parse stored progress, handling migration from old format
function parseStoredProgress(data: Record<string, any>): Record<number, ModuleProgress> {
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

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Record<number, ModuleProgress>>(getDefaultProgress())
  const [isInitialized, setIsInitialized] = useState(false)
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [restoredFromServer, setRestoredFromServer] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const syncClearRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef(progress)
  const hasPendingSaveRef = useRef(false)

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

              // NOW write server data
              const merged = { ...getDefaultProgress(), ...parsed }
              setProgress(merged)
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))

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
            const merged = { ...getDefaultProgress(), ...parsed }
            setProgress(merged)
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

    // Flush pending saves when user leaves the page
    const handleBeforeUnload = () => {
      if (hasPendingSaveRef.current) {
        const body = JSON.stringify({ progress: progressRef.current })
        navigator.sendBeacon('/api/progress', new Blob([body], { type: 'application/json' }))
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (syncClearRef.current) clearTimeout(syncClearRef.current)
    }
  }, [])

  // Debounced save to backend + localStorage
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return

    // Save to localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))

    // Debounce backend save (avoid excessive API calls during active tracking)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    hasPendingSaveRef.current = true
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSyncState('syncing')
        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress }),
          credentials: 'include',
        })
        hasPendingSaveRef.current = false
        if (response.ok) {
          setSyncState('synced')
          if (syncClearRef.current) clearTimeout(syncClearRef.current)
          syncClearRef.current = setTimeout(() => setSyncState('idle'), 3000)
        } else {
          setSyncState('error')
        }
      } catch (error) {
        console.error('Failed to save progress to backend:', error)
        setSyncState(navigator.onLine ? 'error' : 'offline')
      }
    }, 2000) // 2-second debounce

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [progress, isInitialized])

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
    // 1 CPD point per completed online module (8 total online)
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
      moduleProgress.quizScore / moduleProgress.quizTotalQuestions >= 0.75
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
