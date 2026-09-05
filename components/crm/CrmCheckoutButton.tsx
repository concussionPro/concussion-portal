'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { trackEvent, getAttribution } from '@/lib/analytics'

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
  // City nomination is asked for ONLY when the buyer is actually buying the
  // practical day.
  //
  // It used to be required on every tier, including online-only. Measured
  // 2026-08-06: 7 enrol clicks on this page in 28 days, ZERO reaching Stripe —
  // a 100% drop at this form, and the last checkout_start of any kind was 8
  // days earlier. An EP buying the $497 ONLINE course was being told
  // "Nominate your city (required) — your nominated city sets practical-day
  // demand" for a practical day they are not purchasing. That reads as a
  // commitment to something further, on a product sold as standalone, at the
  // exact moment they had decided to pay.
  //
  // The nomination still matters (it feeds shared CCM/CRM Ready-to-Train
  // demand) — it has moved AFTER payment, where it costs no sales. Reverting
  // is one line: set this back to `true` and restore the API's unconditional
  // check.
  const needsCity = tier !== 'online'
  // Soft email on every tier — stamps customer_email for abandoned-checkout
  // rescue (same doctrine as CCM PricingOptions). Upgrade additionally uses
  // the address to locate the existing CRM Online purchase.
  const needsEmail = true
  const needsAnything = needsCity || needsEmail

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
    if (needsEmail && (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))) {
      setError(
        tier === 'upgrade'
          ? 'Enter the email you enrolled with.'
          : 'Enter your email so we can send your enrolment link if checkout is interrupted.',
      )
      return
    }
    if (needsCity && !city) { setError('Nominate your city — it sets where the practical day launches.'); return }
    setBusy(true)
    try {
      // UTM + first-touch attribution, same as the CCM stream
      // (components/PricingOptions.tsx). /api/crm/checkout already accepts
      // both and passes them into the Stripe session metadata, but this
      // client sent neither — so a CRM sale arrived in Stripe with no source
      // at all. ESSA is the channel this stream lives on (every enrol click
      // measured so far carries referrer essa.org.au or ?EventKey=PDNF26077)
      // and ESSA lists the course to members on 20 Aug: without this, the
      // first paid conversions from that listing are unattributable.
      const utm: Record<string, string> = {}
      try {
        const q = new URLSearchParams(window.location.search)
        for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid']) {
          const v = q.get(k)
          if (v) utm[k] = v.slice(0, 120)
        }
        // ESSA's own listing links carry the accreditation number, not a UTM.
        const eventKey = q.get('EventKey')
        if (eventKey && !utm.utm_source) {
          utm.utm_source = 'essa'
          utm.utm_campaign = eventKey.slice(0, 120)
        }
      } catch {
        /* best-effort — never block checkout on attribution */
      }
      const res = await fetch('/api/crm/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tier,
          email,
          location: city || undefined,
          ...(Object.keys(utm).length ? { utm } : {}),
          attribution: getAttribution(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) { setError(data.error || 'Could not start checkout.'); setBusy(false); return }
      // trackEvent uses keepalive, so this survives the navigation below.
      void trackEvent('checkout_start', { stream: 'crm', tier, ...(email ? { userEmail: email } : {}) })
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
      <>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void trackEvent('enroll_button_click', { stream: 'crm', tier })
            // Nothing left to ask for → do what the label says, first click.
            if (!needsAnything) { void start(); return }
            setOpen(true)
          }}
          className={className}
        >
          {busy ? 'Starting…' : label} <ArrowRight className="w-4 h-4" />
        </button>
        {/* One-click tiers never open the panel, so the panel's error slot
            would never render for them — a failed checkout would look like a
            button that simply does nothing. */}
        {error && (
          <p role="alert" className="mt-2 text-[12px] text-red-600">{error}</p>
        )}
      </>
    )
  }

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left">
      <p className="text-[13px] font-bold text-slate-800 mb-2">
        {tier === 'upgrade'
          ? 'The email you enrolled with — so we can find your CRM Online purchase'
          : needsCity
            ? 'Email + city so we can enrol you and set practical-day demand'
            : 'Email for your receipt & enrolment link'}
      </p>
      {needsEmail && (
        <input
          type="email"
          inputMode="email"
          autoFocus
          placeholder="you@clinic.com.au"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !busy) void start() }}
          className="w-full mb-2 rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
        />
      )}
      {needsCity && (
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          autoFocus={!needsEmail}
          className="w-full mb-3 rounded-lg border border-slate-300 px-3 py-2 text-[14px] bg-white"
        >
          <option value="">Choose your city</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>
      )}
      {needsCity && (
        <p className="text-[11.5px] leading-snug text-slate-500 mb-2">
          Your online modules start immediately — only the practical day waits for a date,
          which launches when your city fills.
        </p>
      )}
      {error && <p className="text-[12px] text-red-600 mb-2">{error}</p>}
      <button type="button" onClick={start} disabled={busy} className={className}>
        {busy ? 'Starting…' : 'Continue to secure checkout'} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
