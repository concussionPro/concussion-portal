'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ArrowRight, Loader2 } from 'lucide-react'
import { trackInterestRegistration } from '@/lib/analytics'
import { CONFIG } from '@/lib/config'

// ─── City momentum (real counts only, shared across all cards) ──────────────
//
// One module-level fetch shared by every card instance. A low count is
// anti-social-proof, so the numeric line renders ONLY when the true enrolled
// count is >= MOMENTUM_MIN_ENROLLED. No zeros, no interest-count fallback,
// nothing fabricated. Silent failure — the card works fine without it.
const MOMENTUM_MIN_ENROLLED = 5

interface CityProgress {
  slug: string
  enrolled: number
  threshold: number
}

let cityProgressPromise: Promise<CityProgress[]> | null = null
function fetchCityProgress(): Promise<CityProgress[]> {
  if (!cityProgressPromise) {
    cityProgressPromise = fetch('/api/city-progress')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => (data && Array.isArray(data.cities) ? (data.cities as CityProgress[]) : []))
      .catch(() => [])
  }
  return cityProgressPromise
}

export type LocationCardProps = {
  city: string
  /** register-interest city slug — must be in the API's VALID_CITIES */
  citySlug: 'sydney' | 'melbourne' | 'byron-bay'
  img: string
  status: string
  dotClass: string
  statusTextClass: string
  caption: string
}

/**
 * Homepage workshop-location card: editorial city shot with a status pill,
 * and an inline email capture directly beneath the image that registers
 * interest for THAT city (posts to /api/register-interest). Email-only for
 * low friction — a display name is derived from the address so the admin
 * interest list still has a label.
 */
export function LocationInterestCard({ city, citySlug, img, status, dotClass, statusTextClass, caption }: LocationCardProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<CityProgress | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchCityProgress().then((cities) => {
      if (cancelled) return
      setProgress(cities.find((c) => c.slug === citySlug) ?? null)
    })
    return () => { cancelled = true }
  }, [citySlug])

  const showMomentum = !!progress && progress.enrolled >= MOMENTUM_MIN_ENROLLED

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    const clean = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Enter a valid email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      // This form has NO name field, so the name is derived from the address.
      // /api/register-interest rejects anything under 2 characters with
      // "Name is required (max 100 characters)" — an error about a field the
      // visitor was never shown, on an address as ordinary as a@clinic.com.au.
      // Pad short local parts rather than sending a value the route will bounce.
      const localPart = clean.split('@')[0].slice(0, 60)
      const derivedName = localPart.length >= 2 ? localPart : 'Interested'
      const res = await fetch('/api/register-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean, name: derivedName, city: citySlug, source: 'pricing_page' }),
      })
      const data = await res.json()
      if (data.success) {
        trackInterestRegistration(citySlug, clean)
        setMessage(data.message || `You're on the ${city} list — we'll email you when the date is confirmed.`)
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

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-slate-950 shadow-[0_10px_36px_-10px_rgba(15,23,42,0.35)] transition-all duration-300 hover:shadow-[0_20px_56px_-12px_rgba(15,23,42,0.5)] hover:-translate-y-0.5">
      {/* Full-bleed city photograph */}
      <Image
        src={img}
        alt={`${city} — Concussion Clinical Mastery workshop location`}
        fill
        sizes="(min-width: 640px) 340px, 100vw"
        className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
      />
      {/* Cinematic scrim — readable overlay content, photo stays the hero */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-slate-950/10" aria-hidden="true" />

      {/* Status pill */}
      <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full shadow-sm">
        <span className={`inline-flex h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
        <span className={`text-[10px] font-bold uppercase tracking-wide ${statusTextClass}`}>{status}</span>
      </div>

      {/* Overlay content */}
      <div className="relative flex flex-col justify-end min-h-[430px] p-4 pt-40">
        <h3 className="text-white text-2xl md:text-[1.75rem] font-bold tracking-tight leading-none [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]">
          {city}
        </h3>
        <p className="mt-1.5 text-[12.5px] text-white/75 leading-snug">{caption}</p>

        {showMomentum && progress && (
          <div className="mt-2.5 flex">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 border border-emerald-300/30 backdrop-blur px-2.5 py-1">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <span className="text-[11px] font-semibold text-emerald-100 leading-snug">
                {progress.enrolled} of {progress.threshold} enrolled — date launches at {progress.threshold}
              </span>
            </span>
          </div>
        )}

        {/* Primary action: enrol (tier-neutral — /pricing shows the online
            $497 → workshop-upgrade ladder for this city). */}
        <Link
          // #pricing-cards, NOT bare /pricing. This card renders on /pricing
          // itself (CcmPricingContent #workshop-locations) as well as on the
          // homepage, so a plain `/pricing?location=…` is a same-page
          // navigation there: nothing changes and the browser simply jumps to
          // the top, which is what the button appeared to do. The anchor works
          // in both places — navigate-and-scroll from home, scroll-in-place on
          // /pricing.
          href={`/pricing?location=${citySlug}#pricing-cards`}
          // The visible label carries no city, and this card is rendered once
          // PER CITY — so the homepage ships three links whose accessible name
          // is byte-identical ("Enrol from $497 — early-bird locked") pointing
          // at three different destinations (byron-bay, melbourne, sydney).
          // Sighted users read the city from the card; a screen reader
          // announces three indistinguishable links, and a link list shows
          // three duplicates with no way to tell which city is which.
          //
          // Same class as the "Unlock — A$497" pair on /learning, found in the
          // same sweep (2026-08-06, master clean register E pass 2): a label
          // that is unambiguous only because of layout, repeated across items.
          aria-label={`Enrol in ${city} from $${CONFIG.COURSE.PRICE_ONLINE} — early-bird locked`}
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#0b6165]"
        >
          Enrol from ${CONFIG.COURSE.PRICE_ONLINE} — early-bird locked
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>

        {done ? (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-emerald-400/15 border border-emerald-300/30 backdrop-blur p-3">
            <Check className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[13px] text-emerald-50 leading-snug">{message}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-2.5">
            <div className="flex gap-2">
              <label htmlFor={`loc-email-${citySlug}`} className="sr-only">Email for {city} workshop updates</label>
              <input
                id={`loc-email-${citySlug}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError('') }}
                placeholder="Email me the date"
                className="flex-1 min-w-0 rounded-xl border border-white/25 bg-white/10 backdrop-blur px-3 py-2 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-white/50"
              />
              <button
                type="submit"
                disabled={loading}
                aria-label={`Notify me about the ${city} workshop`}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-white/95 px-3 py-2 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:bg-white disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <>Notify me <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></>}
              </button>
            </div>
            {error && <p className="mt-1.5 text-[12px] text-red-300 leading-snug">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
