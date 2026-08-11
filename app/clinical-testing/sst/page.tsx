'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { SstClinicCard } from '@/components/clinical/SstClinicCard'
import PlatformApp from '@/app/platform/app/page'
import { clearState, getPendingSyncs } from '@/lib/sst-trainer/store'
import { flushPendingSyncs } from '@/lib/sst-trainer/clinic-sync'
import Link from 'next/link'
import { Lock, ArrowRight, ChevronLeft } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { useClinicalAccess } from '@/components/clinical/useClinicalAccess'
import { ClinicalTestingComingSoon } from '@/components/clinical/ClinicalTestingComingSoon'
import { SstWatchVisual } from '@/components/clinical/InstrumentVisuals'

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
  const access = useClinicalAccess()
  const isPreview = !user || user.accessLevel === 'preview'

  // The clinician's own clinic code — wire it straight into the embedded app so
  // the in-portal flow skips the Self-guided/Clinic-code chooser (patients never
  // use this page). Same GET the clinic panel uses.
  // undefined = still loading; null = no clinic provisioned yet; string = code.
  // We must NOT render the app until this resolves, or it briefly (or, on a
  // fetch failure, permanently) runs in self-guided mode with no clinic code —
  // and nothing the clinician runs would sync to their own hub.
  const [clinicCode, setClinicCode] = useState<string | null | undefined>(undefined)
  // bump to force-remount the embedded app for a fresh patient (see "New patient")
  const [resetSeq, setResetSeq] = useState(0)
  // The clinic code / sharing / runbook panel is SETUP reference. SHOWN by
  // default on load (you need the code / patient link to start a patient); the
  // "Hide setup" toggle collapses it once you're running a patient so the app
  // owns the width. Always open until a clinic code exists (you need it to provision).
  const [setupOpen, setSetupOpen] = useState(true)
  // DEMO mode: the rail duplicates what the demo already shows (the code is
  // pre-wired into the app, there is nothing to provision) and its practitioner
  // box was the widest thing on the screen. The app IS the demo — rail starts
  // hidden, one click brings it back.
  useEffect(() => {
    void fetch('/api/clinical-testing/clinic', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      // Response shape is { clinic: { code, ... }, usage } — read d.clinic.code,
      // NOT d.code (the earlier bug: always fell through to "set up your code").
      .then((d) => {
        const c = d?.clinic?.code
        // Demo clinic → the rail starts hidden (see comment above state).
        if (c === 'DEMO00') setSetupOpen(false)
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
              <div className="mx-auto mb-5 max-w-xs rounded-2xl bg-[#16243f] p-4 text-left">
                <SstWatchVisual />
                <p className="mt-3 mb-0 text-xs text-slate-300/90">The real app: measured threshold, live band, verified sessions.</p>
                {/* ?landing=1 — see /clinical-testing: plain /sst-trainer
                    resumes persisted state, so "Try the patient demo" handed a
                    returning clinician their own live session, not the demo. */}
                <a href="/sst-trainer?landing=1" target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-bold text-teal-300">Try the patient demo →</a>
              </div>
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
    // Below lg the workspace is a SCROLLING page, not a fixed viewport: the
    // setup rail (clinic code, patient link, QR, invite) stacks under the app
    // instead of being display:none — on a phone it was unreachable, which
    // made provisioning impossible there (2026-08-05 crawl #5).
    <div className="flex min-h-screen bg-[#dde7e8] lg:h-screen lg:overflow-hidden">
      <Sidebar />
      <main className="ml-0 flex min-h-screen min-w-0 flex-1 flex-col md:ml-64 lg:h-full lg:min-h-0">
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
          {clinicCode && (
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSetupOpen((o) => !o)}
                aria-pressed={setupOpen}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  setupOpen
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-slate-200 text-muted-foreground hover:text-foreground'
                }`}
              >
                {setupOpen ? 'Hide setup' : 'Clinic code & sharing'}
              </button>
              <button
                type="button"
                onClick={() => {
                  // This device persists ONE patient's state (sst:v1). "New
                  // patient" opens a FRESH FILE: the outgoing patient's tests
                  // and sessions are already in the Clinical Hub (every event
                  // syncs as it happens), so nothing clinical lives only here —
                  // the copy says so instead of reading like a data wipe
                  // (owner, 2026-08-11). Best-effort flush first so even a
                  // just-finished session lands before the slot clears; unsent
                  // events survive the clear regardless (2026-08-05) and keep
                  // retrying under the new patient.
                  void flushPendingSyncs()
                  const unsent = getPendingSyncs().length
                  const warning = unsent
                    ? `\n\n${unsent} unsent session${unsent === 1 ? '' : 's'} will keep retrying in the background — nothing is lost.`
                    : ''
                  if (
                    window.confirm(
                      `Start a new patient file on this device?\n\nThe current patient’s record is already in your Live Hub — their tests and sessions synced as they happened. This just frees the device for the next patient.${warning}`,
                    )
                  ) {
                    clearState({ preservePendingSyncs: true })
                    setResetSeq((n) => n + 1)
                  }
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                + New patient
              </button>
            </div>
          )}
        </div>

        {/* Landscape workspace (lg and up). The APP is the primary, growing
            column; the setup rail (code / sharing / runbook) is a fixed sidebar
            shown only when opened — forced open until a clinic code exists.
            lg:grid-rows-[minmax(0,1fr)] is LOAD-BEARING at desktop widths:
            without it the row grows to the app's full height and everything
            below the fold is clipped unreachable inside overflow-hidden. Below
            lg none of that applies — the page scrolls and the rail stacks. */}
        {(() => {
          const railOpen = setupOpen || !clinicCode
          return (
            <div className="min-h-0 flex-1 px-4 py-4 sm:px-6">
              <div
                className={`mx-auto grid w-full grid-cols-1 gap-6 lg:h-full lg:grid-rows-[minmax(0,1fr)] ${
                  railOpen ? 'max-w-[1600px] lg:grid-cols-[minmax(0,1fr)_360px]' : 'max-w-[1100px] lg:grid-cols-1'
                }`}
              >
                {/* the app — the primary column; the embedded app uses the width */}
                <div
                  className={`overflow-hidden rounded-2xl border border-slate-200 bg-[#f7fafa] shadow-[0_18px_40px_-22px_rgba(22,36,63,0.4)] lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain ${
                    // no code yet → keep this short on mobile so the setup rail
                    // (where they provision) is a thumb-scroll away, not a screen
                    clinicCode ? 'min-h-[60vh]' : 'min-h-0'
                  }`}
                >
                  {clinicCode === undefined ? (
                    <div className="flex h-full min-h-[320px] items-center justify-center p-8 text-sm text-muted-foreground">
                      Loading your clinic…
                    </div>
                  ) : clinicCode === null ? (
                    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 p-8 text-center">
                      <p className="text-sm font-semibold text-foreground">Set up your clinic code first</p>
                      <p className="max-w-[280px] text-xs text-muted-foreground">
                        Create it in the setup panel — beside this on a wide screen, just below on a phone or
                        tablet. Then the trainer runs here with every session syncing to your hub.
                      </p>
                    </div>
                  ) : (
                    <PlatformApp key={resetSeq} embeddedClinicCode={clinicCode} />
                  )}
                </div>
                {/* setup rail — code / sharing / runbook; only when open.
                    Stacks BELOW the app under lg (was display:none, which made
                    the clinic code, patient link, QR and invite unreachable on
                    a phone — and provisioning impossible). */}
                {railOpen && (
                  <div className="flex flex-col gap-5 pb-2 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
                    {/* Provisioning here must unblock the app column immediately
                        — otherwise the clinician creates their code and the app
                        still says "set up your clinic code first" until reload. */}
                    <SstClinicCard
                      onClinicResolved={(c) => setClinicCode(c?.code?.trim() ? c.code : null)}
                    />
                    <RunbookCard />
                  </div>
                )}
              </div>
            </div>
          )
        })()}
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
      title: 'Review the trajectory, sign the report',
      body: 'The serial measured-threshold curve is the recovery instrument — flares, holds and re-tests land in your hub with flags. At episode end the app writes the GP report (trajectory, symptom tables, measured evidence summary for the clinician’s decision) as a single-page PDF — you review and sign.',
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
