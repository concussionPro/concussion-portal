'use client'

import { useState, useEffect } from 'react'
import { Module } from '@/data/modules'
import { SCATModule } from '@/data/scat-modules'

// Support both regular modules and SCAT modules
type AnyModule = Module | SCATModule

interface UseModuleDataResult {
  module: AnyModule | null
  loading: boolean
  error: string | null
  accessLevel: 'preview' | 'online-only' | 'full-course' | null
}

/**
 * Hook to fetch module content from secure API
 *
 * Content is fetched from server based on user's authentication.
 * This prevents unauthorized users from accessing paid content.
 */
export function useModuleData(moduleId: number): UseModuleDataResult {
  const [module, setModule] = useState<AnyModule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessLevel, setAccessLevel] = useState<'preview' | 'online-only' | 'full-course' | null>(null)

  useEffect(() => {
    async function fetchModule() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/modules/${moduleId}`, {
          credentials: 'include', // Include session cookie
        })

        if (!response.ok) {
          if (response.status === 401) {
            setError('Authentication required')
          } else if (response.status === 404) {
            setError('Module not found')
          } else {
            setError('Failed to load module')
          }
          setLoading(false)
          return
        }

        const data = await response.json()

        if (data.success && data.module) {
          setModule(data.module)
          setAccessLevel(data.accessLevel)
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

  return { module, loading, error, accessLevel }
}
