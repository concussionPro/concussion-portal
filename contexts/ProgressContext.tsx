'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'

export interface ModuleProgress {
  moduleId: number
  completed: boolean
  videoWatchedMinutes: number
  videoCompleted: boolean
  quizScore: number | null
  quizTotalQuestions: number | null
  quizCompleted: boolean
  startedAt: Date | null
  completedAt: Date | null
  activeStudyMinutes: number // NEW: actual tracked study time
  lastActiveAt: Date | null  // NEW: last time user was actively studying
}

interface ProgressContextType {
  progress: Record<number, ModuleProgress>
  updateVideoProgress: (moduleId: number, minutes: number) => void
  markVideoComplete: (moduleId: number) => void
  updateQuizScore: (moduleId: number, score: number, totalQuestions: number) => void
  markModuleComplete: (moduleId: number) => void
  markModuleStarted: (moduleId: number) => void
  trackActiveStudy: (moduleId: number) => void
  getTotalCompletedModules: () => number
  getTotalCPDPoints: () => number
  getTotalStudyTime: () => number
  getModuleProgress: (moduleId: number) => ModuleProgress
  isModuleComplete: (moduleId: number) => boolean
  isModuleStarted: (moduleId: number) => boolean
  canMarkModuleComplete: (moduleId: number, requiredMinutes: number) => boolean
  resetProgress: () => void
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

const STORAGE_KEY = 'concussion-pro-progress'

function createDefaultModuleProgress(moduleId: number): ModuleProgress {
  return {
    moduleId,
    completed: false,
    videoWatchedMinutes: 0,
    videoCompleted: false,
    quizScore: null,
    quizTotalQuestions: null,
    quizCompleted: false,
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
  // SCAT free modules 101-105
  for (let i = 101; i <= 105; i++) {
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
    // Migrate: add new fields if missing
    if (entry.activeStudyMinutes === undefined) entry.activeStudyMinutes = 0
    if (entry.lastActiveAt === undefined) entry.lastActiveAt = null
    parsed[Number(key)] = entry
  })
  return parsed
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Record<number, ModuleProgress>>(getDefaultProgress())
  const [isInitialized, setIsInitialized] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load progress from backend on mount
  useEffect(() => {
    async function loadProgress() {
      if (typeof window !== 'undefined') {
        try {
          const response = await fetch('/api/progress')
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.progress) {
              const parsed = parseStoredProgress(data.progress)
              const merged = { ...getDefaultProgress(), ...parsed }
              setProgress(merged)
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
              setIsInitialized(true)
              return
            }
          }
        } catch (error) {
          console.error('Failed to load progress from backend:', error)
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
  }, [])

  // Debounced save to backend + localStorage
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return

    // Save to localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))

    // Debounce backend save (avoid excessive API calls during active tracking)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress }),
        })
      } catch (error) {
        console.error('Failed to save progress to backend:', error)
      }
    }, 2000) // 2-second debounce

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [progress, isInitialized])

  const updateVideoProgress = (moduleId: number, minutes: number) => {
    setProgress((prev) => {
      const currentModule = prev[moduleId] || createDefaultModuleProgress(moduleId)
      return {
        ...prev,
        [moduleId]: {
          ...currentModule,
          videoWatchedMinutes: Math.max(currentModule.videoWatchedMinutes, minutes),
          startedAt: currentModule.startedAt || new Date(),
        },
      }
    })
  }

  const markVideoComplete = (moduleId: number) => {
    setProgress((prev) => {
      const currentModule = prev[moduleId] || createDefaultModuleProgress(moduleId)
      return {
        ...prev,
        [moduleId]: {
          ...currentModule,
          videoCompleted: true,
        },
      }
    })
  }

  const updateQuizScore = (moduleId: number, score: number, totalQuestions: number) => {
    setProgress((prev) => {
      const currentModule = prev[moduleId] || createDefaultModuleProgress(moduleId)
      return {
        ...prev,
        [moduleId]: {
          ...currentModule,
          quizScore: score,
          quizTotalQuestions: totalQuestions,
          quizCompleted: true,
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
    // 5 CPD points per completed module
    return getTotalCompletedModules() * 5
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

  const canMarkModuleComplete = (moduleId: number, requiredMinutes: number): boolean => {
    const moduleProgress = progress[moduleId]
    if (!moduleProgress) return false

    const quizPassed =
      moduleProgress.quizCompleted &&
      moduleProgress.quizScore !== null &&
      moduleProgress.quizTotalQuestions !== null &&
      moduleProgress.quizTotalQuestions > 0 &&
      moduleProgress.quizScore / moduleProgress.quizTotalQuestions >= 0.75

    // For text-based modules (no video), just require quiz pass
    if (requiredMinutes === 0) {
      return !!quizPassed
    }

    return (
      moduleProgress.videoCompleted &&
      moduleProgress.videoWatchedMinutes >= requiredMinutes &&
      !!quizPassed
    )
  }

  const resetProgress = () => {
    setProgress(getDefaultProgress())
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <ProgressContext.Provider
      value={{
        progress,
        updateVideoProgress,
        markVideoComplete,
        updateQuizScore,
        markModuleComplete,
        markModuleStarted,
        trackActiveStudy,
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
