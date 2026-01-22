'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface ModuleProgress {
  moduleId: number
  completed: boolean
  videoWatchedMinutes: number
  videoCompleted: boolean
  quizScore: number | null
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
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    },
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Record<number, ModuleProgress>>(getDefaultProgress())
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
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
          // Merge stored data with defaults to ensure all modules exist
          const merged = { ...getDefaultProgress(), ...parsed }
          setProgress(merged)
        } catch (error) {
          console.error('Failed to parse stored progress:', error)
        }
      }
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    }
  }, [progress, isInitialized])

  const updateVideoProgress = (moduleId: number, minutes: number) => {
    setProgress((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        videoWatchedMinutes: Math.max(prev[moduleId].videoWatchedMinutes, minutes),
        startedAt: prev[moduleId].startedAt || new Date(),
      },
    }))
  }

  const markVideoComplete = (moduleId: number) => {
    setProgress((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        videoCompleted: true,
      },
    }))
  }

  const updateQuizScore = (moduleId: number, score: number, totalQuestions: number) => {
    setProgress((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        quizScore: score,
        quizCompleted: true,
      },
    }))
  }

  const markModuleComplete = (moduleId: number) => {
    setProgress((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        completed: true,
        completedAt: new Date(),
      },
    }))
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
    return progress[moduleId] || getDefaultProgress()[moduleId]
  }

  const isModuleComplete = (moduleId: number): boolean => {
    return progress[moduleId]?.completed || false
  }

  const canMarkModuleComplete = (moduleId: number, requiredMinutes: number): boolean => {
    const moduleProgress = progress[moduleId]
    if (!moduleProgress) return false
    return (
      moduleProgress.videoCompleted &&
      moduleProgress.videoWatchedMinutes >= requiredMinutes &&
      moduleProgress.quizCompleted &&
      (moduleProgress.quizScore || 0) >= 2
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
