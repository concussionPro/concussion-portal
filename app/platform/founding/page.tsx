'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlatformNav, PlatformFooter, PLATFORM } from '@/components/platform/PlatformChrome'

// ─────────────────────────────────────────────────────────────────────────────
// /platform/founding — founding-clinic signup form for the SST Trainer.
// Replaces the flaky mailto CTAs. Posts to /api/platform/founding, which
// persists the lead to Postgres and notifies Zac via Resend.
// Hanken Grotesk + gating + noindex are inherited from app/platform/layout.tsx.
// Palette: navy #16243f, green #3c7a1f.
// ─────────────────────────────────────────────────────────────────────────────



const PERKS = [
  'Your first 3 patients free — no card, no time limit',
  'Founding rate locked for life — A$49/month, half the A$99 standard rate',
  'Priority onboarding: your clinic code, patient links and hub set up within the week',
  'A direct line to our clinical team, and early access to every new tool and module',
  'A founding-clinic listing when our referral directory launches',
]

const labelCls = 'mb-[6px] block text-[13px] font-bold'
const fieldCls =
  'w-full rounded-[12px] border border-slate-300 bg-white px-[14px] py-[12px] text-[14.5px] text-[#16243f] outline-none transition-colors focus:border-[#3c7a1f] focus:ring-2 focus:ring-[#3c7a1f]/20'

export default function FoundingClinicPage() {
  const [form, setForm] = useState({
    clinicianName: '',
    clinicName: '',
    email: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')
  const [code, setCode] = useState('')

  const update = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setFeedback('')
    try {
      const res = await fetch('/api/platform/founding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStatus('success')
        setCode(data.code || '')
        setFeedback(data.message || 'Your clinic is set up. Check your email for your portal login and patient links.')
      } else {
        setStatus('error')
        setFeedback(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setFeedback('Could not reach the server. Please try again.')
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(120% 75% at 82% -8%, #f2f8eb 0%, #f8fafc 46%, #f1f5f9 100%)',
        color: PLATFORM.navy,
      }}
    >
      <PlatformNav />

      <div className="mx-auto grid max-w-[1080px] grid-cols-1 items-start gap-12 px-6 pb-16 pt-10 md:grid-cols-[1fr_1.05fr]">
        {/* ── Left: pitch ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 md:pt-4">
          <span
            className="flex items-center gap-[7px] self-start rounded-full px-[14px] py-[7px] text-[12px] font-bold tracking-[0.02em]"
            style={{ background: '#e6f3da', color: PLATFORM.green }}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: '#57a82e' }} />
            First 20 clinics · founding cohort
          </span>
          <h1
            className="m-0 font-extrabold tracking-[-0.03em]"
            style={{ fontSize: 'clamp(30px, 4vw, 44px)', lineHeight: 1.05 }}
          >
            Be one of our first
            <br />
            <span style={{ color: PLATFORM.green }}>20 founding clinics.</span>
          </h1>
          <p
            className="m-0 max-w-[440px] font-normal text-slate-600"
            style={{ fontSize: 'clamp(14.5px, 1.4vw, 16px)', lineHeight: 1.55 }}
          >
            SST Trainer is the delivery layer for first-line concussion care — the Buffalo-protocol
            graded test and sub-symptom aerobic training (Amsterdam 2023) that you prescribe and oversee,
            on the wearable your patients already own.
            We&rsquo;re onboarding a small founding cohort now: lock A$49/month for life (half the
            A$99 standard), your first three patients free, and priority onboarding as we grow with
            you.
          </p>
          <div className="mt-1 flex flex-col gap-[11px]">
            {PERKS.map((p) => (
              <div key={p} className="flex items-start gap-[10px]">
                <span
                  className="mt-px flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: '#57a82e' }}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="text-[13.5px] font-medium text-slate-700" style={{ lineHeight: 1.4 }}>
                  {p}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: form card ─────────────────────────────────────────── */}
        <div
          className="rounded-[22px] bg-white p-7 sm:p-8"
          style={{ border: '1px solid #e2e8f0', boxShadow: '0 16px 40px -18px rgba(22,36,63,.22)' }}
        >
          {status === 'success' ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full text-[26px] font-bold text-white"
                style={{ background: '#57a82e' }}
                aria-hidden="true"
              >
                ✓
              </span>
              <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">
                {code ? 'Your clinic is set up.' : "You're on the founding list."}
              </h2>
              {code && (
                <div className="rounded-xl border-2 border-[#0d9488] bg-[#f0fdfa] px-5 py-3 text-center">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Your clinic code</p>
                  <p className="m-0 mt-1 font-mono text-[26px] font-extrabold tracking-[6px] text-[#0d9488]">{code}</p>
                </div>
              )}
              <p className="m-0 max-w-[380px] text-[14px] font-normal text-slate-600" style={{ lineHeight: 1.55 }}>
                {code
                  ? `${feedback} We’ve emailed your one-click portal login and your patient app + baseline links.`
                  : feedback}
              </p>
              {code && (
                <Link
                  href="/login"
                  className="mt-2 rounded-[12px] px-[22px] py-[13px] text-[14px] font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: PLATFORM.navy }}
                >
                  Log in to your portal
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[15px]" noValidate>
              <div>
                <h2 className="m-0 text-[18px] font-extrabold tracking-[-0.01em]">Start your free trial</h2>
                <p className="m-0 mt-1 text-[13px] font-normal text-slate-500" style={{ lineHeight: 1.45 }}>
                  Set up your clinic in under a minute — first 3 patients free, no card. You&rsquo;ll get your
                  clinic code and portal login straight away.
                </p>
              </div>

              <div>
                <label htmlFor="clinicianName" className={labelCls}>
                  Your name
                </label>
                <input
                  id="clinicianName"
                  name="clinicianName"
                  type="text"
                  required
                  autoComplete="name"
                  value={form.clinicianName}
                  onChange={update('clinicianName')}
                  className={fieldCls}
                  placeholder="Dr Jane Smith"
                />
              </div>

              <div>
                <label htmlFor="clinicName" className={labelCls}>
                  Clinic name
                </label>
                <input
                  id="clinicName"
                  name="clinicName"
                  type="text"
                  required
                  autoComplete="organization"
                  value={form.clinicName}
                  onChange={update('clinicName')}
                  className={fieldCls}
                  placeholder="Bayside Sports & Spinal"
                />
              </div>

              <div>
                <label htmlFor="email" className={labelCls}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={update('email')}
                  className={fieldCls}
                  placeholder="jane@clinic.com.au"
                />
              </div>


              {status === 'error' && feedback && (
                <p
                  className="m-0 rounded-[10px] px-[14px] py-[10px] text-[13px] font-semibold"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}
                  role="alert"
                >
                  {feedback}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="mt-1 rounded-[13px] py-[14px] text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: PLATFORM.navy }}
              >
                {status === 'submitting' ? 'Setting up your clinic…' : 'Start free — set up my clinic'}
              </button>

              <p className="m-0 text-center text-[12px] font-normal text-slate-400" style={{ lineHeight: 1.45 }}>
                We&apos;ll only use your details to set up your founding clinic. No spam.
              </p>
            </form>
          )}
        </div>
      </div>

      <PlatformFooter />
    </main>
  )
}
