'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { SstClinicCard } from '@/components/clinical/SstClinicCard'
import PlatformApp from '@/app/platform/app/page'
import Link from 'next/link'
import { Lock, ArrowRight, ChevronLeft } from 'lucide-react'
import { CONFIG } from '@/lib/config'

/**
 * /clinical-testing/sst — the SST Trainer's baked-in portal page.
 *
 * LANDSCAPE WORKSPACE, no page scroll: the app runs inside a fixed-height
 * device frame on the left (it scrolls internally, like the phone it is),
 * and the clinic panel — code, patient link, QR, invite, hub — fills the
 * right so the wide screen actually works for the clinician: run a patient
 * through the flow on the left, hand them the code from the right.
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
    <div className="flex h-screen overflow-hidden dashboard-bg">
      <Sidebar />
      <main className="ml-0 flex h-full min-w-0 flex-1 flex-col p-4 md:ml-64 sm:p-6">
        {/* compact header row */}
        <div className="mb-3 flex flex-none flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link
              href="/clinical-testing"
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Clinical Testing
            </Link>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <h1 className="hidden text-sm font-bold tracking-tight text-foreground sm:block">
              SST Trainer
            </h1>
          </div>
          <p className="hidden text-[11.5px] text-muted-foreground lg:block">
            Run the flow on the left · hand patients their code on the right
          </p>
        </div>

        {/* landscape workspace: device frame + clinic panel, no page scroll */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[minmax(360px,430px)_minmax(0,1fr)]">
          <div className="h-full min-h-0 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-[#f7fafa] shadow-[0_18px_40px_-22px_rgba(22,36,63,0.4)]">
            <PlatformApp />
          </div>
          <div className="hidden h-full min-h-0 overflow-y-auto overscroll-contain lg:block">
            <SstClinicCard />
          </div>
        </div>
      </main>
    </div>
  )
}
