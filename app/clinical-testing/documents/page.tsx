'use client'

/**
 * /clinical-testing/documents — the SST clinic DOCUMENT SUITE.
 *
 * PREMIUM: the ready-to-sign documents are the paid tier (owner 2026-07-08).
 * A trial clinic runs the tool + sees all data free; documents need an ACTIVE
 * plan. Paywalled below.
 *
 * ISOLATION (owner: "no other content unlocked"): this surface renders ONLY the
 * six discharge templates + a link to the SST report. It imports DISCHARGE_
 * TEMPLATES data and nothing from the course modules / reference / wider toolkit,
 * and links nowhere into course content — so an SST-entitled clinic gets exactly
 * these documents and no course access.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { useClinicalAccess } from '@/components/clinical/useClinicalAccess'
import { ClinicalTestingComingSoon } from '@/components/clinical/ClinicalTestingComingSoon'
import { ClinicalToolkitDoc } from '@/components/toolkit/ClinicalToolkitDoc'
import { DISCHARGE_TEMPLATES, DOCUMENTATION_PRINCIPLES } from '@/data/hub-program-content'
import { Lock, ArrowRight, FileText, ChevronLeft } from 'lucide-react'

type Clinic = { code: string; clinicName: string; viewKey: string }

export default function ClinicalTestingDocumentsPage() {
  return (
    <SessionProvider>
      <ProtectedRoute>
        <Shell />
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

function Shell() {
  const { user, isLoading } = useSession()
  const access = useClinicalAccess()
  const [clinic, setClinic] = useState<Clinic | null | undefined>(undefined)
  const [plan, setPlan] = useState<'trial' | 'active' | null>(null)
  // ?patient=<label> (from the patient list) → pre-fill the docs from their
  // measured SST episode. Read off the URL to avoid a Suspense boundary.
  const [patientLabel, setPatientLabel] = useState<string | null>(null)
  const [sstFields, setSstFields] = useState<Record<string, string>>({})

  useEffect(() => {
    void fetch('/api/clinical-testing/clinic', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setClinic(d?.clinic ?? null)
        setPlan(d?.usage?.plan ?? null)
      })
      .catch(() => setClinic(null))
    const p = new URLSearchParams(window.location.search).get('patient')
    setPatientLabel(p && p.trim() ? p.trim() : null)
  }, [])

  // Fetch the patient's objective SST summary → autofill the WorkCover/NDIS/GP
  // merge fields (measured HRt, band, sessions, trajectory).
  useEffect(() => {
    if (!patientLabel || !clinic?.code || !clinic?.viewKey) return
    void fetch(
      `/api/sst/patient-summary?code=${encodeURIComponent(clinic.code)}&k=${encodeURIComponent(clinic.viewKey)}&patient=${encodeURIComponent(patientLabel)}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.mergeFields) setSstFields(d.mergeFields) })
      .catch(() => {})
  }, [patientLabel, clinic])

  if (isLoading || access === 'loading') {
    return <Frame><p className="text-sm text-muted-foreground">Loading…</p></Frame>
  }
  if (access === 'unreleased') return <ClinicalTestingComingSoon />
  if (access === 'locked') {
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

  // Entitled to the suite (owner | course | sst). Documents require a PAID plan.
  const paid = access === 'owner' || plan === 'active'

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
        ) : !paid ? (
          <DocumentsPaywall clinicName={clinic?.clinicName ?? null} />
        ) : (
          <>
            {patientLabel && (
              <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-[13px] text-teal-800">
                Pre-filled from <strong>{patientLabel}</strong>&rsquo;s SST episode
                {Object.keys(sstFields).length === 0 && ' — loading measured data…'}
              </div>
            )}
            <SstReportCallout clinic={clinic} />
            <ClinicalToolkitDoc
              // Remount when the patient changes OR the async SST fields arrive,
              // so the autofill takes effect (buyer mode doesn't re-sync in place).
              key={`${patientLabel ?? 'none'}:${Object.keys(sstFields).length > 0 ? 'sst' : 'base'}`}
              storageKey={`sst-docs:${patientLabel ?? 'clinic'}`}
              templates={DISCHARGE_TEMPLATES}
              principles={DOCUMENTATION_PRINCIPLES}
              unlockHref="/clinical-testing/subscribe"
              defaultValues={{
                clinic_name: clinic?.clinicName ?? '',
                clinician_name: user?.name ?? '',
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
function SstReportCallout({ clinic }: { clinic: Clinic | null }) {
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
      <p className="mt-3 text-xs text-slate-400">Founding clinics lock A$49/month for life. First 3 patients free.</p>
    </div>
  )
}
