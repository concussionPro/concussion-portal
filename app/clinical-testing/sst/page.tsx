'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import PlatformApp from '@/app/platform/app/page'
import Link from 'next/link'
import { Lock, ArrowRight, ChevronLeft } from 'lucide-react'
import { CONFIG } from '@/lib/config'

/**
 * /clinical-testing/sst — the SST Trainer INSIDE the paid portal (owner
 * directive: tools work in the portal, no redirects). Renders the full app
 * (self-guided allowed — this is the paid surface) beside the dashboard
 * sidebar. Clinicians run it here to learn the flow or take a patient
 * through it chair-side; patients at home use the clinic-code link.
 */
export default function ClinicalTestingSstPage() {
  return (
    <SessionProvider>
      <ProtectedRoute>
        <Shell />
      </ProtectedRoute>
    </SessionProvider>
  )
}

function Shell() {
  const { user, isLoading } = useSession()
  const isPreview = !user || user.accessLevel === 'preview'

  if (isLoading) {
    return (
      <div className="flex min-h-screen dashboard-bg">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-8">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      </div>
    )
  }

  if (isPreview) {
    return (
      <div className="flex min-h-screen dashboard-bg">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="glass-premium rounded-2xl p-8 sm:p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-700 mb-2">
                Paid course content
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
                SST Trainer
              </h1>
              <a
                href={CONFIG.SHOP_URL}
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors shadow-md"
              >
                Unlock with Concussion Clinical Mastery
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="px-4 pt-4">
          <Link
            href="/clinical-testing"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Clinical Testing
          </Link>
        </div>
        {/* The app brings its own shell (header, progress, 480px column). */}
        <PlatformApp />
      </main>
    </div>
  )
}
