'use client'

import { useState, useEffect } from 'react'
import { Module } from '@/data/modules'

interface UseModuleDataResult {
  module: Module | null
  loading: boolean
  error: string | null
  accessLevel: 'preview' | 'online-only' | 'full-course' | null
  needsUpgrade: boolean
}

/**
 * Hook to fetch module content from secure API
 *
 * Content is fetched from server based on user's authentication.
 * This prevents unauthorized users from accessing paid content.
 */
export function useModuleData(moduleId: number): UseModuleDataResult {
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessLevel, setAccessLevel] = useState<'preview' | 'online-only' | 'full-course' | null>(null)
  const [needsUpgrade, setNeedsUpgrade] = useState(false)

  useEffect(() => {
    async function fetchModule() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/modules/${moduleId}`, {
          credentials: 'include', // Include session cookie
        })

        if (!response.ok) {
          const data = await response.json()

          // Check if this is an upgrade requirement (403 with upgrade flag)
          if (response.status === 403 && data.upgrade) {
            setNeedsUpgrade(true)
            setAccessLevel('preview')
            setError(null) // Don't set error for upgrade prompts
          } else if (response.status === 401) {
            setError('Authentication required')
          } else if (response.status === 404) {
            setError('Module not found')
          } else {
            setError(data.error || 'Failed to load module')
          }
          setLoading(false)
          return
        }

        const data = await response.json()

        if (data.success && data.module) {
          setModule(data.module)
          setAccessLevel(data.accessLevel)
          setNeedsUpgrade(false)
        } else {
          setError('Invalid response from server')
        }
      } catch (err) {
        console.error('Module fetch error:', err)
        setError('Network error - please check your connection')
      } finally {
        setLoading(false)
      }
    }

    fetchModule()
  }, [moduleId])

  return { module, loading, error, accessLevel, needsUpgrade }
}
