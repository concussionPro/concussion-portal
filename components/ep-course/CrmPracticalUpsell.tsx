'use client'

import { useState } from 'react'
import { ArrowRight, Award } from 'lucide-react'
import { CONFIG, upgradePriceFor, isEarlyBirdForLocation } from '@/lib/config'
import { trackEvent } from '@/lib/analytics'

/**
 * In-portal practical-day upgrade for a CRM Online buyer.
 *
 * PARITY GAP THIS CLOSES: CCM has eleven in-portal upgrade surfaces (sidebar
 * card, /learning banner, bento card, completion card, milestone nudges,
 * settings row, …), all keyed off `accessLevel === 'online-only'` and pointed
 * at /upgrade. The CRM stream had NONE — and /upgrade is CCM-scoped, so a CRM
 * buyer who found it was redirected to /pricing (the CCM sales page). The only
 * CRM upgrade CTA lived on the public marketing page, which a signed-in buyer
 * never sees.
 *
 * The CRM analogue of 'online-only' is `ownsCrm && !ownsCrmPractical`
 * (course_purchases 'crm' without 'crm-practical'), surfaced by
 * /api/auth/session — see lib/crm-course.ts crmEntitlementsFor.
 *
 * Pricing is derived, never written: upgradePriceFor() is the same helper the
 * Stripe charge uses (lib/crm-course.ts crmPriceCents('upgrade')), so display
 * and charge can never drift.
 *
 * The practical day is SHARED between CCM and CRM. The server re-checks CRM
 * ownership before minting the session (/api/crm/checkout rejects 'upgrade'
 * for a non-owner), so this component can never sell a bare workshop seat.
 */
const CITIES: { slug: string; label: string }[] = [
  { slug: 'sydney', label: 'Sydney' },
  { slug: 'melbourne', label: 'Melbourne' },
  { slug: 'byron-bay', label: 'Byron Bay' },
  { slug: 'adelaide', label: 'Adelaide' },
  { slug: 'wa', label: 'Perth (WA)' },
]

export function CrmPracticalUpsell({
  email,
  workshopLocation,
  variant = 'card',
  source,
}: {
  /** Signed-in buyer's email — prefilled, so this is one click plus a city. */
  email: string
  /** City nominated at their original CRM purchase, when we have one. */
  workshopLocation?: string | null
  variant?: 'card' | 'sidebar'
  /** Analytics label for which surface produced the click. */
  source: string
}) {
  const initialCity = CITIES.some((c) => c.slug === workshopLocation) ? (workshopLocation as string) : ''
  const [open, setOpen] = useState(false)
  const [city, setCity] = useState(initialCity)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Enrolment is hard-gated on ESSA accreditation everywhere else in the CRM
  // stream (/api/crm/checkout returns 403 while it is pending) — never render a
  // buy button the server would refuse.
  if (!CONFIG.FEATURES.ESSA_ACCREDITED) return null

  const price = upgradePriceFor(workshopLocation ?? city ?? null)
  const earlyBird = isEarlyBirdForLocation(workshopLocation ?? city ?? null)

  async function start() {
    setError(null)
    if (!city) {
      setError('Nominate your city — it sets where the practical day launches.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/crm/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tier: 'upgrade', email, location: city }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || 'Could not start checkout.')
        setBusy(false)
        return
      }
      void trackEvent('checkout_start', { stream: 'crm', tier: 'upgrade', source, userEmail: email })
      window.location.href = data.url
    } catch {
      setError('Network error — please try again.')
      setBusy(false)
    }
  }

  const headline = `Add the practical day — $${price.toLocaleString()}`
  const subline = `${CONFIG.COURSE.IN_PERSON_CPD_POINTS} more ESSA CPD hours, taking you to ${CONFIG.COURSE.CRM_TOTAL_CPD_POINTS}.`

  // Plain JSX, not a nested component — a component defined inside render is a
  // new type every render and would remount the control on each keystroke.
  const controls = !open ? (
    <button
      type="button"
      onClick={() => {
        void trackEvent('upgrade_cta_click', { stream: 'crm', source })
        setOpen(true)
      }}
      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-teal-700"
    >
      Add the practical day <ArrowRight className="h-4 w-4" />
    </button>
  ) : (
    <div className="mt-3">
      <label htmlFor="crm-upgrade-city" className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Nominate your city
      </label>
      <select
        id="crm-upgrade-city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">Choose a city…</option>
        {CITIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
      >
        {busy ? 'Starting…' : 'Continue to secure checkout'} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )

  if (variant === 'sidebar') {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
        <p className="text-[13px] font-bold text-slate-900">{headline}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{subline}</p>
        {controls}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-teal-300 bg-gradient-to-br from-teal-50 via-white to-blue-50 p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
          <Award className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900">{headline}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            You own Concussion Rehab Mastery online. The full-day practical workshop is where you run the Buffalo
            test, set a training band from a real threshold and progress it under supervision. {subline}
            {earlyBird && ' Early-bird pricing applies until 14 days before your city’s date.'}
          </p>
          {controls}
        </div>
      </div>
    </div>
  )
}
