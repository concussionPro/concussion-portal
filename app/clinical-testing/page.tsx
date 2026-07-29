'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { SstClinicCard } from '@/components/clinical/SstClinicCard'
import { ClinicProfileCard } from '@/components/clinical/ClinicProfileCard'
import { SstWatchVisual, BaselineLaptopVisual, InstrumentKeyframes } from '@/components/clinical/InstrumentVisuals'
import { TrackedOutbound } from '@/components/TrackedOutbound'
import { BaselineLaptopAnimation } from '@/components/platform/BaselineLaptopAnimation'
import { Lock, ArrowRight } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { useClinicalAccess } from '@/components/clinical/useClinicalAccess'
import { ClinicalTestingComingSoon } from '@/components/clinical/ClinicalTestingComingSoon'

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

function InstrumentTile({
  tag,
  title,
  body,
  cta,
  href,
  visual,
  variant = 'dark',
}: {
  tag: string
  title: string
  body: string
  cta: string
  href: string
  visual: React.ReactNode
  /** dark = live instrument (SST); light = clinical document (baseline) —
   *  deliberately opposite identities so the two never read as one product. */
  variant?: 'dark' | 'light'
}) {
  const dark = variant === 'dark'
  return (
    <Link
      href={href}
      className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5 ${
        dark
          ? 'bg-[#16243f] shadow-[0_18px_40px_-18px_rgba(22,36,63,0.55)]'
          : 'border border-slate-200 bg-white shadow-[0_18px_40px_-24px_rgba(100,116,139,0.45)]'
      }`}
    >
      {visual}
      <div>
        <p className={`m-0 text-[10px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-teal-300/90' : 'text-[#b45309]'}`}>{tag}</p>
        <h2 className={`m-0 mt-1 text-[20px] font-extrabold tracking-tight ${dark ? 'text-white' : 'text-[#16243f]'}`}>{title}</h2>
        <p className={`m-0 mt-1.5 text-[12.5px] leading-relaxed ${dark ? 'text-slate-300/90' : 'text-slate-500'}`}>{body}</p>
        <span className={`mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold transition-colors ${dark ? 'text-teal-300 group-hover:text-teal-200' : 'text-[#b45309] group-hover:text-[#92400e]'}`}>
          {cta}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

function Shell() {
  const { user, isLoading } = useSession()
  const access = useClinicalAccess()
  const isPreview = !user || user.accessLevel === 'preview'
  // The clinic code namespaces the clinic profile (unique per clinic).
  const [clinicCode, setClinicCode] = useState<string | null>(null)
  useEffect(() => {
    void fetch('/api/clinical-testing/clinic', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const c = d?.clinic?.code
        setClinicCode(typeof c === 'string' && c.trim() ? c : null)
      })
      .catch(() => setClinicCode(null))
  }, [])

  if (isLoading || access === 'loading') {
    return (
      <div className="flex min-h-screen dashboard-bg">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-8">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      </div>
    )
  }

  // NO-LOGIN ACCESS (owner 2026-07-29: "/clinical-testing accessible without
  // login and locks all other sections"): a session-less visitor is routed
  // through the demo door, which mints the scoped demo access — workspace
  // open, every other section locked by the demo model. Logged-in free users
  // keep the upgrade view below.
  if (!user && ((access as string) === 'none' || access === 'locked')) {
    if (typeof window !== 'undefined') window.location.replace('/demo/clinic')
    return (
      <div className="flex min-h-screen dashboard-bg">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-8">
          <p className="text-sm text-muted-foreground">Opening the demo workspace…</p>
        </main>
      </div>
    )
  }

  // PRE-RELEASE (owner directive 2026-07-05): only the owner's test dash
  // sees the suite until the subscription launch — regardless of tier.
  if (access === 'unreleased') {
    return <ClinicalTestingComingSoon />
  }

  if (access === 'locked') {
    return (
      <div className="flex min-h-screen dashboard-bg">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
          <div className="max-w-2xl mx-auto">
            {/* SHOW-THEN-SELL (2026-07-05): the real instruments, then the ask —
                generic lock cards demonstrated zero value (conversion audit). */}
            <div className="glass-premium rounded-2xl p-6 sm:p-8">
              <div className="text-center mb-6">
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-700 mb-2">
                  <Lock className="mb-0.5 mr-1 inline h-3 w-3" /> Included with your CCM or CRM enrolment
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
                  Your patient instruments
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                  This is the real suite paying members run: a clinic code of your own, measured-
                  threshold exercise rehab on the patient&rsquo;s watch, and club-wide SCAT6
                  baselines with reports to your inbox.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-6">
                <div className="rounded-2xl bg-[#16243f] p-4">
                  <SstWatchVisual />
                  <p className="mt-3 mb-0 text-[13px] font-bold text-white">SST Trainer</p>
                  <p className="mt-0.5 mb-0 text-xs text-slate-300/90">Measured threshold → 80–90% band → verified sessions → recovery trajectory.</p>
                  <a href="/sst-trainer" target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block text-xs font-bold text-teal-300 hover:text-teal-200">
                    Try the patient demo →
                  </a>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <BaselineLaptopVisual />
                  <p className="mt-3 mb-0 text-[13px] font-bold text-[#16243f]">Pre-Season Baseline</p>
                  <p className="mt-0.5 mb-0 text-xs text-slate-500">One club link · ~5 min per athlete · PDF report to your clinic.</p>
                  <a href="/preseason/b/DEMO00" target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block text-xs font-bold text-[#b45309] hover:text-[#92400e]">
                    Run the athlete demo →
                  </a>
                </div>
              </div>
              <div className="text-center">
                <a
                  href={CONFIG.SHOP_URL}
                  className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors shadow-md"
                >
                  Unlock with Concussion Clinical Mastery
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
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
        @keyframes ct-tick { 0%, 12% { background: #fff; color: #475569; border-color: #e2e8f0 } 16%, 80% { background: #0d7377; color: #fff; border-color: #0d7377 } 90%, 100% { background: #fff; color: #475569; border-color: #e2e8f0 } }
      `}</style>
      <Sidebar />
      <InstrumentKeyframes />
      <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
        <div className="mx-auto max-w-4xl">
          {/* Demo orientation (ACC prospects, 2026-07-28): say what they're
              looking at and give the tour an ending — the booking. Closes the
              tour-no-booking gap before the sends land. */}
          {access === 'demo' && (
            <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-teal-200 bg-teal-50/80 px-5 py-4">
              <p className="m-0 flex-1 basis-[300px] text-[13.5px] leading-snug text-slate-700">
                <strong className="text-slate-900">This is the live clinician workspace</strong> — the
                product your team would run, on fabricated data. Start with the SST Trainer tile;
                the sample ACC884 compiles from what you&rsquo;ll see.
              </p>
              <TrackedOutbound
                href="https://cal.com/zac-lewis-so8zjs/30min"
                event="cal_click"
                source="demo-workspace"
                className="rounded-xl bg-teal-700 px-5 py-2.5 text-[13px] font-bold leading-none text-white hover:bg-teal-800 transition-colors"
              >
                Book 30 minutes
              </TrackedOutbound>
            </div>
          )}
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
              visual={<SstWatchVisual />}
            />
            <InstrumentTile
              tag="SCAT6 baseline · self-administered"
              title="Pre-Season Baseline"
              body="One link covers a whole club: athletes self-complete the SCAT6 baseline in ~5 minutes, a PDF report reaches your inbox per athlete, and the record is on file for the day you need it."
              cta="Open Baseline Testing"
              href="/clinical-testing/baseline"
              visual={<BaselineLaptopAnimation />}
              variant="light"
            />
          </div>

          <div className="mb-5">
            <ClinicProfileCard clinicCode={clinicCode} />
          </div>

          <SstClinicCard />

          {/* Demo viewers ONLY (owner 2026-07-28): the tour's "now what" —
              indicative commercials + the path, mirroring /acc. Paying users
              never see this: their tools are included with enrolment. */}
          {access === 'demo' && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-teal-200 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                <div className="p-5">
                  <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Indicative commercials</p>
                  <p className="m-0 mt-1.5 text-xl font-extrabold tracking-tight text-slate-900">
                    NZ$49<span className="text-[12px] font-semibold text-slate-500"> / delivering clinician / month</span>
                  </p>
                  <p className="m-0 mt-1 text-[12px] leading-snug text-slate-600">
                    Both instruments, Gensolve filing, org licence. Training seats NZ$895 → $425 at 40+, one-off,
                    across the allied team — physios, osteos and OTs (OA-endorsed) and exercise physiologists
                    (ESSA-accredited, 16 CPD). Final commercials sized per organisation.
                  </p>
                </div>
                <div className="flex flex-col items-start justify-center gap-2.5 p-5 bg-teal-50/60">
                  <p className="m-0 text-[13px] font-bold leading-snug text-slate-900">
                    Next: a 30-minute scoping call, then full onboarding — team trained and certificated,
                    instruments live on your clinic code, Gensolve connected.
                  </p>
                  <TrackedOutbound
                    href="https://cal.com/zac-lewis-so8zjs/30min"
                    event="cal_click"
                    source="demo-workspace-pricing"
                    className="rounded-xl bg-teal-700 px-5 py-2.5 text-[13px] font-bold leading-none text-white hover:bg-teal-800 transition-colors"
                  >
                    Book 30 minutes
                  </TrackedOutbound>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
