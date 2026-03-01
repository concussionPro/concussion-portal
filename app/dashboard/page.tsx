'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { BentoGrid } from '@/components/dashboard/BentoGrid'
import { WelcomeModal } from '@/components/dashboard/WelcomeModal'
import { NextActionCard } from '@/components/dashboard/NextActionCard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Loader2, Sparkles } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [accessChecked, setAccessChecked] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)

  useAnalytics()

  useEffect(() => {
    const checkAccessLevel = async () => {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()

          if (data.user && data.user.accessLevel === 'preview') {
            router.push('/scat-course')
            return
          }

          // Extract user name for greeting
          if (data.user) {
            const name = data.user.name || data.user.email?.split('@')[0] || null
            setUserName(name)
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

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <ProtectedRoute>
      <WelcomeModal />
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6">
            {/* Welcome Greeting */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-accent" />
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  {getGreeting()}{userName ? `, ${userName}` : ''}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Continue your concussion management training below.
              </p>
            </div>

            <NextActionCard />
            <BentoGrid />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
