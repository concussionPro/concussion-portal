'use client'

import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ReferenceRepository } from '@/components/dashboard/ReferenceRepository'
import { useState, useEffect } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Loader2 } from 'lucide-react'

export default function ReferencesPage() {
  const router = useRouter()
  const [accessLevel, setAccessLevel] = useState<'online-only' | 'full-course' | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessChecked, setAccessChecked] = useState(false)
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
            // CRITICAL: Preview users should NOT access references - redirect to SCAT course
            if (data.user.accessLevel === 'preview') {
              router.push('/scat-course')
              return
            }

            setAccessLevel(data.user.accessLevel)
          }
        }
      } catch (error) {
        console.error('Access check failed:', error)
      } finally {
        setLoading(false)
        setAccessChecked(true)
      }
    }
    checkAccess()
  }, [router])

  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-600">Checking access...</p>
        </div>
      </div>
    )
  }

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
