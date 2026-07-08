'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { SstTrajectory, type TrajectoryPoint } from '@/components/sst-trainer/SstTrajectory'
import {
  Lock,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  Users,
  LayoutDashboard,
  Flag,
  FileText,
} from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { useClinicalAccess } from '@/components/clinical/useClinicalAccess'
import { ClinicalTestingComingSoon } from '@/components/clinical/ClinicalTestingComingSoon'

/**
 * /clinical-testing/patients — the clinician's client list, in the portal.
 *
 * Serial testing is the product (the measured-HRt curve is the instrument),
 * so the roster leads with exactly that: every patient on your clinic code,
 * their latest measured threshold + band, session volume, last activity and
 * clearance flags — and one tap expands the full serial-HRt trajectory
 * (provenance-labelled, verified-points-only) with their recent sessions.
 * Reads the same clinic-sessions API as the Clinical Hub, using the viewKey
 * fetched over the signed-in session — no keyed URL to hunt for.
 */
export default function PatientsPage() {
  return (
    <SessionProvider>
      <ProtectedRoute>
        <Shell />
      </ProtectedRoute>
    </SessionProvider>
  )
}

interface Clinic {
  code: string
  clinicName: string
  viewKey: string
}

interface PatientRow {
  name: string
  condition: string | null
  gpReportDue?: boolean
  hrt: number | null
  bandLow: number | null
  bandHigh: number | null
  hrtTrajectory: TrajectoryPoint[]
  sessions: Array<Record<string, unknown> & { date: string }>
  sessionCount: number
  clearanceReady: boolean
  lastActivity: string | null
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  const t = Date.parse(d)
  if (Number.isNaN(t)) return '—'
  return new Date(t).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function sessionFlare(s: Record<string, unknown>): boolean {
  if (s.flare === true) return true
  const pre = typeof s.preSymptom === 'number' ? s.preSymptom : null
  const peak = typeof s.peakSymptom === 'number' ? s.peakSymptom : null
  return pre != null && peak != null && peak - pre >= 2
}

function PatientCard({ patient, clinic }: { patient: PatientRow; clinic: Clinic }) {
  const [open, setOpen] = useState(false)
  const recent = [...patient.sessions].slice(-6).reverse()

  return (
    <div className="glass-premium rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 text-left"
      >
        <div className="min-w-[140px] flex-1">
          <p className="m-0 flex items-center gap-2 text-[14px] font-bold text-foreground">
            {patient.name}
            {patient.clearanceReady && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <Flag className="h-3 w-3" /> clearance review
              </span>
            )}
            {patient.gpReportDue && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                <FileText className="h-3 w-3" /> GP report due
              </span>
            )}
          </p>
          <p className="m-0 mt-0.5 text-[11px] capitalize text-muted-foreground">
            {patient.condition ?? 'concussion'} · last activity {fmtDate(patient.lastActivity)}
          </p>
        </div>
        <div className="text-right">
          <p className="m-0 font-mono text-[16px] font-bold text-foreground">
            {patient.hrt != null ? `${patient.hrt}` : '—'}
            <span className="text-[10px] font-medium text-muted-foreground"> HRt</span>
          </p>
          <p className="m-0 text-[10.5px] text-muted-foreground">
            {patient.bandLow != null && patient.bandHigh != null
              ? `band ${patient.bandLow}–${patient.bandHigh}`
              : 'no band yet'}
          </p>
        </div>
        <div className="text-right">
          <p className="m-0 font-mono text-[16px] font-bold text-foreground">{patient.sessionCount}</p>
          <p className="m-0 text-[10.5px] text-muted-foreground">sessions</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 flex-none text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-black/5 px-5 pb-5 pt-4">
          {/* the instrument: serial measured HRt with provenance */}
          <SstTrajectory points={patient.hrtTrajectory} />

          {/* Referring-practitioner report (owner 2026-07-06): auto-built from
              the episode — clearance referral or extend-plan recommendation. */}
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`/api/sst/gp-report?code=${encodeURIComponent(clinic.code)}&k=${encodeURIComponent(clinic.viewKey)}&patient=${encodeURIComponent(patient.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              {patient.clearanceReady ? 'GP report — clearance referral' : 'GP report — episode summary'}
            </a>
            {/* Full document suite, pre-filled from this patient's measured SST data */}
            <Link
              href={`/clinical-testing/documents?patient=${encodeURIComponent(patient.name)}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              Documents — WorkCover / NDIS / school…
            </Link>
          </div>

          {recent.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Recent sessions
              </p>
              <div className="flex flex-col gap-1">
                {recent.map((s, i) => {
                  const flare = sessionFlare(s)
                  const avg = typeof s.avgHeartRate === 'number' ? s.avgHeartRate : null
                  const verified = s.hrVerified === true || s.verified === true
                  return (
                    <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px]">
                      <span className="w-14 flex-none text-muted-foreground">{fmtDate(s.date)}</span>
                      <span className="w-20 flex-none font-mono font-semibold text-foreground">
                        {avg != null ? `${avg} avg` : '—'}
                      </span>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                          verified
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}
                      >
                        {verified ? 'verified' : 'unverified'}
                      </span>
                      {flare && (
                        <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          flare
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Shell() {
  const { user, isLoading } = useSession()
  const access = useClinicalAccess()
  const isPreview = !user || user.accessLevel === 'preview'
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [patients, setPatients] = useState<PatientRow[] | null>(null)
  const [state, setState] = useState<'loading' | 'no-clinic' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (isPreview) return
    void (async () => {
      try {
        const cRes = await fetch('/api/clinical-testing/clinic', { credentials: 'include' })
        const cData = cRes.ok ? await cRes.json() : null
        const c: Clinic | null = cData?.clinic ?? null
        if (!c) {
          setState('no-clinic')
          return
        }
        setClinic(c)
        const pRes = await fetch(
          `/api/sst/clinic-sessions?code=${encodeURIComponent(c.code)}&k=${encodeURIComponent(c.viewKey)}`,
        )
        if (!pRes.ok) throw new Error(`sessions ${pRes.status}`)
        const pData = await pRes.json()
        setPatients(pData.patients ?? [])
        setState('ready')
      } catch {
        setState('error')
      }
    })()
  }, [isPreview])

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
                Patients
              </h1>
              <p className="mx-auto mb-2 max-w-md text-[13px] text-muted-foreground leading-relaxed">
                Every patient on your code with their measured threshold, band, verified-session
                count and the serial-HRt recovery trajectory — the instrument your re-test
                decisions read from.
              </p>
              <a href="/clinical-hub" target="_blank" rel="noopener noreferrer" className="mb-5 inline-block text-xs font-bold text-accent">
                Preview the Clinical Hub with demo patients →
              </a>
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

  const hubUrl = clinic
    ? `/clinical-hub?clinic=${encodeURIComponent(clinic.code)}&k=${encodeURIComponent(clinic.viewKey)}`
    : ''

  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/clinical-testing"
            className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Clinical Testing
          </Link>

          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                {clinic?.clinicName ?? 'Your clinic'}
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Patients
              </h1>
            </div>
            {clinic && (
              <Link
                href={hubUrl}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Live hub view
              </Link>
            )}
          </div>

          {state === 'loading' && <p className="text-sm text-muted-foreground">Loading your patients…</p>}

          {state === 'error' && (
            <p className="text-sm font-semibold text-red-600">
              Couldn&rsquo;t load your patient list just now — refresh to retry.
            </p>
          )}

          {state === 'no-clinic' && (
            <div className="glass-premium rounded-2xl p-8 text-center">
              <Users className="mx-auto mb-3 h-6 w-6 text-accent" />
              <p className="mb-4 text-sm text-muted-foreground">
                Create your clinic code first — patients who onboard with it appear here
                automatically.
              </p>
              <Link
                href="/clinical-testing"
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-accent/90"
              >
                Create my clinic code
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {state === 'ready' && patients && patients.length === 0 && (
            <div className="glass-premium rounded-2xl p-8 text-center">
              <Users className="mx-auto mb-3 h-6 w-6 text-accent" />
              <p className="m-0 text-sm text-muted-foreground">
                No patients yet — hand out your code or send an invite from Clinical Testing, and
                their first graded test appears here.
              </p>
            </div>
          )}

          {state === 'ready' && patients && patients.length > 0 && (
            <div className="flex flex-col gap-3">
              {patients.map((p) => (
                clinic && <PatientCard key={p.name} patient={p} clinic={clinic} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
