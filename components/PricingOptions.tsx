'use client'

import { useState, useEffect } from 'react'
import {
  Check,
  ArrowRight,
  Loader2,
  AlertCircle,
  BookOpen,
  Award,
  FileText,
  Bell,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { CONFIG, afterpayInstalment } from '@/lib/config'
import { trackEvent, trackLeadConversion } from '@/lib/analytics'
import { HomepageAiCourseCard } from './HomepageAiCourseCard'

// Google Ads conversion label for paid enrol/checkout clicks (Add to cart)
const ENROL_CLICK_LABEL = 'vHoXCNKd6Y8cEJWXu_9C'

// ─── City catalogue ──────────────────────────────────────────────────────────
//
// Cities offered on the Complete Course tile. Slugs must match what
// /api/register-interest accepts (sydney | melbourne | byron-bay | adelaide |
// wa). Melbourne status comes from CONFIG.LOCATIONS so admin date changes
// flow through automatically. The other four are interest-capture only —
// no live workshops, so clicking them swaps the Enrol button for the
// notify-me form below.
const CITY_OPTIONS = [
  { slug: 'melbourne', label: 'Melbourne' },
  { slug: 'sydney', label: 'Sydney' },
  { slug: 'byron-bay', label: 'Byron' },
  { slug: 'adelaide', label: 'Adelaide' },
  { slug: 'wa', label: 'Perth (WA)' },
] as const

/**
 * True when the selected city has a confirmed workshop date. Currently only
 * Melbourne can hit this branch — Sydney/Byron/Adelaide/WA are all in
 * collecting status.
 */
function isCityConfirmed(slug: string | null | undefined): boolean {
  if (!slug) return false
  const config = Object.values(CONFIG.LOCATIONS).find((loc) => loc.slug === slug)
  return config?.status === 'confirmed'
}

function cityLabel(slug: string): string {
  const opt = CITY_OPTIONS.find((c) => c.slug === slug)
  return opt?.label ?? slug
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PricingOptionsProps {
  variant?: 'full' | 'compact'
}

// ─── Workshop interest form ──────────────────────────────────────────────────

interface WorkshopInterestFormProps {
  citySlug: string
  variant: 'full' | 'compact'
}

function WorkshopInterestForm({ citySlug, variant }: WorkshopInterestFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const label = cityLabel(citySlug)
  const isCompact = variant === 'compact'

  // Reset success/error when the city changes — feedback should belong to
  // the current selection, not a previous click
  useEffect(() => {
    setSuccess(null)
    setError(null)
  }, [citySlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your name.')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email.')
      return
    }

    setSubmitting(true)
    try {
      // Background analytics — non-blocking
      trackEvent('workshop_interest_submit', {
        city: citySlug,
        source: `pricing_${variant}`,
      }).catch(() => {})

      const res = await fetch('/api/register-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          city: citySlug,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setError(data?.error || 'Could not submit — please try again.')
      } else {
        setSuccess(data.message || `Thanks — we'll email you when ${label} is confirmed.`)
        setName('')
        setEmail('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Confirmed-state success view — show only the message, no form
  if (success) {
    return (
      <div className={`rounded-xl bg-emerald-50 border border-emerald-200 ${isCompact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-start gap-2">
          <Check className={`text-emerald-600 flex-shrink-0 mt-0.5 ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} strokeWidth={2.5} />
          <p className={`text-emerald-900 leading-snug ${isCompact ? 'text-xs' : 'text-sm'}`}>{success}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50/60 ${isCompact ? 'p-3' : 'p-4'}`}>
      <div className={`flex items-start gap-2 ${isCompact ? 'mb-2' : 'mb-3'}`}>
        <Bell className={`text-[var(--accent)] flex-shrink-0 mt-0.5 ${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
        <div>
          <p className={`font-semibold text-foreground leading-tight ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {`${label} workshop isn’t confirmed yet`}
          </p>
          <p className={`text-muted-foreground leading-snug mt-0.5 ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
            Drop your details — you&apos;ll be first to know when the date is locked in, and registered-list pricing is locked in for you (no deadline).
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2" noValidate>
        <input
          type="text"
          name="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          autoComplete="name"
          className={`w-full rounded-lg border border-slate-300 bg-white px-3 ${isCompact ? 'py-1.5 text-xs' : 'py-2 text-sm'} text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] disabled:opacity-50`}
          aria-label="Your name"
        />
        <input
          type="email"
          name="email"
          placeholder="you@clinic.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          autoComplete="email"
          inputMode="email"
          className={`w-full rounded-lg border border-slate-300 bg-white px-3 ${isCompact ? 'py-1.5 text-xs' : 'py-2 text-sm'} text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] disabled:opacity-50`}
          aria-label="Your email"
        />
        {error && (
          <p role="alert" className={`text-red-700 leading-snug ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full rounded-lg font-semibold flex items-center justify-center gap-2 bg-[var(--foreground)] text-white hover:bg-[var(--foreground)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isCompact ? 'py-2 px-4 text-xs' : 'py-2.5 px-5 text-sm'}`}
        >
          {submitting ? (
            <Loader2 className={`animate-spin ${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
          ) : (
            <>
              <Bell className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
              Notify me when {label} opens
            </>
          )}
        </button>
        <p className={`text-center text-muted-foreground leading-snug ${isCompact ? 'text-[10px]' : 'text-[11px]'}`}>
          Or <Link href="/pricing#pricing-cards" className="text-[var(--accent)] underline underline-offset-2 hover:text-[var(--accent)]/80">enrol in the online course (${CONFIG.COURSE.PRICE_ONLINE})</Link> and add the workshop later.
        </p>
      </form>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PricingOptions({ variant = 'full' }: PricingOptionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isCompact = variant === 'compact'

  // Early bird: check deadline. Server is source of truth at checkout.
  const isEarlyBird = new Date() < new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T23:59:59')

  // Read pre-selected location, promo code, and UTM params from URL.
  //
  // Default to Melbourne — it's the only confirmed workshop, so any user
  // clicking the Complete Course button without an explicit choice is
  // overwhelmingly going to want Melbourne. Defaulting prevents the
  // "Enrol Now with no location" footgun that previously sent a full-course
  // checkout to Stripe with location=undefined. URL ?location= still wins.
  const [selectedLocation, setSelectedLocation] = useState<string>('melbourne')
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [utmParams, setUtmParams] = useState<Record<string, string>>({})
  const [bookOwner, setBookOwner] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const loc = params.get('location')
    if (loc && CITY_OPTIONS.some((c) => c.slug === loc)) {
      setSelectedLocation(loc)
    }
    const promo = params.get('promo')
    if (promo) {
      setPromoCode(promo)
    }
    // Capture UTM params for Stripe attribution
    const utm: Record<string, string> = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'gclid', 'fbclid']) {
      const val = params.get(key)
      if (val) utm[key] = val
    }
    if (Object.keys(utm).length > 0) setUtmParams(utm)
    // Detect bundle-owner status — if true, show discounted course prices
    fetch('/api/auth/session', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user?.bookOwner) setBookOwner(true)
      })
      .catch(() => { /* not logged in — pricing shows full retail */ })
  }, [])


  // Bundle owners get A$100 off online-only and full-course (applied at checkout)
  const BUNDLE_DISCOUNT = 100
  const onlinePrice = bookOwner ? CONFIG.COURSE.PRICE_ONLINE - BUNDLE_DISCOUNT : CONFIG.COURSE.PRICE_ONLINE
  const fullCoursePrice = bookOwner
    ? (isEarlyBird ? CONFIG.COURSE.PRICE_EARLY_BIRD - BUNDLE_DISCOUNT : CONFIG.COURSE.PRICE_REGULAR - BUNDLE_DISCOUNT)
    : (isEarlyBird ? CONFIG.COURSE.PRICE_EARLY_BIRD : CONFIG.COURSE.PRICE_REGULAR)

  const handleCheckout = async (courseType: 'online-only' | 'full-course') => {
    try {
      setLoading(courseType)
      setError(null)

      // Fire analytics in background (non-blocking)
      trackEvent('checkout_start', { courseType, source: 'pricing_page', location: selectedLocation })
        .catch(() => {})

      // Fire Google Ads conversion in background (non-blocking)
      const conversionValue = courseType === 'full-course' ? fullCoursePrice : onlinePrice
      trackLeadConversion(ENROL_CLICK_LABEL, conversionValue)
        .catch(() => {})

      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseType,
          ...(courseType === 'full-course' && selectedLocation ? { location: selectedLocation } : {}),
          ...(promoCode ? { promoCode } : {}),
          ...(Object.keys(utmParams).length > 0 ? { utm: utmParams } : {}),
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        console.error('[checkout] API error:', res.status, text)
        setError('Checkout unavailable — please try again or contact support.')
        setLoading(null)
        return
      }

      const data = await res.json().catch(() => ({ success: false, error: 'Unexpected server response' }))

      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(null)
      }
    } catch (err) {
      console.error('[checkout] Error:', err)
      setError('Something went wrong. Please try again or contact support.')
      setLoading(null)
    }
  }

  // COMPACT VARIANT
  if (isCompact) {
    return (
      <div className="space-y-4">
        {error && (
          <div role="alert" aria-live="assertive" className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 pt-5">
          {/* CCM Online - Compact (online component of CCM) */}
          <div className="card card-visible rounded-xl p-5 flex flex-col relative" style={{ borderWidth: '1.5px', borderColor: 'rgba(13, 115, 119, 0.15)' }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50">
                <BookOpen className="w-4 h-4 text-[var(--accent)]" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[var(--accent)] border border-teal-200">
                Online tier
              </span>
            </div>

            <h3 className="text-sm font-bold text-[var(--foreground)] mb-0.5">CCM Online</h3>
            <p className="text-[10px] text-slate-500 mb-3">Online component of Concussion Clinical Mastery — no workshop</p>

            <div className="mb-3">
              {bookOwner && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs text-[var(--muted-foreground)] line-through">${CONFIG.COURSE.PRICE_ONLINE}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">Bundle −${BUNDLE_DISCOUNT}</span>
                </div>
              )}
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-[var(--foreground)]">${onlinePrice}</span>
                <span className="text-[10px] text-slate-400">≈ $320 USD</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">or 4 x ${afterpayInstalment(onlinePrice)} with Afterpay or Klarna</p>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">One-time · Lifetime access · 8 CPD hours</p>
            </div>

            <ul className="space-y-1.5 mb-4 flex-1">
              {[
                'Same 8 online modules as the full CCM',
                'Own pace — no deadlines',
                'Clinical Toolkit & resources',
                'Upgrade to add the workshop anytime',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3 h-3 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-[var(--muted-foreground)]">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout('online-only')}
              disabled={loading !== null}
              className="btn-primary w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading === 'online-only' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                `Enrol Now — $${onlinePrice}`
              )}
            </button>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-2 text-center italic">
              &ldquo;Relevant, applicable and easy to absorb&rdquo; — Sarah, Physio
            </p>
          </div>

          {/* CCM Complete - Compact (online + workshop, MOST POPULAR) */}
          <div className="card card-visible rounded-xl p-5 flex flex-col relative" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.3)' }}>
            <div className="flex items-center gap-2.5 mb-3 flex-wrap">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200/50">
                <Award className="w-4 h-4 text-orange-500" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[var(--accent)] border border-teal-200">
                Most Popular
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                + Workshop
              </span>
            </div>

            <h3 className="text-sm font-bold text-[var(--foreground)] mb-0.5">CCM Complete</h3>
            <p className="text-[10px] text-slate-500 mb-3">Full Concussion Clinical Mastery — online modules + hands-on workshop</p>

            <div className="mb-4">
              {isEarlyBird ? (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[var(--foreground)]">${fullCoursePrice.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400">≈ $770 USD</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">or 4 x ${afterpayInstalment(fullCoursePrice)} with Afterpay or Klarna</p>
                  <p className="text-[10px] text-[var(--accent)] font-medium mt-0.5">Registered-list pricing — locked in for everyone on the interest list</p>
                </>
              ) : (
                <>
                  {bookOwner && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm text-[var(--muted-foreground)] line-through">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">Bundle −${BUNDLE_DISCOUNT}</span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[var(--foreground)]">${fullCoursePrice.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400">≈ $910 USD</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">or 4 x ${afterpayInstalment(fullCoursePrice)} with Afterpay or Klarna</p>
                </>
              )}
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">One-time · 14 AHPRA CPD hours</p>
            </div>

            {/* Next workshop — Melbourne */}
            {CONFIG.LOCATIONS.MELBOURNE.status === 'confirmed' && (
              <div className="mb-3 rounded-lg border border-orange-200 bg-orange-50 overflow-hidden">
                <div className="flex items-stretch">
                  <div className="relative w-[80px] flex-shrink-0 bg-slate-900">
                    <Image
                      src="/melbourne-workshop.jpg"
                      alt="Melbourne workshop"
                      fill
                      sizes="80px"
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1 px-2.5 py-2 min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-orange-700 mb-0.5">
                      Next workshop
                    </p>
                    <p className="text-xs font-semibold text-slate-900 leading-tight">
                      Melbourne · {CONFIG.LOCATIONS.MELBOURNE.date}
                    </p>
                    <p className="text-[10px] text-orange-800 mt-0.5 leading-snug">
                      Rydges Exhibition St · 8am–4pm · catered lunch
                    </p>
                    <p className="text-[10px] font-semibold text-orange-800 mt-0.5 leading-snug">
                      {CONFIG.WORKSHOP.CAPACITY_PER_COURSE} seats max
                    </p>
                  </div>
                </div>
              </div>
            )}

            <ul className="space-y-1.5 mb-4 flex-1">
              {[
                'Everything in Online, plus:',
                'Full-day workshop (6 CPD hours)',
                'Hands-on SCAT6, VOMS, BESS',
                CONFIG.LOCATIONS.MELBOURNE.status === 'confirmed'
                  ? 'Sydney & Byron Bay added when demand hits'
                  : 'Choose your preferred AU location',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3 h-3 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className={`text-[var(--muted-foreground)] ${i === 0 ? 'font-semibold' : ''}`}>{f}</span>
                </li>
              ))}
            </ul>

            {isCityConfirmed(selectedLocation) ? (
              <>
                <button
                  onClick={() => handleCheckout('full-course')}
                  disabled={loading !== null}
                  className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-[var(--foreground)] text-white hover:bg-[var(--foreground)]/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'full-course' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    `Enrol Now — $${fullCoursePrice.toLocaleString()}`
                  )}
                </button>

                <p className="text-[10px] text-[var(--muted-foreground)] mt-2 text-center italic">
                  &ldquo;Hands on component was invaluable&rdquo; — Amelia
                </p>
              </>
            ) : (
              <WorkshopInterestForm citySlug={selectedLocation} variant="compact" />
            )}

          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-[var(--muted-foreground)]">
          {['Afterpay / Klarna', '7-Day Guarantee', 'Secure Checkout', 'AHPRA Aligned'].map(item => (
            <div key={item} className="flex items-center gap-1">
              <Check className="w-3 h-3 text-[var(--accent)]" strokeWidth={2.5} />
              {item}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // FULL VARIANT
  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Promo code banner — concrete numbers, not vague reassurance.
          The Day 28 / Day 42 promo emails drove 100% bounce on /pricing
          arrivals: clinicians clicked, didn't see the discount visibly
          applied, didn't trust it, left. */}
      {promoCode === CONFIG.COURSE.PROMO_CODE && (
        <div className="max-w-3xl mx-auto mb-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white">
              <Check className="w-4.5 h-4.5" strokeWidth={3} />
            </span>
            <div className="text-center">
              <p className="text-sm font-semibold text-emerald-900 leading-tight">
                <span className="font-bold">$50 off applied</span> &middot; Online Course is{' '}
                <span className="font-bold">A${(CONFIG.COURSE.PRICE_ONLINE - 50).toLocaleString()}</span>
                <span className="text-emerald-700/80 font-normal"> (was <s>A${CONFIG.COURSE.PRICE_ONLINE.toLocaleString()}</s>)</span>
              </p>
              <p className="text-xs text-emerald-800/80 mt-0.5">
                Code <code className="font-mono font-semibold bg-emerald-100 px-1 rounded">{promoCode}</code> auto-fills at checkout. No need to enter anything.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Generic banner for unknown promo codes — fallback */}
      {promoCode && promoCode !== CONFIG.COURSE.PROMO_CODE && (
        <div className="max-w-2xl mx-auto mb-6 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2.5} />
          <span className="text-emerald-800 font-semibold">Promo code {promoCode} will be applied at checkout</span>
        </div>
      )}

      {/* Global error */}
      {error && (
        <div role="alert" aria-live="assertive" className="max-w-2xl mx-auto mb-8 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Pricing Cards — 3 equal-sized bento tiles. items-stretch forces
          all three cells to the same height so cards match regardless of
          content length. */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 pt-5 items-stretch">

        {/* ── AI in Clinical Practice — coming-soon tier (replaces never-sold Reference + Toolkit) ── */}
        <HomepageAiCourseCard />


        {/* ── CCM Online — online component of CCM ────────────────── */}
        <div
          className="card card-visible rounded-2xl p-5 md:p-6 flex flex-col relative"
          style={{ borderWidth: '1.5px', borderColor: 'rgba(13, 115, 119, 0.15)' }}
        >
          {/* Header row: badge left, price right */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50 flex-shrink-0">
                <BookOpen className="w-4.5 h-4.5 text-[var(--accent)]" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-[var(--accent)] border border-teal-200">
                Online tier
              </span>
            </div>
            <div className="text-right flex-shrink-0">
              {bookOwner && (
                <div className="flex items-center gap-1.5 justify-end mb-0.5">
                  <span className="text-[11px] text-[var(--muted-foreground)] line-through">${CONFIG.COURSE.PRICE_ONLINE}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                    −${BUNDLE_DISCOUNT}
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-2xl font-bold text-[var(--foreground)] tracking-tight">${onlinePrice}</span>
                <span className="text-[11px] text-[var(--muted-foreground)]">AUD</span>
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)]">or 4 x ${afterpayInstalment(onlinePrice)}</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-[var(--foreground)] mb-0.5">CCM Online</h3>
          <p className="text-[12px] text-slate-500 mb-2 font-medium">Online component of Concussion Clinical Mastery — no workshop</p>
          <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed mb-4">
            Same 8 modules as the full CCM, at your own pace. Add the hands-on workshop anytime to upgrade.
          </p>

          {/* Visual: CCM Online course preview screenshot */}
          <div className="relative rounded-xl overflow-hidden border border-teal-100 mb-4 h-[120px] bg-white">
            <Image
              src="/ccm-online-preview.png"
              alt="CCM Online course preview interface"
              fill
              sizes="(min-width: 1024px) 340px, 100vw"
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/30 pointer-events-none" aria-hidden="true" />
          </div>

          {/* 2-col feature bento */}
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-5">
            {[
              '8 modules · 8 CPD',
              'VOMS, BESS & SCAT6',
              'Pathophysiology',
              'Clinical Toolkit',
              'Lifetime access',
              'Workshop upgrade',
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px]">
                <Check className="w-3 h-3 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[var(--muted-foreground)]">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleCheckout('online-only')}
            disabled={loading !== null}
            className="btn-primary w-full py-3 px-5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {loading === 'online-only' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Enrol Now — ${onlinePrice}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <Link
            href="/preview"
            className="text-[12px] text-[var(--muted-foreground)] hover:text-[var(--accent)] font-medium text-center mt-2.5 transition-colors"
          >
            Preview course content →
          </Link>
        </div>

        {/* ── CCM Complete — online + workshop, MOST POPULAR ────────── */}
        <div className="card card-visible rounded-2xl p-5 md:p-6 flex flex-col relative" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.3)' }}>
          {/* Header row: badge left, price right */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200/50 flex-shrink-0">
                <Award className="w-4.5 h-4.5 text-orange-500" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-[var(--accent)] border border-teal-200">
                Most Popular
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                + Workshop
              </span>
            </div>
            <div className="text-right flex-shrink-0">
              {isEarlyBird ? (
                <>
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-2xl font-bold text-[var(--foreground)] tracking-tight">${fullCoursePrice.toLocaleString()}</span>
                    <span className="text-[11px] text-[var(--muted-foreground)]">AUD</span>
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">or 4 x ${afterpayInstalment(fullCoursePrice)}</p>
                </>
              ) : (
                <>
                  {bookOwner && (
                    <div className="flex items-center gap-1.5 justify-end mb-0.5">
                      <span className="text-[11px] text-[var(--muted-foreground)] line-through">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">−${BUNDLE_DISCOUNT}</span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-2xl font-bold text-[var(--foreground)] tracking-tight">${fullCoursePrice.toLocaleString()}</span>
                    <span className="text-[11px] text-[var(--muted-foreground)]">AUD</span>
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">or 4 x ${afterpayInstalment(fullCoursePrice)}</p>
                </>
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-[var(--foreground)] mb-0.5">CCM Complete</h3>
          <p className="text-[12px] text-slate-500 mb-2 font-medium">Full Concussion Clinical Mastery — online modules + hands-on workshop</p>
          <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed mb-4">
            Same 8 online modules as CCM Online, plus a full-day hands-on workshop. Practice SCAT6, VOMS &amp; BESS with expert feedback.
          </p>

          {/* Melbourne workshop mini-tile — thumbnail + date */}
          {CONFIG.LOCATIONS.MELBOURNE.status === 'confirmed' && (
            <div className="rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden mb-4">
              <div className="flex items-stretch">
                <div className="relative w-[90px] flex-shrink-0 bg-slate-900">
                  <Image
                    src="/melbourne-workshop.jpg"
                    alt="Melbourne workshop · 13 June 2026"
                    fill
                    sizes="90px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 p-2.5 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse flex-shrink-0" aria-hidden="true" />
                    <p className="text-[10px] font-bold uppercase tracking-wide text-orange-700">
                      Next workshop confirmed
                    </p>
                  </div>
                  <p className="text-[12px] font-bold text-slate-900 leading-tight">
                    Melbourne · {CONFIG.LOCATIONS.MELBOURNE.date}
                  </p>
                  <p className="text-[11px] text-slate-700 leading-snug mt-0.5">
                    Rydges CBD · 8am–4pm · catered
                  </p>
                  <p className="text-[11px] font-semibold text-orange-800 mt-1 leading-snug">
                    {CONFIG.WORKSHOP.CAPACITY_PER_COURSE} seats max
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2-col feature grid */}
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-4">
            {[
              'Everything in Online',
              'Full-day workshop',
              'SCAT6, VOMS, BESS',
              '1:1 expert feedback',
              '14 AHPRA CPD',
              'AU locations',
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px]">
                <Check className="w-3 h-3 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[var(--muted-foreground)]">{feature}</span>
              </li>
            ))}
          </ul>

          {/* City picker. "Later" button removed — it let users click Enrol
              with no city, sending location=undefined to Stripe and creating
              an ops mess. Default selection is Melbourne (only confirmed
              workshop). Cities without a confirmed date show a notify-me
              form below instead of the Enrol button. */}
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-1.5">City</p>
            <div className="flex flex-wrap gap-1">
              {CITY_OPTIONS.map((city) => (
                <button
                  key={city.slug}
                  type="button"
                  onClick={() => setSelectedLocation(city.slug)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                    selectedLocation === city.slug
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'bg-white text-[var(--foreground)] border-slate-200 hover:border-[var(--accent)]/50'
                  }`}
                  aria-pressed={selectedLocation === city.slug}
                >
                  {city.label}
                </button>
              ))}
            </div>
          </div>

          {isCityConfirmed(selectedLocation) ? (
            <>
              <button
                onClick={() => handleCheckout('full-course')}
                disabled={loading !== null}
                className="w-full py-3 px-5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-[var(--foreground)] text-white hover:bg-[var(--foreground)]/90 transition-colors"
              >
                {loading === 'full-course' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Enrol Now — ${fullCoursePrice.toLocaleString()}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {isEarlyBird && (
                <p className="text-[10px] text-[var(--accent)] font-medium text-center mt-2">
                  Registered-list pricing — locked in for everyone on the interest list
                </p>
              )}
            </>
          ) : (
            <WorkshopInterestForm citySlug={selectedLocation} variant="full" />
          )}
        </div>
      </div>

      {/* Trust Signals */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[var(--muted-foreground)]">
        {['Afterpay / Klarna', '7-Day Guarantee', 'Secure Checkout', 'AHPRA Aligned', 'Lifetime Access', 'Certificate Included'].map(item => (
          <div key={item} className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={2.5} />
            {item}
          </div>
        ))}
      </div>

      {/* Team / clinic training callout — for clinic owners + sports orgs browsing the pricing page */}
      <div className="mt-12 max-w-3xl mx-auto rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/60 to-emerald-50/40 p-6 md:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-800 mb-1">For clinics + organisations</p>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1">Training a whole team?</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              In-house team training for clinics, sports organisations, and hospital networks — Concussion + AI in Clinical Practice, delivered on-site or live online around your workflow.
            </p>
          </div>
          <a
            href="/team-training"
            className="shrink-0 inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors whitespace-nowrap"
          >
            Send a team inquiry
          </a>
        </div>
      </div>
    </div>
  )
}
