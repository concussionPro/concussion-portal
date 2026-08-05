'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SST_TIER_FROM_AUD, SST_TRIAL_PATIENT_CAP } from '@/lib/config'

/**
 * /clinical-suite/start — the self-serve trial signup form. Cold-inbound
 * front door (Cliniko listing CTA and PMS directories point here): three
 * fields, and on success the clinic code is shown on screen while the
 * welcome email (code + login link) travels. Resubmitting with the same
 * email re-sends the welcome — it doubles as "recover my clinic code".
 */

const ACCENT = '#0d9488'
const NAVY = '#16243f'

type Result = { code?: string; message: string }

export function SstTrialStart({ source }: { source?: string }) {
  const [clinicianName, setClinicianName] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot — hidden from real users
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/sst/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicianName, clinicName, email, website, source }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.')
        return
      }
      setResult({ code: data?.code, message: data?.message || 'Check your email.' })
    } catch {
      setError('Something went wrong. Please check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <div className="rounded-[22px] border border-slate-200 bg-white p-8 sm:p-10" style={{ boxShadow: '0 16px 40px -18px rgba(22,36,63,.25)' }}>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-[13px] font-bold text-emerald-800">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">✓</span>
          Your clinic is set up
        </span>
        {result.code && (
          <div className="mt-6">
            <p className="m-0 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-500">Your clinic code</p>
            <p className="m-0 mt-1 font-mono text-[42px] font-extrabold tracking-[0.08em]" style={{ color: NAVY }}>{result.code}</p>
          </div>
        )}
        <p className="m-0 mt-4 max-w-[460px] text-[15px] leading-[1.6] text-slate-600">{result.message}</p>
        <p className="m-0 mt-2 max-w-[460px] text-[13.5px] leading-[1.6] text-slate-500">
          The email has your login link, your private dashboard link and the patient app link. Your
          first <strong>3 patients are free</strong> — no card required. Upgrade any time from your workspace.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/clinical-hub?clinic=DEMO00"
            className="rounded-[13px] px-[22px] py-[15px] text-[15px] font-bold leading-none"
            style={{ background: NAVY, color: '#fff' }}
          >
            Explore the demo dashboard while you wait
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-[22px] border border-slate-200 bg-white p-8 sm:p-10" style={{ boxShadow: '0 16px 40px -18px rgba(22,36,63,.25)' }}>
      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-slate-700">Your name</span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={clinicianName}
            onChange={(e) => setClinicianName(e.target.value)}
            placeholder="First and last name"
            className="rounded-[12px] border border-slate-300 px-4 py-3 text-[15px] outline-none transition-colors focus:border-teal-600"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-slate-700">Clinic name</span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={120}
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            placeholder="e.g. Northside Physiotherapy"
            className="rounded-[12px] border border-slate-300 px-4 py-3 text-[15px] outline-none transition-colors focus:border-teal-600"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-slate-700">Work email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourclinic.com.au"
            className="rounded-[12px] border border-slate-300 px-4 py-3 text-[15px] outline-none transition-colors focus:border-teal-600"
          />
          <span className="text-[12px] text-slate-400">Your clinic code and login link arrive here.</span>
        </label>
        {/* Honeypot — hidden from people, visible to bots */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
          <label>
            Website
            <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>
        {error && (
          <p className="m-0 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] font-semibold text-red-700">{error}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="rounded-[13px] px-[22px] py-[16px] text-[15px] font-bold leading-none transition-transform active:scale-[0.98] disabled:opacity-60"
          style={{ background: NAVY, color: '#fff' }}
        >
          {busy ? 'Setting up your clinic…' : 'Create my clinic — free trial'}
        </button>
        <p className="m-0 text-center text-[12px] leading-[1.5] text-slate-400">
          First {SST_TRIAL_PATIENT_CAP} patients free · no card required · from A${SST_TIER_FROM_AUD}/mo standalone thereafter.
          <br />
          Already have a code? Submitting again re-sends it. By continuing you agree to the{' '}
          <Link href="/terms" className="underline" style={{ color: ACCENT }}>terms</Link> and{' '}
          <Link href="/privacy" className="underline" style={{ color: ACCENT }}>privacy policy</Link>.
        </p>
      </div>
    </form>
  )
}
