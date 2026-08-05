'use client'

/**
 * Client shell for /clinical-testing/documents. The paid discharge templates
 * are NOT imported here — the server page resolves entitlement and passes them
 * as `content` (null when unentitled), so the template text only ever travels
 * in the RSC payload of a paid request, never in a public static chunk. This
 * file keeps only the interactive parts: clinic/patient autofill, the access
 * gate screens, and the FillableDoc renderer.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { useClinicalAccess } from '@/components/clinical/useClinicalAccess'
import { ClinicalTestingComingSoon } from '@/components/clinical/ClinicalTestingComingSoon'
import { ClinicalToolkitDoc } from '@/components/toolkit/ClinicalToolkitDoc'
import {
  loadClinicProfile,
  cacheClinicProfile,
  toClinicProfile,
  EMPTY_CLINIC_PROFILE,
  type ClinicProfile,
} from '@/components/clinical/ClinicProfileCard'
import type { DischargeTemplate } from '@/data/hub-program-content'
import { Lock, ArrowRight, FileText, ChevronLeft } from 'lucide-react'
import { SST_TIER_FROM_AUD, SST_TRIAL_PATIENT_CAP } from '@/lib/config'

export interface DocumentsContent {
  templates: DischargeTemplate[]
  principles: { title: string; body: string[] }
}

type Clinic = { code: string; clinicName: string; viewKey: string }

export function DocumentsClient({ content }: { content: DocumentsContent | null }) {
  return (
    <SessionProvider>
      <ProtectedRoute>
        <Shell content={content} />
      </ProtectedRoute>
    </SessionProvider>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">{children}</main>
    </div>
  )
}

function Shell({ content }: { content: DocumentsContent | null }) {
  const { isLoading } = useSession()
  const access = useClinicalAccess()
  const [clinic, setClinic] = useState<Clinic | null | undefined>(undefined)
  // ?patient=<label>&ref=<install UUID> (from the patient list) → pre-fill the
  // docs from their measured SST episode. Read off the URL to avoid a Suspense
  // boundary.
  const [patientLabel, setPatientLabel] = useState<string | null>(null)
  const [patientRef, setPatientRef] = useState<string | null>(null)
  const [sstFields, setSstFields] = useState<Record<string, string>>({})
  const [summaryState, setSummaryState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  // Clinic master profile. The SERVER copy is the master (one input across every
  // seat and device — /api/sst/report already builds the letterhead from it);
  // localStorage is only an offline cache. Reading the cache alone meant a
  // second practitioner or a second device printed a blank letterhead while the
  // hub's own reports rendered fully (2026-08-05 crawl #2).
  const [profile, setProfile] = useState<ClinicProfile>(EMPTY_CLINIC_PROFILE)

  useEffect(() => {
    void fetch('/api/clinical-testing/clinic', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const c: Clinic | null = d?.clinic ?? null
        setClinic(c)
        if (d?.profile) {
          const server = toClinicProfile(d.profile)
          setProfile(server)
          cacheClinicProfile(c?.code ?? null, server)
        } else if (c?.code) {
          // No server profile (not set yet, or this request couldn't read it) —
          // fall back to whatever this device cached for THIS clinic.
          setProfile(loadClinicProfile(c.code))
        }
      })
      .catch(() => {
        setClinic(null)
      })
    const sp = new URLSearchParams(window.location.search)
    const p = sp.get('patient')
    const r = sp.get('ref')
    setPatientLabel(p && p.trim() ? p.trim() : null)
    setPatientRef(r && r.trim() ? r.trim() : null)
  }, [])

  // Fetch the patient's objective SST summary → autofill the WorkCover/NDIS/GP
  // merge fields (measured HRt, band, sessions, trajectory). `ref` is the
  // install UUID and is what actually identifies the patient when two share a
  // display name — without it the lookup 404'd and the banner said "loading
  // measured data…" forever (crawl #3).
  useEffect(() => {
    if (!patientLabel || !clinic?.code || !clinic?.viewKey) return
    setSummaryState('loading')
    void fetch(
      `/api/sst/patient-summary?code=${encodeURIComponent(clinic.code)}&k=${encodeURIComponent(clinic.viewKey)}&patient=${encodeURIComponent(patientLabel)}${
        patientRef ? `&ref=${encodeURIComponent(patientRef)}` : ''
      }`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.mergeFields) {
          setSstFields(d.mergeFields)
          setSummaryState('ready')
        } else {
          setSummaryState('error')
        }
      })
      .catch(() => setSummaryState('error'))
  }, [patientLabel, patientRef, clinic])

  if (isLoading || access === 'loading') {
    return <Frame><p className="text-sm text-muted-foreground">Loading…</p></Frame>
  }
  if (access === 'unreleased') return <ClinicalTestingComingSoon />
  if (access === 'locked' || access === 'demo') {
    return (
      <Frame>
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <Lock className="mx-auto mb-3 h-6 w-6 text-amber-600" />
          <h1 className="text-2xl font-bold">Clinical Testing</h1>
          <p className="mt-2 text-sm text-muted-foreground">Unlock the Clinical Testing suite to access clinic documents.</p>
        </div>
      </Frame>
    )
  }

  // Entitled to the suite (owner | course | sst). Documents require a PAID
  // plan — the server already decided: `content` is null unless owner/active.

  return (
    <Frame>
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Link href="/clinical-testing" className="inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeft className="h-3.5 w-3.5" /> Clinical Testing
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-foreground">Documents</span>
        </div>

        {clinic === undefined ? (
          <p className="text-sm text-muted-foreground">Loading your clinic…</p>
        ) : !content ? (
          <DocumentsPaywall clinicName={clinic?.clinicName ?? null} />
        ) : (
          <>
            {profile.clinic_name || profile.ahpra_number ? (
              <p className="mb-4 text-[12px] text-slate-500">
                Letterhead &amp; provider details fill from your{' '}
                <Link href="/clinical-testing" className="font-semibold text-teal-700 underline">clinic details</Link>.
              </p>
            ) : (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-800">
                Set your clinic details once on the{' '}
                <Link href="/clinical-testing" className="font-semibold underline">Clinical Testing home</Link>{' '}
                — they then fill every report here.
              </div>
            )}
            {patientLabel && (
              <div
                className={`mb-4 rounded-xl border px-4 py-2.5 text-[13px] ${
                  summaryState === 'error'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-teal-200 bg-teal-50 text-teal-800'
                }`}
              >
                {summaryState === 'error' ? (
                  <>
                    Couldn&rsquo;t load <strong>{patientLabel}</strong>&rsquo;s measured SST data — the
                    clinic and practitioner fields are filled, but every measured value below must be
                    entered by hand. Open this patient again from your{' '}
                    <Link href="/clinical-testing/patients" className="font-semibold underline">patient list</Link>{' '}
                    to retry.
                  </>
                ) : (
                  <>
                    Pre-filled from <strong>{patientLabel}</strong>&rsquo;s SST episode
                    {summaryState !== 'ready' && ' — loading measured data…'}
                  </>
                )}
              </div>
            )}
            <SstReportCallout />
            <ClinicalToolkitDoc
              // Remount when the patient changes, the async SST fields arrive, OR
              // the clinic profile changes, so the autofill takes effect (buyer
              // mode doesn't re-sync in place).
              key={`${patientLabel ?? 'none'}:${Object.keys(sstFields).length > 0 ? 'sst' : 'base'}:${Object.values(profile).join('|')}`}
              storageKey={`sst-docs:${patientLabel ?? 'clinic'}`}
              templates={content.templates}
              principles={content.principles}
              unlockHref="/clinical-testing/subscribe"
              requireSignoff
              defaultValues={{
                ...profile,
                date_of_assessment: today(),
                date: today(),
                review_date: '',
                ...(patientLabel ? { patient_name: patientLabel, participant_name: patientLabel } : {}),
                ...sstFields,
              }}
            />
          </>
        )}
      </div>
    </Frame>
  )
}

function today(): string {
  try {
    return new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return ''
  }
}

/** Link to the auto-generated, SST-data-filled episode report (also premium). */
function SstReportCallout() {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#eef4f4] text-[#3c7681]">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h2 className="m-0 text-[15px] font-bold text-foreground">SST episode report — generate at discharge</h2>
          <p className="m-0 mt-1 text-[13px] text-muted-foreground">
            The dashboard compiles each patient&rsquo;s data as it arrives. When you discharge them — or their
            measured threshold has recovered — you generate the episode report on demand: the trajectory,
            verified sessions, flare history and a clearance-or-extend recommendation, compiled to a
            review-and-sign PDF. Generate it per patient from your{' '}
            <Link href="/clinical-testing/patients" className="font-semibold text-teal-700 underline">patient list</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

/** The trial paywall — documents are the paid tier; the tool + data stay free. */
function DocumentsPaywall({ clinicName }: { clinicName: string | null }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#16243f] text-white">
        <Lock className="h-5 w-5" />
      </span>
      <h1 className="text-[22px] font-extrabold tracking-tight text-[#16243f]">Clinic documents are premium</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {clinicName ?? 'Your clinic'} runs the full tool on the free trial — the graded test, live training,
        and every patient&rsquo;s trajectory. The ready-to-sign documents come with a plan:
      </p>
      <ul className="mx-auto mt-4 max-w-sm space-y-1.5 text-left text-sm text-slate-600">
        {[
          'GP / referrer episode report & clearance referral',
          'WorkCover & NDIS allied-health reports',
          'School & sports-club return-to-play authorisations',
          'Parent / patient symptom & recovery plan',
        ].map((d) => (
          <li key={d} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-teal-500" />
            {d}
          </li>
        ))}
      </ul>
      <Link
        href="/clinical-testing/subscribe"
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-[#16243f] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        Unlock documents — subscribe <ArrowRight className="h-4 w-4" />
      </Link>
      {/* "locked for life" was the RETIRED founding model — lib/config.ts is
          explicit that founding pricing is not sold and must not reappear on any
          surface. Amount + trial allowance now derive from CONFIG. */}
      <p className="mt-3 text-xs text-slate-400">From A${SST_TIER_FROM_AUD}/month. First {SST_TRIAL_PATIENT_CAP} patients free.</p>
    </div>
  )
}
