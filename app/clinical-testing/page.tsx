'use client'

import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { SstClinicCard } from '@/components/clinical/SstClinicCard'
import { Lock, ArrowRight } from 'lucide-react'
import { CONFIG } from '@/lib/config'

/**
 * /clinical-testing — flagship surface. The two live patient instruments as
 * concept-driven product tiles (instrument-grade: dark panels, a live ECG
 * trace, real protocol numbers) — each directing to its own baked-in portal
 * page — with the clinic-code card doing the operational work below.
 */
export default function ClinicalTestingPage() {
  return (
    <SessionProvider>
      <ProtectedRoute>
        <Shell />
      </ProtectedRoute>
    </SessionProvider>
  )
}

/** Animated ECG trace + measured band — the SST tile's visual identity. */
function SstInstrumentVisual() {
  return (
    <div className="relative h-full min-h-[190px] overflow-hidden rounded-xl bg-[#0d1830]">
      <div className="absolute inset-x-0 top-[38%] h-[26%] border-y border-teal-400/25 bg-teal-400/10" />
      <span className="absolute left-3 top-[26%] text-[9px] font-bold uppercase tracking-[0.14em] text-red-300/80">
        threshold 142
      </span>
      <span className="absolute left-3 top-[67%] text-[9px] font-bold uppercase tracking-[0.14em] text-teal-300/80">
        band 114–128
      </span>
      <svg viewBox="0 0 300 120" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <path
          d="M0 62 L30 62 L38 58 L46 66 L54 62 L66 62 L72 30 L78 88 L84 62 L120 62 L128 58 L136 66 L144 62 L156 62 L162 32 L168 86 L174 62 L210 62 L218 58 L226 66 L234 62 L246 62 L252 30 L258 88 L264 62 L300 62"
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ strokeDasharray: 640, strokeDashoffset: 640, animation: 'ct-trace 3.2s linear infinite' }}
        />
      </svg>
      <div className="absolute right-3 top-3 text-right">
        <p
          className="m-0 font-mono text-[30px] font-bold leading-none text-teal-300"
          style={{ animation: 'ct-pulse 1s ease-in-out infinite' }}
        >
          121
        </p>
        <p className="m-0 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">bpm · in band</p>
      </div>
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full bg-emerald-400"
          style={{ animation: 'ct-pulse 1s ease-in-out infinite' }}
        />
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">live · verified</span>
      </div>
    </div>
  )
}

/** SCAT6 score-summary motif — the baseline tile's visual identity. */
function BaselineInstrumentVisual() {
  const recall = [1, 1, 1, 0, 1, 0, 1, 1, 0, 1] // 7/10 chips
  return (
    <div className="relative flex h-full min-h-[190px] flex-col justify-between overflow-hidden rounded-xl bg-[#0d1830] p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="m-0 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Symptom severity</p>
          <p className="m-0 font-mono text-[26px] font-bold leading-tight text-teal-300">
            4<span className="text-[13px] text-slate-500">/132</span>
          </p>
        </div>
        <div className="text-right">
          <p className="m-0 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Baseline</p>
          <p className="m-0 font-mono text-[13px] font-bold text-emerald-400">ON FILE</p>
        </div>
      </div>
      <div>
        <p className="m-0 mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Delayed recall · 7/10
        </p>
        <div className="flex gap-1">
          {recall.map((f, i) => (
            <span key={i} className={`h-2.5 flex-1 rounded-sm ${f ? 'bg-teal-400/80' : 'bg-slate-600/50'}`} />
          ))}
        </div>
      </div>
      <div>
        <p className="m-0 mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Report</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-teal-400/15 px-2 py-1 font-mono text-[10px] font-bold text-teal-300">
            PDF → clinic inbox
          </span>
          <span className="rounded-md bg-slate-700/60 px-2 py-1 font-mono text-[10px] font-bold text-slate-300">
            repeat-test ready
          </span>
        </div>
      </div>
    </div>
  )
}

function InstrumentTile({
  tag,
  title,
  body,
  cta,
  href,
  visual,
}: {
  tag: string
  title: string
  body: string
  cta: string
  href: string
  visual: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-[#16243f] p-5 shadow-[0_18px_40px_-18px_rgba(22,36,63,0.55)] transition-transform duration-200 hover:-translate-y-0.5"
    >
      {visual}
      <div>
        <p className="m-0 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-300/90">{tag}</p>
        <h2 className="m-0 mt-1 text-[20px] font-extrabold tracking-tight text-white">{title}</h2>
        <p className="m-0 mt-1.5 text-[12.5px] leading-relaxed text-slate-300/90">{body}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-teal-300 transition-colors group-hover:text-teal-200">
          {cta}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
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
                Clinical Testing
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-lg mx-auto">
                The live patient instruments — your own clinic code, the SST Trainer (measured
                heart-rate-threshold exercise rehab), and self-administered pre-season SCAT6
                baseline testing for your clubs and teams.
              </p>
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
      <style>{`
        @keyframes ct-trace { from { stroke-dashoffset: 640 } to { stroke-dashoffset: 0 } }
        @keyframes ct-pulse { 0%,100% { opacity: 1 } 50% { opacity: .55 } }
      `}</style>
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                Clinical testing
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Your patient instruments
              </h1>
            </div>
            <p className="max-w-[340px] text-[12.5px] leading-snug text-muted-foreground">
              One clinic code powers both — hand it to a patient or a whole club, and the results
              flow back to you.
            </p>
          </div>

          {/* the two instruments, side by side, each its own baked-in portal */}
          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <InstrumentTile
              tag="Exercise rehab · measured threshold"
              title="SST Trainer"
              body="The graded test measures where symptoms actually begin; patients train at 80–90% of it with live heart rate from their own watch, and every verified session builds the recovery trajectory."
              cta="Open the SST Trainer"
              href="/clinical-testing/sst"
              visual={<SstInstrumentVisual />}
            />
            <InstrumentTile
              tag="SCAT6 baseline · self-administered"
              title="Pre-Season Baseline"
              body="One link covers a whole club: athletes self-complete the SCAT6 baseline in ~5 minutes, a PDF report reaches your inbox per athlete, and the record is on file for the day you need it."
              cta="Open Baseline Testing"
              href="/clinical-testing/baseline"
              visual={<BaselineInstrumentVisual />}
            />
          </div>

          <SstClinicCard />
        </div>
      </main>
    </div>
  )
}
