'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { BentoGrid } from '@/components/dashboard/BentoGrid'
import { WelcomeModal } from '@/components/dashboard/WelcomeModal'
import { NextActionCard } from '@/components/dashboard/NextActionCard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Loader2 } from 'lucide-react'
import { SessionProvider, useSession } from '@/contexts/SessionContext'

export default function DashboardPage() {
  return (
    <SessionProvider>
      <DashboardInner />
    </SessionProvider>
  )
}

function DashboardInner() {
  const { user, isLoading } = useSession()
  const [workshopLocationOverride, setWorkshopLocationOverride] = useState<string | null>(null)
  const [isReturningUser, setIsReturningUser] = useState(false)
  const [greeting, setGreeting] = useState('Welcome')

  useAnalytics()

  useEffect(() => {
    setIsReturningUser(localStorage.getItem('hasSeenWelcome') === 'true')

    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening')
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen dashboard-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  const userName = user?.name || user?.email?.split('@')[0] || null
  const accessLevel = user?.accessLevel || ''
  const workshopLocation = workshopLocationOverride ?? user?.workshopLocation ?? null
  const firstName = userName ? userName.split(' ')[0] : null

  return (
    <ProtectedRoute>
      <WelcomeModal />
      <div className="flex min-h-screen dashboard-bg">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
            {/* Premium Greeting */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">
                {greeting}{firstName ? `, ${firstName}` : ''}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isReturningUser
                  ? 'Pick up where you left off in your concussion management training.'
                  : 'Your concussion management training starts now.'}
              </p>
            </div>

            {/* Next Action — hero card */}
            <NextActionCard />

            {/* Bento Grid — stats + quick actions */}
            <BentoGrid accessLevel={accessLevel} workshopLocation={workshopLocation} onWorkshopNominated={setWorkshopLocationOverride} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
