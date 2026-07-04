'use client'

import { useEffect, useState } from 'react'
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

/** Apple-Watch mockup running a live SST session — the tile shows WHAT IT
 *  IS: the program on the patient's wrist. Real ticking bpm, zone state and
 *  session ring (respects nothing fancier than opacity/width transitions). */
function SstWatchVisual() {
  const [bpm, setBpm] = useState(121)
  useEffect(() => {
    const iv = setInterval(() => {
      setBpm((b) => {
        const next = b + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.3 ? 2 : 1)
        return Math.min(131, Math.max(112, next))
      })
    }, 1100)
    return () => clearInterval(iv)
  }, [])
  const inBand = bpm >= 114 && bpm <= 128
  return (
    <div className="relative flex h-full min-h-[230px] items-center justify-center overflow-hidden rounded-xl bg-[#0d1830] py-4">
      {/* ambient glow */}
      <div className="absolute h-44 w-44 rounded-full bg-teal-400/10 blur-2xl" />

      {/* the watch: one connected column (strap–case–strap), so the tile can
          be any height without the straps detaching from the case */}
      <div className="relative z-10 flex flex-col items-center">
        {/* top strap: tapers into the lugs */}
        <div className="h-[34px] w-[58px] rounded-t-[12px] bg-gradient-to-b from-[#2a3a58] to-[#1d2b47]" />
        <div className="-mt-[2px] h-[8px] w-[74px] rounded-t-[10px] bg-[#151f36]" />

        {/* case — dark aluminium bezel with a highlight edge */}
        <div className="relative -mt-[1px] h-[152px] w-[128px] rounded-[38px] bg-gradient-to-b from-slate-500 via-slate-700 to-slate-800 p-[3px] shadow-[0_18px_40px_-14px_rgba(0,0,0,.85)]">
          {/* digital crown + side button, protruding from the case edge */}
          <span className="absolute -right-[6px] top-[30px] h-[22px] w-[8px] rounded-[3px] bg-gradient-to-b from-slate-300 via-slate-500 to-slate-600 shadow-[1px_1px_2px_rgba(0,0,0,.5)]" />
          <span className="absolute -right-[4px] top-[64px] h-[30px] w-[5px] rounded-[2.5px] bg-gradient-to-b from-slate-500 to-slate-700" />

          {/* black glass inset */}
          <div className="relative h-full w-full overflow-hidden rounded-[35px] bg-black p-[6px]">
            {/* screen */}
            <div className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-[29px] bg-[#060b16] px-2.5 py-2.5">
              {/* glass reflection */}
              <div className="pointer-events-none absolute -left-6 -top-10 h-24 w-24 rotate-[24deg] rounded-full bg-white/[0.05]" />
              <div className="flex w-full items-center justify-between">
                <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-slate-500">SST</span>
                <span className="font-mono text-[7px] text-slate-500">14:32</span>
              </div>
              <div className="text-center">
                <p className="m-0 font-mono text-[30px] font-bold leading-none text-teal-300 transition-opacity">
                  {bpm}
                </p>
                <p className={`m-0 mt-0.5 text-[7px] font-bold uppercase tracking-[0.14em] ${inBand ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {inBand ? 'in band' : 'ease off'}
                </p>
              </div>
              {/* band bar with live marker */}
              <div className="w-full">
                <div className="relative h-[5px] w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="absolute inset-y-0 left-[30%] w-[45%] bg-teal-500/50" />
                  <span
                    className="absolute top-1/2 h-[9px] w-[2.5px] -translate-y-1/2 rounded-full bg-white transition-[left] duration-700"
                    style={{ left: `${Math.min(94, Math.max(4, ((bpm - 100) / 40) * 100))}%` }}
                  />
                </div>
                <p className="m-0 mt-1 text-center font-mono text-[6.5px] text-slate-500">band 114–128 · HRt 142</p>
              </div>
            </div>
          </div>
        </div>

        {/* bottom strap */}
        <div className="-mb-[2px] h-[8px] w-[74px] rounded-b-[10px] bg-[#151f36]" />
        <div className="-mt-[1px] h-[34px] w-[58px] rounded-b-[12px] bg-gradient-to-t from-[#2a3a58] to-[#1d2b47]" />
      </div>

      <span className="absolute bottom-2.5 right-3 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
        On their wrist · or any watch via the phone app
      </span>
    </div>
  )
}

/** Laptop mockup mid-baseline — the tile shows WHAT IT IS: an athlete
 *  self-completing the SCAT6 on any computer. Checkboxes tick in sequence
 *  via staggered CSS keyframes. */
function BaselineLaptopVisual() {
  const words = ['Jacket', 'Pepper', 'Cotton', 'Dollar', 'Mirror']
  return (
    <div className="relative flex h-full min-h-[210px] flex-col items-center justify-end overflow-hidden rounded-xl bg-gradient-to-b from-[#eef4f4] to-[#dde8e8] pt-4">
      {/* screen */}
      <div className="relative z-10 w-[78%] rounded-t-[10px] border border-slate-300 border-b-0 bg-white shadow-[0_14px_30px_-16px_rgba(51,65,85,.5)]">
        {/* browser chrome */}
        <div className="flex items-center gap-1 rounded-t-[9px] border-b border-slate-200 bg-slate-100 px-2 py-[5px]">
          <span className="h-[5px] w-[5px] rounded-full bg-red-300" />
          <span className="h-[5px] w-[5px] rounded-full bg-amber-300" />
          <span className="h-[5px] w-[5px] rounded-full bg-emerald-300" />
          <span className="mx-auto rounded bg-white px-2 py-[2px] font-mono text-[6px] text-slate-400">
            /preseason/b/YOURCODE
          </span>
        </div>
        <div className="px-3 py-2.5">
          <div className="mb-1.5 flex gap-[3px]">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <span key={n} className={`h-[3px] flex-1 rounded-full ${n <= 3 ? 'bg-[#0d7377]' : 'bg-slate-200'}`} />
            ))}
          </div>
          <p className="m-0 text-[7px] font-bold text-slate-700">Step 3 of 6 · Immediate memory</p>
          <p className="m-0 mb-1.5 text-[6px] text-slate-400">Select the words you remember</p>
          <div className="flex flex-wrap gap-1">
            {words.map((w, i) => (
              <span
                key={w}
                className="rounded-[4px] border border-slate-200 px-1.5 py-[3px] text-[6.5px] font-semibold text-slate-600"
                style={{ animation: `ct-tick 4.5s ease-in-out ${i * 0.7}s infinite` }}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* deck */}
      <div className="relative z-10 h-[9px] w-[92%] rounded-b-[8px] rounded-t-[2px] bg-gradient-to-b from-slate-200 to-slate-300 shadow-[0_6px_14px_-6px_rgba(51,65,85,.4)]">
        <span className="absolute left-1/2 top-0 h-[3px] w-[14%] -translate-x-1/2 rounded-b-[3px] bg-slate-300" />
      </div>
      <span className="absolute right-3 top-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
        Any computer · no app · ~5 min
      </span>
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
        @keyframes ct-tick { 0%, 12% { background: #fff; color: #475569; border-color: #e2e8f0 } 16%, 80% { background: #0d7377; color: #fff; border-color: #0d7377 } 90%, 100% { background: #fff; color: #475569; border-color: #e2e8f0 } }
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
              visual={<SstWatchVisual />}
            />
            <InstrumentTile
              tag="SCAT6 baseline · self-administered"
              title="Pre-Season Baseline"
              body="One link covers a whole club: athletes self-complete the SCAT6 baseline in ~5 minutes, a PDF report reaches your inbox per athlete, and the record is on file for the day you need it."
              cta="Open Baseline Testing"
              href="/clinical-testing/baseline"
              visual={<BaselineLaptopVisual />}
              variant="light"
            />
          </div>

          <SstClinicCard />
        </div>
      </main>
    </div>
  )
}
