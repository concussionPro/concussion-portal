'use client'

import { useState, useEffect } from 'react'

export function useModuleAccess(moduleId: number) {
  const [hasFullAccess, setHasFullAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAccess() {
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      // First check localStorage for backward compatibility (demo users)
      const isPaidUser = localStorage.getItem('isPaidUser')
      if (isPaidUser === 'true') {
        setHasFullAccess(true)
        setLoading(false)
        return
      }

      // Check session-based authentication (JWT)
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user && data.user.accessLevel) {
            // Both online-only and full-course users have full module access
            const hasPaidAccess = data.user.accessLevel === 'online-only' ||
                                 data.user.accessLevel === 'full-course'
            setHasFullAccess(hasPaidAccess)
          }
        }
      } catch (error) {
        console.error('Access check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [moduleId])

  return { hasFullAccess, loading }
}
