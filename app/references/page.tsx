'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ReferenceRepository } from '@/components/dashboard/ReferenceRepository'
import { useState, useEffect } from 'react'
import { checkUserAccess } from '@/lib/secure-access'

export default function ReferencesPage() {
  const [isPaidUser, setIsPaidUser] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // SERVER-SIDE access validation - secure and tamper-proof
    async function validateAccess() {
      const { accessLevel } = await checkUserAccess()
      setIsPaidUser(accessLevel === 'full-course')
      setLoading(false)
    }
    validateAccess()
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar />
          <main className="ml-64 flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5b9aa6] mx-auto mb-4"></div>
              <p className="text-slate-600">Loading...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

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
