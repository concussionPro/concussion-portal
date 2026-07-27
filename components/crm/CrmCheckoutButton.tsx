'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

/**
 * CRM purchase control. Watertight-per-stream on the client too:
 *   - While ESSA is pending (accredited=false) it renders the interest-capture
 *     mailto — NO live checkout (matches the hard block).
 *   - On approval (accredited=true) it collects email + a NOMINATED workshop
 *     city (required — feeds the shared CCM/CRM Ready-to-Train demand) and POSTs
 *     to /api/crm/checkout, then redirects to Stripe.
 *
 * tier: 'online' (course) · 'complete' (course + practical day) · 'upgrade'
 * (existing online buyer adds the shared practical day).
 */
const CITIES: { slug: string; label: string }[] = [
  { slug: 'sydney', label: 'Sydney' },
  { slug: 'melbourne', label: 'Melbourne' },
  { slug: 'byron-bay', label: 'Byron Bay' },
  { slug: 'adelaide', label: 'Adelaide' },
  { slug: 'wa', label: 'Perth (WA)' },
]

export default function CrmCheckoutButton({
  tier,
  label,
  className,
  accredited,
  interestHref,
}: {
  tier: 'online' | 'complete' | 'upgrade'
  label: string
  className: string
  accredited: boolean
  interestHref: string
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Online tier has no practical day → no city. Complete/upgrade CAN nominate a
  // city, but it's optional — you may buy now and nominate later.
  const needsCity = tier !== 'online'

  // Pending ESSA → interest capture only, never a live checkout.
  if (!accredited) {
    return (
      <a href={interestHref} className={className}>
        {label} <ArrowRight className="w-4 h-4" />
      </a>
    )
  }

  async function start() {
    setError(null)
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setError('Enter a valid email.'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/crm/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tier, email, location: city || undefined }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) { setError(data.error || 'Could not start checkout.'); setBusy(false); return }
      void trackEvent('checkout_start', { stream: 'crm', tier, userEmail: email })
      window.location.href = data.url
    } catch {
      setError('Network error — please try again.')
      setBusy(false)
    }
  }

  if (!open) {
    // Without the enroll_button_click event the CRM funnel read a structural
    // ZERO enrol clicks (2026-07-27) — the stream's buying intent was invisible.
    return (
      <button type="button" onClick={() => { void trackEvent('enroll_button_click', { stream: 'crm', tier }); setOpen(true) }} className={className}>
        {label} <ArrowRight className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left">
      <p className="text-[13px] font-bold text-slate-800 mb-2">
        {needsCity ? 'Your details — nominate a city now, or decide later' : 'Enter your email to continue'}
      </p>
      <input
        type="email"
        inputMode="email"
        placeholder="you@clinic.com.au"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-2 rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
      />
      {needsCity && (
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full mb-3 rounded-lg border border-slate-300 px-3 py-2 text-[14px] bg-white"
        >
          <option value="">I&rsquo;ll nominate my city later</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>
      )}
      {error && <p className="text-[12px] text-red-600 mb-2">{error}</p>}
      <button type="button" onClick={start} disabled={busy} className={className}>
        {busy ? 'Starting…' : 'Continue to secure checkout'} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
