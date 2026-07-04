'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { SstPatientQrCard } from '@/components/sst-trainer/SstPatientQrCard'
import {
  Lock,
  ArrowRight,
  HeartPulse,
  ClipboardList,
  Copy,
  Check,
  QrCode,
  Send,
  Loader2,
  LayoutDashboard,
} from 'lucide-react'
import { CONFIG } from '@/lib/config'

/**
 * /clinical-testing — the live patient instruments, run INSIDE the portal
 * (owner directives 2026-07-04: primary in the toolkit; no redirects; make
 * the code handoff smooth).
 *
 * Leads with "Your clinic code": provision in one step, then everything the
 * sweep found missing lives right here — the code, the patient link with
 * copy, the QR card, an email-the-patient input, and the private Clinical
 * Hub link. One code powers BOTH tools (SST + pre-season baseline share the
 * clinic registry).
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

interface Clinic {
  code: string
  clinicName: string
  viewKey: string
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        })
      }}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  )
}

function ClinicCard() {
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [clinicName, setClinicName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [showQr, setShowQr] = useState(false)
  // patient invite
  const [patientEmail, setPatientEmail] = useState('')
  const [inviteState, setInviteState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    void fetch('/api/clinical-testing/clinic', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setClinic(d?.clinic ?? null))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const create = useCallback(async () => {
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/clinical-testing/clinic', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicName: clinicName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Something went wrong.')
      setClinic(data.clinic)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setCreating(false)
    }
  }, [clinicName])

  const invite = useCallback(async () => {
    setInviteState('sending')
    setInviteError('')
    try {
      const res = await fetch('/api/clinical-testing/invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientEmail: patientEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Send failed.')
      setInviteState('sent')
      setPatientEmail('')
      setTimeout(() => setInviteState('idle'), 2500)
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : 'Send failed.')
      setInviteState('error')
    }
  }, [patientEmail])

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://portal.concussion-education-australia.com'
  const patientUrl = clinic ? `${origin}/sst-trainer?clinic=${encodeURIComponent(clinic.code)}` : ''
  const hubUrl = clinic
    ? `/clinical-hub?clinic=${encodeURIComponent(clinic.code)}&k=${encodeURIComponent(clinic.viewKey)}`
    : ''
  const baselineUrl = clinic ? `${origin}/preseason/b/${encodeURIComponent(clinic.code)}` : ''

  if (!loaded) {
    return (
      <div className="glass-premium rounded-2xl p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">Loading your clinic…</p>
      </div>
    )
  }

  if (!clinic) {
    return (
      <div className="glass-premium rounded-2xl p-6 sm:p-8">
        <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-accent mb-0.5">
          One-time setup
        </p>
        <h2 className="text-lg font-bold text-foreground tracking-tight mb-1.5">
          Create your clinic code
        </h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-4 max-w-xl">
          One 6-character code links patients to you across both tools: SST Trainer sessions sync to
          your Clinical Hub, and the same code runs your pre-season baseline link. Takes one field.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            placeholder="Clinic or practice name"
            className="flex-1 min-w-[220px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => void create()}
            disabled={creating || clinicName.trim().length < 2}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {creating ? 'Setting up…' : 'Create my code'}
          </button>
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="glass-premium rounded-2xl p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-accent mb-0.5">
            {clinic.clinicName}
          </p>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Your clinic code</h2>
          <p className="mt-1 font-mono text-[34px] font-extrabold tracking-[0.3em] text-accent leading-none">
            {clinic.code}
          </p>
        </div>
        <Link
          href={hubUrl}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Open Clinical Hub
        </Link>
      </div>

      <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">
        Patients open the link below, enter their name, and every graded test and training session
        lands in your hub. The same code runs your baseline link for clubs.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <code className="max-w-full truncate rounded-lg bg-slate-100 px-3 py-2 text-[12px] text-slate-700">
          {patientUrl}
        </code>
        <CopyButton text={patientUrl} label="Copy patient link" />
        <button
          type="button"
          onClick={() => setShowQr(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <QrCode className="w-3.5 h-3.5" /> QR card
        </button>
        <CopyButton text={clinic.code} label="Copy code" />
      </div>

      {/* email the link straight to a patient */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-bold text-foreground mb-2">Email the app link to a patient</p>
        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            value={patientEmail}
            onChange={(e) => setPatientEmail(e.target.value)}
            placeholder="patient@email.com"
            className="flex-1 min-w-[220px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => void invite()}
            disabled={inviteState === 'sending' || !patientEmail.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {inviteState === 'sending' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : inviteState === 'sent' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {inviteState === 'sending' ? 'Sending…' : inviteState === 'sent' ? 'Sent' : 'Send invite'}
          </button>
        </div>
        {inviteState === 'error' && (
          <p className="mt-2 text-xs font-semibold text-red-600">{inviteError}</p>
        )}
      </div>

      {/* baseline link — same code, second tool */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-bold text-foreground mb-2">
          Pre-season baseline link (for clubs &amp; teams)
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="max-w-full truncate rounded-lg bg-slate-100 px-3 py-2 text-[12px] text-slate-700">
            {baselineUrl}
          </code>
          <CopyButton text={baselineUrl} label="Copy baseline link" />
        </div>
        <p className="mt-1.5 text-[11.5px] text-muted-foreground">
          Athletes self-complete the SCAT6 baseline in ~5 minutes; each report is emailed to your
          clinic and stored for repeat-test comparison.
        </p>
      </div>

      {showQr && (
        <SstPatientQrCard
          clinicName={clinic.clinicName}
          code={clinic.code}
          viewKey={clinic.viewKey}
          variant="clinician"
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  )
}

const TOOLS = [
  {
    icon: HeartPulse,
    title: 'SST Trainer',
    tag: 'Exercise rehab — measured threshold',
    body: 'Run the Buffalo-protocol graded test, prescribe the 80–90% sub-symptom band, and track verified sessions plus the serial measured-HRt recovery trajectory — live heart rate from the patient’s own watch.',
    href: '/clinical-testing/sst',
    cta: 'Open the SST Trainer',
  },
  {
    icon: ClipboardList,
    title: 'Clinical Hub',
    tag: 'Every patient, live',
    body: 'Thresholds, training bands, session history and flags for review across your whole roster — including live in-session heart rate while a patient trains.',
    href: null, // resolved from the clinic card (needs code + key)
    cta: 'Use “Open Clinical Hub” above',
  },
] as const

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
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">
            Clinical testing
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
            Your patient instruments
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xl">
            One clinic code links patients to you across everything here — create it once, hand it
            to patients, and their tests and sessions flow back to your hub.
          </p>

          <div className="flex flex-col gap-5">
            <ClinicCard />

            {/* the two distinct instruments, side by side */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="glass-premium rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col gap-3">
                <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-none">
                  <HeartPulse className="w-5 h-5 text-accent" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-accent mb-0.5">
                    {TOOLS[0].tag}
                  </p>
                  <h2 className="text-lg font-bold text-foreground tracking-tight mb-1.5">
                    {TOOLS[0].title}
                  </h2>
                  <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                    {TOOLS[0].body}
                  </p>
                  <Link
                    href="/clinical-testing/sst"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 transition-colors shadow-sm"
                  >
                    Open the SST Trainer
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Pre-season baseline — always visible; the personalised link
                lives in the clinic card once a code exists. */}
            <div className="glass-premium rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col gap-3">
                <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-none">
                  <ClipboardList className="w-5 h-5 text-accent" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-accent mb-0.5">
                    SCAT6 baseline — self-administered
                  </p>
                  <h2 className="text-lg font-bold text-foreground tracking-tight mb-1.5">
                    Pre-Season Baseline Testing
                  </h2>
                  <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                    Share one link with your sports clubs and athletes self-complete the SCAT6
                    baseline in about five minutes — symptom scale, orientation, memory,
                    concentration and delayed recall. A PDF report is emailed to your clinic for
                    every athlete, stored for repeat-test comparison. Your personalised club link
                    appears in the clinic card above once your code exists.
                  </p>
                  <Link
                    href="/clinical-testing/baseline"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 transition-colors shadow-sm"
                  >
                    Open Baseline Testing
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
