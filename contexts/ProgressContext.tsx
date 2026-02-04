'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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
}

interface ProgressContextType {
  progress: Record<number, ModuleProgress>
  updateVideoProgress: (moduleId: number, minutes: number) => void
  markVideoComplete: (moduleId: number) => void
  updateQuizScore: (moduleId: number, score: number, totalQuestions: number) => void
  markModuleComplete: (moduleId: number) => void
  getTotalCompletedModules: () => number
  getTotalCPDPoints: () => number
  getTotalStudyTime: () => number
  getModuleProgress: (moduleId: number) => ModuleProgress
  isModuleComplete: (moduleId: number) => boolean
  canMarkModuleComplete: (moduleId: number, requiredMinutes: number) => boolean
  resetProgress: () => void
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

const STORAGE_KEY = 'concussion-pro-progress'

function getDefaultProgress(): Record<number, ModuleProgress> {
  return {
    1: {
      moduleId: 1,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    },
    2: {
      moduleId: 2,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    },
    3: {
      moduleId: 3,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    },
    4: {
      moduleId: 4,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    },
    5: {
      moduleId: 5,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    },
    6: {
      moduleId: 6,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    },
    7: {
      moduleId: 7,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    },
    8: {
      moduleId: 8,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    },
    // SCAT Course modules (free preview)
    101: {
      moduleId: 101,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    },
    102: {
      moduleId: 102,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    },
    103: {
      moduleId: 103,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    },
    104: {
      moduleId: 104,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    },
    105: {
      moduleId: 105,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    },
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Record<number, ModuleProgress>>(getDefaultProgress())
  const [isInitialized, setIsInitialized] = useState(false)

  // Load progress from backend on mount
  useEffect(() => {
    async function loadProgress() {
      if (typeof window !== 'undefined') {
        try {
          // Try to load from backend first
          const response = await fetch('/api/progress')
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.progress) {
              // Parse dates from backend data
              const parsed = data.progress
              Object.keys(parsed).forEach((key) => {
                if (parsed[key].startedAt) {
                  parsed[key].startedAt = new Date(parsed[key].startedAt)
                }
                if (parsed[key].completedAt) {
                  parsed[key].completedAt = new Date(parsed[key].completedAt)
                }
              })
              const merged = { ...getDefaultProgress(), ...parsed }
              setProgress(merged)
              // Update localStorage cache
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
              setIsInitialized(true)
              return
            }
          }
        } catch (error) {
          console.error('Failed to load progress from backend:', error)
        }

        // Fallback to localStorage if backend fails or user not logged in
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            Object.keys(parsed).forEach((key) => {
              if (parsed[key].startedAt) {
                parsed[key].startedAt = new Date(parsed[key].startedAt)
              }
              if (parsed[key].completedAt) {
                parsed[key].completedAt = new Date(parsed[key].completedAt)
              }
            })
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

  // Save progress to backend and localStorage whenever it changes
  useEffect(() => {
    async function saveProgress() {
      if (isInitialized && typeof window !== 'undefined') {
        // Save to localStorage immediately (sync)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))

        // Save to backend (async)
        try {
          await fetch('/api/progress', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ progress }),
          })
        } catch (error) {
          console.error('Failed to save progress to backend:', error)
        }
      }
    }

    saveProgress()
  }, [progress, isInitialized])

  const updateVideoProgress = (moduleId: number, minutes: number) => {
    setProgress((prev) => {
      // Ensure module exists, create default if not
      const currentModule = prev[moduleId] || {
        moduleId,
        completed: false,
        videoWatchedMinutes: 0,
        videoCompleted: false,
        quizScore: null,
        quizTotalQuestions: null,
        quizCompleted: false,
        startedAt: null,
        completedAt: null,
      }

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
      const currentModule = prev[moduleId] || {
        moduleId,
        completed: false,
        videoWatchedMinutes: 0,
        videoCompleted: false,
        quizScore: null,
        quizTotalQuestions: null,
        quizCompleted: false,
        startedAt: null,
        completedAt: null,
      }

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
      const currentModule = prev[moduleId] || {
        moduleId,
        completed: false,
        videoWatchedMinutes: 0,
        videoCompleted: false,
        quizScore: null,
        quizTotalQuestions: null,
        quizCompleted: false,
        startedAt: null,
        completedAt: null,
      }

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
      const currentModule = prev[moduleId] || {
        moduleId,
        completed: false,
        videoWatchedMinutes: 0,
        videoCompleted: false,
        quizScore: null,
        quizTotalQuestions: null,
        quizCompleted: false,
        startedAt: null,
        completedAt: null,
      }

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

  const getTotalCompletedModules = () => {
    return Object.values(progress).filter((p) => p.completed).length
  }

  const getTotalCPDPoints = () => {
    // Each online module = 1 CPD point (8 total online)
    return getTotalCompletedModules()
  }

  const getTotalStudyTime = () => {
    return Object.values(progress).reduce((total, p) => {
      if (p.startedAt && p.completedAt) {
        const hours = (p.completedAt.getTime() - p.startedAt.getTime()) / (1000 * 60 * 60)
        return total + hours
      }
      return total
    }, 0)
  }

  const getModuleProgress = (moduleId: number): ModuleProgress => {
    return progress[moduleId] || getDefaultProgress()[moduleId] || {
      moduleId,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    }
  }

  const isModuleComplete = (moduleId: number): boolean => {
    return progress[moduleId]?.completed || false
  }

  const canMarkModuleComplete = (moduleId: number, requiredMinutes: number): boolean => {
    const moduleProgress = progress[moduleId]
    if (!moduleProgress) return false

    // Calculate quiz pass percentage (must be >= 75%)
    const quizPassed = moduleProgress.quizCompleted &&
                       moduleProgress.quizScore !== null &&
                       moduleProgress.quizTotalQuestions !== null &&
                       moduleProgress.quizTotalQuestions > 0 &&
                       (moduleProgress.quizScore / moduleProgress.quizTotalQuestions) >= 0.75

    return (
      moduleProgress.videoCompleted &&
      moduleProgress.videoWatchedMinutes >= requiredMinutes &&
      quizPassed
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
        getTotalCompletedModules,
        getTotalCPDPoints,
        getTotalStudyTime,
        getModuleProgress,
        isModuleComplete,
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
