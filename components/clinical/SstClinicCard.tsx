'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { SstPatientQrCard } from '@/components/sst-trainer/SstPatientQrCard'
import {
  ArrowRight,
  Copy,
  Check,
  QrCode,
  Send,
  Loader2,
  LayoutDashboard,
} from 'lucide-react'

/**
 * The clinician's clinic-code panel — provision once, then code + patient
 * link + QR + email-invite + hub access. Shared by /clinical-testing and the
 * embedded instrument pages (flagship surface).
 */

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

export function SstClinicCard() {
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
