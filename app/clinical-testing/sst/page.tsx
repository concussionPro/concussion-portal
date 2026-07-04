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
      <main className="ml-0 flex h-full min-w-0 flex-1 flex-col md:ml-64">
        {/* slim workspace header */}
        <div className="flex flex-none items-center gap-3 border-b border-slate-200/70 bg-white/70 px-4 py-2.5 backdrop-blur sm:px-6">
          <Link
            href="/clinical-testing"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Clinical Testing
          </Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-sm font-bold tracking-tight text-foreground">SST Trainer</h1>
        </div>

        {/* landscape workspace. grid-rows-[minmax(0,1fr)] is LOAD-BEARING:
            without it the row grows to the app's full height and everything
            below the fold is clipped unreachable inside overflow-hidden. */}
        <div className="min-h-0 flex-1 px-4 py-4 sm:px-6">
          <div className="mx-auto grid h-full max-w-[1120px] grid-cols-1 grid-rows-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(380px,450px)_minmax(0,1fr)]">
            {/* the app, in a device frame that scrolls internally */}
            <div className="h-full min-h-0 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-[#f7fafa] shadow-[0_18px_40px_-22px_rgba(22,36,63,0.4)]">
              <PlatformApp />
            </div>
            {/* clinician rail: clinic panel + chair-side runbook */}
            <div className="hidden h-full min-h-0 flex-col gap-5 overflow-y-auto overscroll-contain pb-2 pr-1 lg:flex">
              <SstClinicCard />
              <RunbookCard />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

/** Chair-side runbook — fills the clinician rail with the actual workflow
 *  instead of dead space. */
function RunbookCard() {
  const steps = [
    {
      n: '1',
      title: 'Pair the patient’s watch',
      body: 'Broadcast mode on their Garmin/Polar/WHOOP or a chest strap — the app walks them through it. No wearable? Manual entry runs everything (it just never advances the band).',
    },
    {
      n: '2',
      title: 'Run the graded test with them',
      body: 'Use the app on the left, or their phone. One symptom score a minute; the test ends itself at a 3-point rise — that heart rate is their measured threshold, and the 80–90% band is prescribed on the spot.',
    },
    {
      n: '3',
      title: 'Send them home with your code',
      body: 'QR or emailed invite from the panel above. Home sessions stream live to your Clinical Hub while they train, and verified clean sessions step the band up automatically.',
    },
    {
      n: '4',
      title: 'Review the trajectory',
      body: 'The serial measured-threshold curve is the recovery instrument — flares, holds and re-tests all land in your hub with flags for review.',
    },
  ]
  return (
    <div className="glass-premium rounded-2xl p-6">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
        Chair-side runbook
      </p>
      <h2 className="mb-4 text-base font-bold tracking-tight text-foreground">
        A patient through the flow, start to finish
      </h2>
      <div className="flex flex-col gap-4">
        {steps.map((s) => (
          <div key={s.n} className="flex items-start gap-3">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-[#16243f] text-[12px] font-bold text-white">
              {s.n}
            </span>
            <div>
              <p className="m-0 text-[13px] font-bold text-foreground">{s.title}</p>
              <p className="m-0 mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
