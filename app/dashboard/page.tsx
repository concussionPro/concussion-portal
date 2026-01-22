'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { BentoGrid } from '@/components/dashboard/BentoGrid'
import { WelcomeModal } from '@/components/dashboard/WelcomeModal'
import { NextActionCard } from '@/components/dashboard/NextActionCard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <WelcomeModal />
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64">
          <div className="max-w-[1400px] mx-auto px-8 py-6">
            <NextActionCard />
            <BentoGrid />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
