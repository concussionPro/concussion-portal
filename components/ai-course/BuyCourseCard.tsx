'use client'

import { useState } from 'react'
import { Loader2, ShieldCheck, Award, Check } from 'lucide-react'

interface BuyCourseCardProps {
  courseSlug: string
  courseTitle: string
  priceAUD: number
  cpdHours: number
  earlyBirdPriceAUD?: number | null
  earlyBirdDiscountPct?: number
  /** Pre-fills email if user is logged-in but not enrolled */
  prefillEmail?: string
}

/**
 * Public-facing purchase CTA for short courses. Sits on the course landing
 * page when the visitor is NOT yet enrolled. Hits /api/courses/checkout
 * to create a Stripe Checkout session, then redirects the browser there.
 *
 * Post-purchase, the webhook at /api/webhooks/stripe handles enrolment
 * + the welcome email with magic-link. The customer ends up back on this
 * same page, but enrolled.
 */
export function BuyCourseCard({
  courseSlug,
  courseTitle,
  priceAUD,
  cpdHours,
  earlyBirdPriceAUD,
  earlyBirdDiscountPct,
  prefillEmail = '',
}: BuyCourseCardProps) {
  const [email, setEmail] = useState(prefillEmail)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayPrice = earlyBirdPriceAUD ?? priceAUD
  const showDiscount = earlyBirdPriceAUD != null && earlyBirdPriceAUD < priceAUD

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email to receive your access link.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/courses/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseSlug,
          email: email.trim().toLowerCase(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data?.error || 'Could not start checkout — try again.')
        setSubmitting(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error — try again.')
      setSubmitting(false)
    }
  }

  return (
    <section className="mb-12 rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/[0.04] to-white p-6 md:p-8">
      <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-2">
            Enrol now
          </p>
          <h2 className="text-2xl font-bold text-foreground leading-tight mb-2">{courseTitle}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Lifetime access · {cpdHours} CPD {cpdHours === 1 ? 'hour' : 'hours'} · 12-month certificate on completion · audit-defensible.
          </p>
        </div>
        <div className="text-right shrink-0">
          {showDiscount && (
            <p className="text-sm text-muted-foreground line-through tabular-nums">
              A${priceAUD}
            </p>
          )}
          <p className="text-4xl font-bold text-foreground tabular-nums leading-none">
            A${displayPrice}
          </p>
          {showDiscount && (
            <p className="text-[11px] font-bold text-emerald-700 mt-1">
              Save {earlyBirdDiscountPct}% — early-access
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleBuy} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@clinic.com.au"
          required
          autoComplete="email"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors min-w-[180px]"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? 'Starting checkout' : `Enrol · A$${displayPrice} →`}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="mt-5 grid sm:grid-cols-3 gap-3 text-[11px] text-muted-foreground">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
          <span>Secure checkout via Stripe. Card / Apple Pay / Google Pay / Afterpay accepted.</span>
        </div>
        <div className="flex items-start gap-2">
          <Award className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
          <span>AHPRA-aligned certificate. Public verification URL for insurers + employers.</span>
        </div>
        <div className="flex items-start gap-2">
          <Check className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
          <span>30-day satisfaction guarantee. Tax invoice emailed automatically.</span>
        </div>
      </div>
    </section>
  )
}
