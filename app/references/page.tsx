'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ReferenceRepository } from '@/components/dashboard/ReferenceRepository'
import { useState, useEffect } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function ReferencesPage() {
  const [accessLevel, setAccessLevel] = useState<'online-only' | 'full-course' | null>(null)
  const [loading, setLoading] = useState(true)
  useAnalytics() // Track page views

  useEffect(() => {
    // Check session-based access level
    async function checkAccess() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setAccessLevel(data.user.accessLevel)
          }
        }
      } catch (error) {
        console.error('Access check failed:', error)
      } finally {
        setLoading(false)
      }
    }
    checkAccess()
  }, [])

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-0 md:ml-64 flex-1">
          <div className="px-4 sm:px-6 md:px-8 py-6 max-w-[1400px]">
            <ReferenceRepository accessLevel={accessLevel} loading={loading} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
