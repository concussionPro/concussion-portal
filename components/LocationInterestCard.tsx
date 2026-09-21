'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ArrowRight, Loader2 } from 'lucide-react'
import { trackEvent, trackInterestRegistration } from '@/lib/analytics'
import { CONFIG, workshopDatePage, workshopPriceFor } from '@/lib/config'
import { SecureSeatCheckout } from '@/components/SecureSeatCheckout'
import { buildSecureSeatUrgency } from '@/lib/secure-seat-urgency'

// ─── City momentum (real counts only, shared across all cards) ──────────────
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

function cityHasLiveDate(slug: string): boolean {
  const config = Object.values(CONFIG.LOCATIONS).find((loc) => loc.slug === slug)
  return (
    config?.status === 'confirmed' &&
    !!config.dateObj &&
    config.dateObj.getTime() > Date.now()
  )
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
 * Homepage / pricing workshop-location card.
 *
 * Owner 2026-09-05: primary CTA is Secure your seat (A$100 refundable deposit)
 * — NOT free EOI. Notify-me stays secondary. Live-dated cities keep Enrol Complete
 * as an alternate path into #pricing-cards.
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

  const hasLiveDate = cityHasLiveDate(citySlug)
  const deposit = CONFIG.COURSE.PRICE_SECURE_SEAT
  const seatUrgency = buildSecureSeatUrgency({
    cityLabel: city,
    enrolled: progress?.enrolled,
    threshold: progress?.threshold ?? CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD,
    progressKnown: !!progress,
    priceAud: deposit,
    // Without this a city with a CONFIRMED date still said the deposit "opens
    // the practical day when the cohort fills" (home page, 2026-09-21).
    hasLiveDate,
  })

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
      const localPart = clean.split('@')[0].slice(0, 60)
      const derivedName = localPart.length >= 2 ? localPart : 'Interested'
      const res = await fetch('/api/register-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean, name: derivedName, city: citySlug, source: 'pricing_page_notify' }),
      })
      const data = await res.json()
      if (data.success) {
        trackInterestRegistration(citySlug, clean)
        setMessage(data.message || `You're on the ${city} notify list — we'll email you when the date is confirmed.`)
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
    <div className={`group relative rounded-2xl overflow-hidden bg-slate-950 transition-all duration-300 hover:-translate-y-0.5 ${
      hasLiveDate
        ? 'ring-[3px] ring-accent shadow-[0_18px_50px_-12px_rgba(13,115,119,0.55)] hover:shadow-[0_26px_66px_-12px_rgba(13,115,119,0.7)]'
        : 'opacity-[0.94] shadow-[0_10px_36px_-10px_rgba(15,23,42,0.35)] hover:shadow-[0_20px_56px_-12px_rgba(15,23,42,0.5)] hover:opacity-100'
    }`}>
      <Image
        src={img}
        alt={`${city} — Concussion Clinical Mastery workshop location`}
        fill
        sizes="(min-width: 640px) 340px, 100vw"
        className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-slate-950/10" aria-hidden="true" />

      <div className={`absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 backdrop-blur rounded-full shadow-sm ${
        hasLiveDate ? 'bg-accent px-3 py-1.5' : 'bg-white/95 px-2.5 py-1'
      }`}>
        <span className={`inline-flex rounded-full ${hasLiveDate ? 'h-2 w-2 bg-white animate-pulse' : `h-1.5 w-1.5 ${dotClass}`}`} aria-hidden="true" />
        <span className={`font-bold uppercase tracking-wide ${hasLiveDate ? 'text-[11px] text-white' : `text-[10px] ${statusTextClass}`}`}>{status}</span>
      </div>

      <div className="relative flex flex-col justify-end min-h-[480px] p-4 pt-40">
        <h3 className="text-white text-2xl md:text-[1.75rem] font-bold tracking-tight leading-none [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]">
          {city}
        </h3>
        <p className="mt-1.5 text-[12.5px] text-white/75 leading-snug">{caption}</p>

        {/* Live date: the deposit box below already carries the capacity line. */}
        {seatUrgency.progressLine && !hasLiveDate && (
          <div className="mt-2.5 flex">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 border border-emerald-300/30 backdrop-blur px-2.5 py-1">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <span className="text-[11px] font-semibold text-emerald-100 leading-snug">
                {seatUrgency.progressLine}
              </span>
            </span>
          </div>
        )}

        {/* LIVE DATE: the seat itself is the primary action (2026-09-21). With
            7 November confirmed, this card led with the A$100 deposit and
            offered the actual purchase as a ghost button underneath — the first
            FOUR calls to action on the home page were all the deposit. A
            confirmed date is sold; the deposit is for cities still forming. */}
        {hasLiveDate && (
          <Link
            href={workshopDatePage(citySlug)}
            aria-label={`Take a ${city} seat for $${workshopPriceFor(citySlug)}`}
            onClick={() => trackEvent('location_card_seat_click', { city: citySlug })}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-[15px] font-bold text-slate-900 shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Take a {city} seat — ${workshopPriceFor(citySlug).toLocaleString('en-AU')}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
        {hasLiveDate && (
          <p className="mt-2 text-[11px] font-medium text-white/70">
            Not ready to pay in full? Hold your place with a refundable deposit:
          </p>
        )}

        {/* Forming cities: the deposit IS the primary action (replaces free EOI) */}
        <div className={`${hasLiveDate ? 'mt-1.5' : 'mt-3.5'} rounded-xl bg-white/95 p-2.5 shadow-lg`}>
          <SecureSeatCheckout
            defaultCity={citySlug}
            lockCity
            variant="button"
            source={`location_card_${citySlug}`}
          />
        </div>

        {/* Notify-me — forming cities only. A confirmed date has nothing left to
            be notified about, and "notify me when Melbourne confirms" beside
            "Saturday 7 November 2026" contradicted the card's own badge. */}
        {hasLiveDate ? null : done ? (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-emerald-400/15 border border-emerald-300/30 backdrop-blur p-3">
            <Check className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[13px] text-emerald-50 leading-snug">{message}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-2.5">
            <p className="mb-1.5 text-[11px] font-medium text-white/70">
              Or just email me when {city}&apos;s date is confirmed.
            </p>
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
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-white disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <>Notify me</>}
              </button>
            </div>
            {error && <p className="mt-1.5 text-[12px] text-red-300 leading-snug">{error}</p>}
          </form>
        )}
        <p className="mt-2 text-[10px] text-white/50 leading-snug">
          {hasLiveDate
            ? `A$${deposit} deposit is fully refundable and credited toward the Complete course.`
            : `The A$${deposit} refundable deposit counts toward the ${CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD} enrolments that set a date — an email reminder does not.`}
        </p>
      </div>
    </div>
  )
}
