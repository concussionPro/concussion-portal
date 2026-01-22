'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ReferenceRepository } from '@/components/dashboard/ReferenceRepository'
import { getCurrentUser } from '@/lib/auth'
import { useState, useEffect } from 'react'

export default function ReferencesPage() {
  const [isPaidUser, setIsPaidUser] = useState(false)

  useEffect(() => {
    // Check if user is authenticated (including demo users)
    const user = getCurrentUser()
    const paidStatus = localStorage.getItem('isPaidUser')

    // If logged in as demo or authenticated user, OR if they have paid status, grant access
    setIsPaidUser(!!user || paidStatus === 'true')
  }, [])

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-64 flex-1">
          <div className="px-8 py-10 max-w-[1400px]">
            <ReferenceRepository isPaidUser={isPaidUser} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
