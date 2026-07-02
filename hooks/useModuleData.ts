'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Module } from '@/data/modules'

export interface UseModuleDataResult {
  module: Module | null
  loading: boolean
  error: string | null
  accessLevel: 'preview' | 'online-only' | 'full-course' | null
  needsUpgrade: boolean
  allSectionTitles: string[] | null
}

export type CourseKey = 'flagship' | 'ep'

const COURSE_ENDPOINTS: Record<CourseKey, string> = {
  flagship: '/api/modules',
  ep: '/api/ep-course/modules',
}

/**
 * Hook to fetch module content from secure API
 *
 * Content is fetched from server based on user's authentication.
 * This prevents unauthorized users from accessing paid content.
 *
 * Parameterised by course: the flagship learning suite and the EP course
 * (Concussion Rehab Mastery) share this single implementation — only the
 * API endpoint differs. (useEpModuleData is a thin wrapper.)
 */
export function useModuleData(moduleId: number, course: CourseKey = 'flagship'): UseModuleDataResult {
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessLevel, setAccessLevel] = useState<'preview' | 'online-only' | 'full-course' | null>(null)
  const [needsUpgrade, setNeedsUpgrade] = useState(false)
  const [allSectionTitles, setAllSectionTitles] = useState<string[] | null>(null)

  const fetchModule = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true)
      setError(null)
    }

    try {
      const response = await fetch(`${COURSE_ENDPOINTS[course]}/${moduleId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()

        if (response.status === 403 && data.upgrade) {
          setNeedsUpgrade(true)
          setAccessLevel('preview')
          setError(null)
        } else if (response.status === 401) {
          setError('Authentication required')
        } else if (response.status === 404) {
          setError('Module not found')
        } else {
          setError(data.error || 'Failed to load module')
        }
        if (!isRefresh) setLoading(false)
        return
      }

      const data = await response.json()

      if (data.success && data.module) {
        setModule(data.module)
        setAccessLevel(data.accessLevel)
        setNeedsUpgrade(false)
        if (data.allSectionTitles) {
          setAllSectionTitles(data.allSectionTitles)
        } else {
          setAllSectionTitles(null)
        }
      } else {
        setError('Invalid response from server')
      }
    } catch (err) {
      if (!isRefresh) {
        console.error('Module fetch error:', err)
        setError('Network error - please check your connection')
      }
    } finally {
      if (!isRefresh) setLoading(false)
    }
  }, [moduleId, course])

  // Initial fetch
  useEffect(() => {
    fetchModule()
  }, [fetchModule])

  // Re-fetch when tab becomes visible (user returning from Stripe checkout)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && accessLevel === 'preview') {
        fetchModule(true)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchModule, accessLevel])

  return { module, loading, error, accessLevel, needsUpgrade, allSectionTitles }
}
