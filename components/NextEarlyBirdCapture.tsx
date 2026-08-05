'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Check, Sparkles, ArrowRight } from 'lucide-react'
import { trackInterestRegistration } from '@/lib/analytics'
import { CONFIG, isEarlyBirdForLocation, workshopPriceFor } from '@/lib/config'

type CitySlug = 'sydney' | 'adelaide' | 'wa' | 'melbourne'

const CITIES: { slug: CitySlug; label: string }[] = [
  { slug: 'sydney', label: 'Sydney' },
  { slug: 'adelaide', label: 'Adelaide' },
  { slug: 'wa', label: 'Perth / WA' },
  { slug: 'melbourne', label: 'Next Melbourne' },
]

/**
 * NextEarlyBirdCapture — compact inline "notify me about the next round" form.
 *
 * STATE-AWARE (fixed 2026-08-05): it used to hardcode "Early bird closed" and
 * only ever offered a waitlist. On /courses/sydney and /courses/melbourne —
 * both `collecting`/`completed`, so isEarlyBirdForLocation() is TRUE and
 * checkout charges PRICE_EARLY_BIRD — that told a ready buyer the rate had
 * closed and routed them into a waitlist instead of a purchase. The header,
 * the blurb and the CTA now derive from isEarlyBirdForLocation(city):
 *   - early bird ACTIVE  → lead with "enrol now at $X", waitlist is the
 *     secondary option (for people who want a date before they buy);
 *   - early bird CLOSED  → the original catch-the-next-one waitlist copy.
 *
 * Submits to the existing /api/register-interest endpoint with the chosen
 * city — same backend as OtherCityInterest, just a more compact form.
 *
 * Default selected city is "melbourne" — preserves the context (they were
 * browsing the Melbourne workshop page).
 */
export function NextEarlyBirdCapture({
  defaultCity = 'melbourne',
  className = '',
}: {
  defaultCity?: CitySlug
  className?: string
}) {
  const [city, setCity] = useState<CitySlug>(defaultCity)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/register-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, city }),
      })
      const data = await res.json()
      if (data.success) {
        trackInterestRegistration(city, email)
        setDone(true)
      } else {
        setError(data.error || 'Something went wrong.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const cityLabel = CITIES.find((c) => c.slug === city)?.label ?? 'your city'
  // Same function the Stripe charge uses (lib/stripe.ts) — display can never
  // drift from what the buyer is actually charged.
  const earlyBirdActive = isEarlyBirdForLocation(city)
  const currentPrice = workshopPriceFor(city)

  if (done) {
    return (
      <div className={`mt-4 mx-auto max-w-md rounded-lg bg-emerald-50 border border-emerald-200 p-3 ${className}`}>
        <p className="text-sm text-emerald-900 leading-snug flex items-start gap-2">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>
            You&rsquo;re on the list for {cityLabel}.{' '}
            {earlyBirdActive
              ? `We'll email as soon as a date launches — you'll get at least ${CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks' notice. The A$${currentPrice.toLocaleString()} early-bird rate is open now if you'd rather lock it in.`
              : 'We’ll email when the next early-bird opens — usually 4-6 weeks before the workshop.'}
          </span>
        </p>
        {earlyBirdActive && (
          <Link
            href={`/pricing?location=${city}`}
            className="mt-3 w-full inline-flex items-center justify-center gap-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-1.5 transition-colors"
          >
            Enrol now — A${currentPrice.toLocaleString()}
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className={`mt-4 mx-auto max-w-md rounded-xl border-2 border-amber-200 bg-amber-50/40 p-4 ${className}`}>
      <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5 mb-1">
        <Sparkles className="w-3.5 h-3.5" />
        {earlyBirdActive
          ? `Early-bird rate is open — A$${currentPrice.toLocaleString()}`
          : 'Early bird closed — catch the next one'}
      </p>
      <p className="text-[12px] text-slate-700 leading-snug mb-3">
        {earlyBirdActive ? (
          <>
            Enrol now and you lock A${currentPrice.toLocaleString()} — A$
            {(CONFIG.COURSE.PRICE_REGULAR - currentPrice).toLocaleString()} under the A$
            {CONFIG.COURSE.PRICE_REGULAR.toLocaleString()} standard rate that applies in the final{' '}
            {CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE} days before a scheduled workshop. Not ready
            without a date? Tell us your city and we&rsquo;ll email you the moment one launches.
          </>
        ) : (
          <>
            Get notified when the next early-bird opens (save A$
            {(CONFIG.COURSE.PRICE_REGULAR - CONFIG.COURSE.PRICE_EARLY_BIRD).toLocaleString()} vs
            full price). Pick a city you&rsquo;d travel to.
          </>
        )}
      </p>

      {earlyBirdActive && (
        <Link
          href={`/pricing?location=${city}`}
          className="w-full inline-flex items-center justify-center gap-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 mb-3 transition-colors"
        >
          Enrol now — A${currentPrice.toLocaleString()}
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}

      <form onSubmit={submit} className="space-y-2">
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="City for next early-bird notification">
          {CITIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              role="radio"
              aria-checked={city === c.slug}
              onClick={() => setCity(c.slug)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-colors ${
                city === c.slug
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@clinic.com.au"
            autoComplete="email"
            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-1 rounded-md bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white text-xs font-semibold py-1.5 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : earlyBirdActive ? (
            <>Email me when {cityLabel} gets a date</>
          ) : (
            <>Notify me about {cityLabel}</>
          )}
        </button>

        {error && (
          <p className="text-[11px] text-red-600 leading-snug">{error}</p>
        )}

        <p className="text-[10px] text-slate-500 leading-snug">
          {earlyBirdActive
            ? 'One email when a date launches in your city. Unsubscribe any time.'
            : 'One email when the next early-bird opens. Unsubscribe any time.'}
        </p>
      </form>
    </div>
  )
}
