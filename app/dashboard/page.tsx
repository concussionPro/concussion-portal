'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { BentoGrid } from '@/components/dashboard/BentoGrid'
import { WelcomeModal } from '@/components/dashboard/WelcomeModal'
import { NextActionCard } from '@/components/dashboard/NextActionCard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function DashboardPage() {
  useAnalytics() // Track page views

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
