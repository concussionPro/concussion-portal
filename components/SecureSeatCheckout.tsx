'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Loader2, MapPin, Shield } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { trackEvent, getAttribution } from '@/lib/analytics'
import { CheckoutRescue } from '@/components/CheckoutRescue'
import { CheckoutEmailField, useCheckoutEmail } from '@/components/CheckoutEmailField'
import {
  buildSecureSeatUrgency,
  fetchCityProgressRows,
  pickFocusCitySlug,
  type CityProgressRow,
} from '@/lib/secure-seat-urgency'

const CITY_OPTIONS = [
  { slug: 'melbourne', label: 'Melbourne' },
  { slug: 'sydney', label: 'Sydney' },
  { slug: 'byron-bay', label: 'Byron Bay' },
  { slug: 'adelaide', label: 'Adelaide' },
  { slug: 'wa', label: 'Perth (WA)' },
] as const

export type SecureSeatCity = (typeof CITY_OPTIONS)[number]['slug']

export interface SecureSeatCheckoutProps {
  /** Pre-select a city (e.g. from a location card). */
  defaultCity?: SecureSeatCity | string
  /** Hide the city picker when the parent already fixed the city. */
  lockCity?: boolean
  /** Visual density. */
  variant?: 'card' | 'inline' | 'button' | 'hero'
  /** Analytics source tag. */
  source?: string
  /** Frame copy for Online → practical upgrade (Module 8 / learning). */
  forOnlineUpgrade?: boolean
  className?: string
}

/**
 * Unlock your seat — A$100 refundable deposit toward the catered practical day.
 * REPLACES free location EOI as the primary soft-commit CTA (owner 2026-09-05).
 * Counts toward the 12-seat cohort gate; credit to Complete when the date opens;
 * full refund if the cohort does not form. Does NOT unlock online modules.
 *
 * Urgency is HONEST scarcity from /api/city-progress — never fake timers or invented counts.
 */
export function SecureSeatCheckout({
  defaultCity,
  lockCity = false,
  variant = 'card',
  source = 'secure_seat_cta',
  forOnlineUpgrade = false,
  className = '',
}: SecureSeatCheckoutProps) {
  const initial =
    defaultCity && CITY_OPTIONS.some((c) => c.slug === defaultCity)
      ? (defaultCity as SecureSeatCity)
      : 'melbourne'
  const [city, setCity] = useState<SecureSeatCity>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stuckUrl, setStuckUrl] = useState<string | null>(null)
  const [progressRow, setProgressRow] = useState<CityProgressRow | null | undefined>(undefined)
  const {
    email: checkoutEmail,
    setEmail: setCheckoutEmail,
    sessionEmail: checkoutSessionEmail,
    resolved: resolvedCheckoutEmail,
  } = useCheckoutEmail()

  useEffect(() => {
    if (defaultCity && CITY_OPTIONS.some((c) => c.slug === defaultCity)) {
      setCity(defaultCity as SecureSeatCity)
    }
  }, [defaultCity])

  // Prefer live/highest-progress city once when parent did not lock a city.
  useEffect(() => {
    if (lockCity || defaultCity) return
    let cancelled = false
    fetchCityProgressRows().then((rows) => {
      if (cancelled) return
      const focus = pickFocusCitySlug(rows)
      if (CITY_OPTIONS.some((c) => c.slug === focus)) {
        setCity(focus as SecureSeatCity)
      }
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot focus
  }, [lockCity, defaultCity])

  useEffect(() => {
    let cancelled = false
    fetchCityProgressRows().then((rows) => {
      if (cancelled) return
      setProgressRow(rows.find((r) => r.slug === city) ?? null)
    })
    return () => { cancelled = true }
  }, [city])

  const price = CONFIG.COURSE.PRICE_SECURE_SEAT
  const threshold = CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD
  const cityLabel = CITY_OPTIONS.find((c) => c.slug === city)?.label ?? city

  const urgency = useMemo(() => {
    const known = progressRow !== undefined && progressRow !== null
    return buildSecureSeatUrgency({
      cityLabel,
      enrolled: progressRow?.enrolled,
      threshold: progressRow?.threshold ?? threshold,
      progressKnown: known,
      priceAud: price,
      forOnlineUpgrade,
    })
  }, [cityLabel, progressRow, threshold, price, forOnlineUpgrade])

  async function startCheckout() {
    if (loading) return
    if (!resolvedCheckoutEmail) {
      setError('Enter your email so we can send your enrolment link if checkout is interrupted.')
      return
    }
    setLoading(true)
    setError(null)
    setStuckUrl(null)
    try {
      void trackEvent('checkout_start', {
        courseType: 'secure-seat',
        source,
        location: city,
        locationExplicit: true,
      })
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseType: 'secure-seat',
          location: city,
          email: resolvedCheckoutEmail,
          attribution: getAttribution(),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success || !data?.url) {
        setError(
          (data && typeof data.error === 'string' && data.error) ||
            'Checkout unavailable — please try again or contact support.',
        )
        setLoading(false)
        return
      }
      setStuckUrl(data.url)
      window.location.href = data.url
      // Keep spinner if redirect is slow/blocked (CheckoutRescue shows).
      setTimeout(() => setLoading(false), 4000)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const ProgressBadge = urgency.progressLine ? (
    <div className="flex">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
        <span className="text-[11px] font-semibold text-emerald-800 leading-snug">
          {urgency.progressLine}
        </span>
      </span>
    </div>
  ) : null

  if (variant === 'button') {
    return (
      <div className={className}>
        {stuckUrl && <div className="mb-3"><CheckoutRescue url={stuckUrl} /></div>}
        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
        <CheckoutEmailField
          email={checkoutEmail}
          setEmail={setCheckoutEmail}
          sessionEmail={checkoutSessionEmail}
          disabled={loading}
          inputId="secure-seat-checkout-email"
          className="mb-2"
        />
        {!lockCity && (
          <label className="mb-2 block text-xs font-semibold text-slate-600">
            Preferred city
            <select
              value={city}
              onChange={(e) => setCity(e.target.value as SecureSeatCity)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {CITY_OPTIONS.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </label>
        )}
        {ProgressBadge && <div className="mb-2">{ProgressBadge}</div>}
        <button
          type="button"
          onClick={startCheckout}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#0b6165] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <>{urgency.ctaLabel} <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
        <p className="mt-1.5 text-center text-[11px] text-slate-500">
          Refundable · counts toward {threshold} · {cityLabel}
        </p>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 ${className}`}>
        {stuckUrl && <div className="mb-3"><CheckoutRescue url={stuckUrl} /></div>}
        {ProgressBadge && <div className="mb-2">{ProgressBadge}</div>}
        <CheckoutEmailField
          email={checkoutEmail}
          setEmail={setCheckoutEmail}
          sessionEmail={checkoutSessionEmail}
          disabled={loading}
          inputId="secure-seat-checkout-email-inline"
          className="mb-2"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {!lockCity && (
            <label className="flex-1 text-xs font-semibold text-slate-700">
              Preferred city / region
              <select
                value={city}
                onChange={(e) => setCity(e.target.value as SecureSeatCity)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {CITY_OPTIONS.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={startCheckout}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0b6165] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>{urgency.ctaLabel} <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <p className="mt-2 text-[11px] leading-snug text-slate-600">
          {urgency.socialLine}
        </p>
      </div>
    )
  }

  // hero + default card — same content; hero is slightly larger for page tops
  const isHero = variant === 'hero'
  return (
    <div
      className={`rounded-2xl border-2 border-amber-300/70 bg-gradient-to-br from-amber-50 via-white to-teal-50/40 shadow-sm ${
        isHero ? 'p-5 md:p-7' : 'p-5 md:p-6'
      } ${className}`}
    >
      {stuckUrl && <div className="mb-3"><CheckoutRescue url={stuckUrl} /></div>}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
          <MapPin className="h-3 w-3" /> Soft commit
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600">
          <Shield className="h-3 w-3 text-[var(--accent)]" /> A${price} refundable
        </span>
      </div>
      <h3 className={`font-bold tracking-tight text-slate-900 ${isHero ? 'text-xl md:text-2xl' : 'text-lg'}`}>
        {isHero ? urgency.headline : urgency.headlineShort}
      </h3>
      {ProgressBadge && <div className="mt-2.5">{ProgressBadge}</div>}
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {urgency.body}
      </p>
      <ul className="mt-3 space-y-1.5">
        {[
          `Preferred city on checkout — ${cityLabel}`,
          `Counts toward ${threshold} paid commits (with Complete)`,
          'Does not unlock online modules (that is Online / Complete)',
        ].map((line) => (
          <li key={line} className="flex items-start gap-2 text-xs text-slate-700">
            <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--accent)]" strokeWidth={3} />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {!lockCity && (
        <label className="mt-4 block text-xs font-semibold text-slate-700">
          Preferred city / region
          <select
            value={city}
            onChange={(e) => setCity(e.target.value as SecureSeatCity)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            {CITY_OPTIONS.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </label>
      )}
        <CheckoutEmailField
          email={checkoutEmail}
          setEmail={setCheckoutEmail}
          sessionEmail={checkoutSessionEmail}
          disabled={loading}
          inputId="secure-seat-checkout-email-card"
          className="mt-3 mb-1"
        />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition-colors hover:bg-[#0b6165] disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>{urgency.ctaLabel} <ArrowRight className="h-4 w-4" /></>
        )}
      </button>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        {urgency.socialLine} · Stripe · {CONFIG.WORKSHOP.LEAD_TIME_WEEKS}+ weeks&rsquo; notice once confirmed
      </p>
    </div>
  )
}
