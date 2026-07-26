'use client'

import { useState } from 'react'
import { ArrowRight, Download, Check } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

// ─────────────────────────────────────────────────────────────────────────────
// EP lead-capture form — the free "EP's Concussion Rehab Starter" magnet.
//
// Most ESSA-newsletter visitors won't buy a $497–$1,400 course on the first
// click, so this captures the email of the not-ready-to-buy majority and emails
// them the free resource. Posts to /api/ep-lead, which creates the user with
// signupSource='ep-course' (the nurture-cron contract) and fires the Day-0
// resource email. Rendered twice on the landing page:
//   • variant="hero"  — compact, single-line, secondary to the enrol CTA
//   • variant="full"  — a standalone card near the bottom of the page
// ─────────────────────────────────────────────────────────────────────────────

type Variant = 'hero' | 'full'

export default function EpLeadCapture({
  variant = 'full',
  location = 'unknown',
}: {
  variant?: Variant
  location?: string
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ep-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: name.trim() || undefined,
          location,
          // WHICH placement sent them. `location` only says which PAGE the form
          // sat on; for a paid ACSM Bulletin advertorial we need to know that
          // this lead came from THAT ad, not from organic /acsm traffic —
          // otherwise the spend can't be judged. Read at submit time so it
          // survives the visitor scrolling before converting.
          utm: typeof window !== 'undefined' ? (() => {
            const q = new URLSearchParams(window.location.search)
            const out: Record<string, string> = {}
            for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
              const v = q.get(k)
              if (v) out[k] = v.slice(0, 80)
            }
            return Object.keys(out).length ? out : undefined
          })() : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setSuccess(true)
        try {
          trackEvent('ep_lead_capture', { variant, location, userEmail: cleanEmail })
        } catch {
          /* analytics is best-effort */
        }
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        className={`rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/80 to-emerald-50/50 p-5 text-center ${
          variant === 'full' ? 'sm:p-8' : ''
        }`}
      >
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white">
          <Check className="h-5 w-5" strokeWidth={3} />
        </div>
        <h3 className="mt-4 text-base font-bold tracking-tight text-foreground sm:text-lg">
          Check your inbox — the Starter is on its way.
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          We&rsquo;ve emailed you the EP&rsquo;s Concussion Rehab Starter — the measured-threshold
          prescription workflow and scope guide. Not in your inbox in a minute? Check spam, and
          add zac@concussion-education-australia.com to your contacts.
        </p>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-foreground shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)]'

  // ── Hero variant — compact, sits under the primary enrol CTAs ──────────────
  if (variant === 'hero') {
    return (
      <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/70 to-white p-4 sm:p-5">
        <div className="mb-3 flex items-start gap-2.5 text-left">
          <Download className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" strokeWidth={1.9} />
          <div>
            <p className="text-sm font-bold text-foreground">
              Not ready to enrol? Take the workflow first — free.
            </p>
            <p className="text-[12.5px] leading-snug text-muted-foreground">
              The EP&rsquo;s Concussion Rehab Starter — the measured-threshold prescription
              workflow + scope guide, emailed to you.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            aria-label="Email address"
            placeholder="you@clinic.com.au"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex flex-shrink-0 items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send it free'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
        {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          One email with the resource. No spam. Unsubscribe anytime.
        </p>
      </div>
    )
  }

  // ── Full variant — standalone card near the bottom of the page ─────────────
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-50 border border-teal-200/60">
          <Download className="h-5 w-5 text-accent" strokeWidth={1.9} />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent mb-2">Free for EPs</p>
        <h3 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          The EP&rsquo;s Concussion Rehab Starter
        </h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          The measured-threshold prescription workflow — Buffalo test &rarr; heart-rate threshold
          &rarr; sub-symptom-threshold dose — plus a plain-English scope guide showing exactly where
          the exercise-physiology lane starts and stops. Emailed to you, free.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            aria-label="First name (optional)"
            placeholder="First name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <input
            type="email"
            required
            aria-label="Email address"
            placeholder="you@clinic.com.au"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Email me the free Starter'}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
        {error ? <p className="text-center text-xs font-medium text-red-600">{error}</p> : null}
        <p className="text-center text-[11.5px] leading-relaxed text-muted-foreground">
          One email with the resource, then the occasional EP-relevant update. No spam.
          Unsubscribe in one click, anytime.
        </p>
      </form>
    </div>
  )
}
