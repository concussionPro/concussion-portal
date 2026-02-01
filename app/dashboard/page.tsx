'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { BentoGrid } from '@/components/dashboard/BentoGrid'
import { WelcomeModal } from '@/components/dashboard/WelcomeModal'
import { NextActionCard } from '@/components/dashboard/NextActionCard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [accessChecked, setAccessChecked] = useState(false)

  useAnalytics() // Track page views

  // CRITICAL: Redirect preview users to SCAT course page
  useEffect(() => {
    const checkAccessLevel = async () => {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()

          // Preview users should NOT access the full dashboard
          if (data.user && data.user.accessLevel === 'preview') {
            router.push('/scat-course')
            return
          }
        }

        setAccessChecked(true)
      } catch (error) {
        console.error('Access check failed:', error)
        setAccessChecked(true)
      }
    }

    checkAccessLevel()
  }, [router])

  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Checking access...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <WelcomeModal />
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6">
            <NextActionCard />
            <BentoGrid />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
