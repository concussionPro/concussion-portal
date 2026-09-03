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
import { CONFIG, afterpayInstalment, defaultNominationCity, isEarlyBirdForLocation, upgradePriceFor, workshopPriceFor, daysUntilCpdYearEnd, CPD_YEAR_END_LABEL, CPD_HOURS_PHYSIO, CPD_HOURS_OSTEO } from '@/lib/config'
import { trackEvent, trackLeadConversion, getAttribution } from '@/lib/analytics'
import { PaymentMethodsStrip } from '@/components/PaymentMethodsStrip'

// Google Ads conversion label for paid enrol/checkout clicks (Add to cart)
const ENROL_CLICK_LABEL = 'vHoXCNKd6Y8cEJWXu_9C'

// ─── City catalogue ──────────────────────────────────────────────────────────
//
// Cities offered on the Complete Course tile. Slugs must match
// /api/register-interest AND lib/schemas locationSchema. Every city is
// buyable at any time (nomination model, 2026-07-02): a city without a live
// scheduled date sells at the $1,190 early-bird rate as a nomination — the
// date launches when the city hits the confirmation threshold.
const CITY_OPTIONS = [
  { slug: 'melbourne', label: 'Melbourne' },
  { slug: 'sydney', label: 'Sydney' },
  { slug: 'byron-bay', label: 'Byron Bay' },
  { slug: 'adelaide', label: 'Adelaide' },
  { slug: 'wa', label: 'Perth (WA)' },
] as const

/** True when the city has a confirmed, future-dated round (a live date). */
function cityHasLiveDate(slug: string | null | undefined): boolean {
  if (!slug) return false
  const config = Object.values(CONFIG.LOCATIONS).find((loc) => loc.slug === slug)
  return (
    config?.status === 'confirmed' &&
    !!config.dateObj &&
    config.dateObj.getTime() > Date.now()
  )
}

/** True when ANY city currently has a confirmed, future-dated round. */
function anyCityHasLiveDate(): boolean {
  return CITY_OPTIONS.some((c) => cityHasLiveDate(c.slug))
}

function cityLabel(slug: string): string {
  const opt = CITY_OPTIONS.find((c) => c.slug === slug)
  return opt?.label ?? slug
}

// ─── City momentum (real counts only) ────────────────────────────────────────
//
// /api/city-progress returns TRUE round-scoped paid-nomination counts. A low
// count is anti-social-proof ("1 of 8" reads as an empty room), so a numeric
// momentum line renders ONLY when enrolled >= MOMENTUM_MIN_ENROLLED. Below
// that, nothing numeric renders — the neutral nomination explainer covers it.
// Never fabricate; never show zeros; interest counts are never shown here.
export const MOMENTUM_MIN_ENROLLED = 5

interface CityProgress {
  slug: string
  label: string
  enrolled: number
  threshold: number
  interested: number
  hasLiveDate: boolean
  date: string | null
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PricingOptionsProps {
  variant?: 'full' | 'compact'
  /** Which stream's copy, features and checkout the cards run. The VISUAL
   *  bento is identical for both — owner: BOTH STREAMS ATTEND THE SAME
   *  PRACTICAL DAY, and the cards must never drift apart again. */
  stream?: 'ccm' | 'crm'
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
          <div>
            <p className={`text-emerald-900 leading-snug ${isCompact ? 'text-xs' : 'text-sm'}`}>{success}</p>
            {/* Was a pure dead end: the visitor most likely to buy — they just
                told us the city they want — was left with nothing to do next.
                The online tier is the honest next step here, because it needs
                no date and its full value is available immediately. */}
            <p className={`mt-1.5 text-emerald-800/90 leading-snug ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
              In the meantime you can{' '}
              <Link href="/pricing#pricing-cards" className="font-semibold underline underline-offset-2">
                start the 8 online modules today for ${CONFIG.COURSE.PRICE_ONLINE}
              </Link>{' '}
              — every dollar counts toward the Complete course when your date launches.
            </p>
          </div>
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
            {`Get a date alert for ${label}`}
          </p>
          <p className={`text-muted-foreground leading-snug mt-0.5 ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
            Drop your details — you&apos;ll be first to know when the {label} date is locked in.
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

export function PricingOptions({ variant = 'full', stream = 'ccm' }: PricingOptionsProps) {
  const crm = stream === 'crm'
  // Set only when a checkout redirect was ordered but this page is still
  // alive shortly afterwards — i.e. the browser/network refused the
  // navigation (corporate proxies blocking stripe.com do exactly this).
  const [stuckCheckoutUrl, setStuckCheckoutUrl] = useState<string | null>(null)
  // A blocked navigation usually lands on a browser error page and the buyer
  // presses Back — the page reloads and in-memory state is gone. Persist the
  // minted URL so the rescue panel is waiting when they return (observed:
  // one buyer created 11 sessions in 3 minutes doing exactly this loop).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('cea-checkout-pending')
      if (raw) {
        const { url, t } = JSON.parse(raw)
        if (url && Date.now() - t < 10 * 60 * 1000) setStuckCheckoutUrl(url)
        else sessionStorage.removeItem('cea-checkout-pending')
      }
    } catch { /* storage unavailable — same-page timer still covers us */ }
  }, [])
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isCompact = variant === 'compact'

  // Read pre-selected location, promo code, and UTM params from URL.
  //
  // Default nomination = the first city the nurture crons still cover
  // (defaultNominationCity, derived from CONFIG.LOCATIONS status). It was
  // hardcoded to Melbourne, which is 'completed' — a buyer who accepted the
  // default was nominated into a city the reservation, momentum and
  // pre-workshop lanes all skip. Buyers can still pick any city, Melbourne
  // included; only the untouched default is constrained.
  const [selectedLocation, setSelectedLocation] = useState<string>(defaultNominationCity() ?? '')
  // Did the BUYER choose this city, or is it just the mount default?
  //
  // `selectedLocation` initialises to defaultNominationCity() so the full-course
  // card can price a city immediately. That default is fine for PRICING and
  // fatal as a NOMINATION: an online-only buyer never sees a city control, so
  // recording the default as their nominated city invents demand for whichever
  // city happens to be declared first in CONFIG.LOCATIONS (currently Sydney).
  // That number decides which city gets booked, so a default must never reach it.
  //
  // Set by an explicit picker click or by a ?location= link (user-originated
  // either way). Never by the mount default.
  const [locationExplicit, setLocationExplicit] = useState(false)
  const [cityProgress, setCityProgress] = useState<Record<string, CityProgress>>({})
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [utmParams, setUtmParams] = useState<Record<string, string>>({})
  const [bookOwner, setBookOwner] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const loc = params.get('location')
    if (loc && CITY_OPTIONS.some((c) => c.slug === loc)) {
      setSelectedLocation(loc)
      setLocationExplicit(true)
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
    // Real city momentum counts — one fetch on mount, silent failure (the
    // tile renders fine without it; we never block or error the buy surface)
    fetch('/api/city-progress')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data.cities)) return
        const map: Record<string, CityProgress> = {}
        for (const c of data.cities as CityProgress[]) map[c.slug] = c
        setCityProgress(map)
      })
      .catch(() => { /* momentum line simply doesn't render */ })
    // Detect bundle-owner status — if true, show discounted course prices
    fetch('/api/auth/session', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user?.bookOwner) setBookOwner(true)
      })
      .catch(() => { /* not logged in — pricing shows full retail */ })
  }, [])


  // Bundle owners get A$100 off online-only and full-course (applied at checkout).
  // Complete Course price is early-bird-aware per selected city ($1,190 with
  // no live scheduled date; $1,400 only inside the final window of a
  // scheduled round). Server (lib/stripe.ts) is the source of truth at checkout.
  const BUNDLE_DISCOUNT = CONFIG.COURSE.BUNDLE_OWNER_DISCOUNT_AUD
  const bundleApplies = !crm && bookOwner
  const onlinePrice = bundleApplies ? CONFIG.COURSE.PRICE_ONLINE - BUNDLE_DISCOUNT : CONFIG.COURSE.PRICE_ONLINE
  const earlyBird = isEarlyBirdForLocation(selectedLocation)
  const fullCourseBase = workshopPriceFor(selectedLocation)
  const fullCoursePrice = bundleApplies ? fullCourseBase - BUNDLE_DISCOUNT : fullCourseBase
  const hasLiveDate = cityHasLiveDate(selectedLocation)
  // Momentum line for the selected city — renders ONLY when the true enrolled
  // count is genuinely motivating (>= MOMENTUM_MIN_ENROLLED). Never zeros,
  // never interest counts, never fabricated.
  const selectedProgress = cityProgress[selectedLocation]
  const showMomentum = !!selectedProgress && selectedProgress.enrolled >= MOMENTUM_MIN_ENROLLED

  const handleCheckout = async (courseType: 'online-only' | 'full-course') => {
    // Only reachable when no city is open (defaultNominationCity() === null).
    // lib/schemas rejects a full-course without a location, so ask for one
    // instead of letting the buyer hit a generic "Invalid request."
    if (courseType === 'full-course' && !selectedLocation) {
      setError('Please choose your workshop city.')
      return
    }
    try {
      setLoading(courseType)
      setError(null)

      // Fire analytics in background (non-blocking)
      trackEvent('checkout_start', {
        courseType,
        source: 'pricing_page',
        location: selectedLocation,
        // Whether the buyer CHOSE the city or it is the mount default — without
        // this, checkout_start reports the default as if it were a preference
        // (the audit trail behind the 2026-08-10 phantom-Sydney nomination).
        locationExplicit,
      }).catch(() => {})

      // Fire Google Ads conversion in background (non-blocking)
      const conversionValue = courseType === 'full-course' ? fullCoursePrice : onlinePrice
      trackLeadConversion(ENROL_CLICK_LABEL, conversionValue)
        .catch(() => {})

      const res = await fetch(crm ? '/api/crm/checkout' : '/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(crm ? {
          tier: courseType === 'full-course' ? 'complete' : 'online',
          ...(selectedLocation ? { location: selectedLocation } : {}),
          ...(Object.keys(utmParams).length > 0 ? { utm: utmParams } : {}),
          attribution: getAttribution(),
        } : {
          courseType,
          ...(courseType === 'full-course' && selectedLocation ? { location: selectedLocation } : {}),
          // Online-only: send the city ONLY if the buyer picked one. An
          // untouched default is not a nomination — see locationExplicit.
          ...(courseType === 'online-only' && selectedLocation && locationExplicit
            ? { preferredCity: selectedLocation }
            : {}),
          ...(promoCode ? { promoCode } : {}),
          ...(Object.keys(utmParams).length > 0 ? { utm: utmParams } : {}),
          attribution: getAttribution(),
        }),
      })

      if (!res.ok) {
        // Business-rule rejections (workshop sold out / already ran) come back
        // as JSON with a buyer-readable error — show it instead of a generic line.
        const data = await res.json().catch(() => null)
        console.error('[checkout] API error:', res.status, data)
        setError(
          (data && typeof data.error === 'string' && data.error) ||
            'Checkout unavailable — please try again or contact support.'
        )
        setLoading(null)
        return
      }

      const data = await res.json().catch(() => ({ success: false, error: 'Unexpected server response' }))

      if (data.success && data.url) {
        try { sessionStorage.setItem('cea-checkout-pending', JSON.stringify({ url: data.url, t: Date.now() })) } catch {}
        window.location.href = data.url
        // If we're still here in 2.5s the redirect was blocked — give the
        // buyer the raw link (new tab beats proxy interception) instead of
        // letting them rage-click Enrol into a pile of dead sessions.
        setTimeout(() => {
          setStuckCheckoutUrl(data.url)
          setLoading(null)
        }, 2500)
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
      {stuckCheckoutUrl && (
        <div className="max-w-3xl mx-auto mb-4 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-bold text-amber-900 mb-1">Checkout didn&apos;t open?</p>
          <p className="text-[13px] text-amber-900/85 mb-2">
            Some clinic and hospital networks block payment pages. Your secure checkout is ready — open it directly:
          </p>
          <a href={stuckCheckoutUrl} target="_blank" rel="noopener"
             className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white">
            Open secure checkout →
          </a>
          <p className="text-[11px] text-amber-900/70 mt-2">
            Still blocked? It works from a phone on mobile data — or reply to any of our emails and we&apos;ll send the link.
          </p>
        </div>
      )}
        {error && (
          <div role="alert" aria-live="assertive" className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6 pt-5 max-w-3xl mx-auto">
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
            <p className="text-[10px] text-slate-500 mb-3">{crm ? 'Online component of Concussion Rehab Mastery — no workshop' : 'Online component of Concussion Clinical Mastery — no workshop'}</p>

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
                'Everything you pay counts toward the Complete course — upgrade for just the difference when your city\u2019s date launches',
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
            <PaymentMethodsStrip />
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
              {(earlyBird || bookOwner) && (
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="text-sm text-[var(--muted-foreground)] line-through">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</span>
                  {earlyBird && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Early bird</span>
                  )}
                  {bookOwner && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">Bundle −${BUNDLE_DISCOUNT}</span>
                  )}
                </div>
              )}
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-[var(--foreground)]">${fullCoursePrice.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400">AUD</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">or 4 x ${afterpayInstalment(fullCoursePrice)} with Afterpay or Klarna</p>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">One-time · 16 CPD hours (8 online + 8 in-person)</p>
              {earlyBird && (
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  Standard ${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()} applies in the final {CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE} days before each scheduled workshop.
                </p>
              )}
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
                'Full-day workshop (8 CPD hours)',
                'Hands-on oculomotor + cranial nerve exam',
                CONFIG.LOCATIONS.MELBOURNE.status === 'confirmed'
                  ? 'More AU cities added when demand hits'
                  : 'Choose your preferred AU location',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3 h-3 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className={`text-[var(--muted-foreground)] ${i === 0 ? 'font-semibold' : ''}`}>{f}</span>
                </li>
              ))}
            </ul>

            {/* City picker — the COMPACT variant had none, so a /preview buyer
                clicking "Enrol Now — $1,190" was silently nominated into
                defaultNominationCity() (the first 'collecting' city, i.e.
                Sydney) for a city they were never shown. workshopLocation is
                the nomination: it feeds the Ready-to-Train threshold and
                decides which pre-workshop nurture lane they land in, so a
                default the buyer never saw is the wrong city in the pipeline
                and the wrong emails afterwards. Same control as the full
                variant, same state. */}
            <div className="mb-3">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-1">Your workshop city</p>
              <div className="flex flex-wrap gap-1">
                {CITY_OPTIONS.map((city) => (
                  <button
                    key={city.slug}
                    type="button"
                    onClick={() => {
                      setSelectedLocation(city.slug)
                      setLocationExplicit(true)
                      trackEvent('workshop_city_select', { city: city.slug, source: 'pricing_compact' })
                    }}
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
            <PaymentMethodsStrip />

            {!hasLiveDate && (
              <p className="text-[10px] text-[var(--muted-foreground)] mt-2 leading-snug">
                Start the online modules today. Your {cityLabel(selectedLocation)} workshop date launches when your city fills — minimum {CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks&rsquo; notice, early-bird rate locked in.
              </p>
            )}
            {/* THE CPD DEADLINE. Licence-renewal compliance is the dominant
                documented trigger for clinician CPD purchases — ahead of course
                content — so the annual requirement and its closing date belong
                on the money card. Both figures are the Boards' published
                minimums (physio 20/yr, osteo 25/yr; CPD year 1 Dec – 30 Nov),
                and the countdown derives from config so it can never go stale
                or need a copy edit in December. A real regulatory deadline is
                not scarcity marketing. */}
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
              <p className="text-[11.5px] font-bold text-amber-900 leading-snug">
                {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours — most of your year in one course
              </p>
              <p className="text-[10.5px] text-amber-900/80 leading-snug mt-0.5">
                Physios need {CPD_HOURS_PHYSIO}/yr, osteopaths {CPD_HOURS_OSTEO}. The CPD year closes{' '}
                {CPD_YEAR_END_LABEL} — {daysUntilCpdYearEnd()} days away.
              </p>
            </div>

            <p className="text-[10px] text-[var(--muted-foreground)] mt-2 text-center italic">
              &ldquo;Hands on component was invaluable&rdquo; — Amelia
            </p>

          </div>
        </div>

        {/* Exit-point restate (2026-08-03 work order: 22 money-path sessions/14d
          died here without a money action — restate the offer where they leave). */}
      <div className="mt-12 max-w-2xl mx-auto rounded-2xl border-2 border-accent/25 bg-white p-6 text-center">
        <p className="text-lg font-bold text-foreground mb-1.5">Still deciding? Start online today.</p>
        <p className="text-sm text-muted-foreground mb-4">
          ${CONFIG.COURSE.PRICE_ONLINE}{' '}gets you all 8 modules and the clinical platform now — and every
          dollar counts toward the Complete course when your city&rsquo;s workshop date launches.
        </p>
        <button
          type="button"
          onClick={() => handleCheckout('online-only')}
          className="btn-primary inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm"
        >
          Enrol online — ${CONFIG.COURSE.PRICE_ONLINE}
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[12px] text-muted-foreground mt-3">
          Or register interest for your city above — a date launches when it hits critical mass.
        </p>
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
                <span className="font-bold">${CONFIG.COURSE.SCAT_DISCOUNT_AUD} off applied</span> &middot; Online Course is{' '}
                <span className="font-bold">A${(CONFIG.COURSE.PRICE_ONLINE - CONFIG.COURSE.SCAT_DISCOUNT_AUD).toLocaleString()}</span>
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

      {stuckCheckoutUrl && (
        <div className="max-w-3xl mx-auto mb-4 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-bold text-amber-900 mb-1">Checkout didn&apos;t open?</p>
          <p className="text-[13px] text-amber-900/85 mb-2">
            Some clinic and hospital networks block payment pages. Your secure checkout is ready — open it directly:
          </p>
          <a href={stuckCheckoutUrl} target="_blank" rel="noopener"
             className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white">
            Open secure checkout →
          </a>
          <p className="text-[11px] text-amber-900/70 mt-2">
            Still blocked? It works from a phone on mobile data — or reply to any of our emails and we&apos;ll send the link.
          </p>
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
      {/* Tile order: Complete (flagship anchor) first, Online second, AI add-on
          last — the price ladder reads top-down, never a $99 SKU anchoring the
          flagship. Order is set with CSS order utilities; DOM order below is
          Online → Complete → AI for edit-diff stability. */}
      <div className="grid md:grid-cols-2 gap-6 pt-5 items-stretch max-w-4xl mx-auto">

        {/* ── CCM Online — online component of CCM (displays second) ── */}
        <div
          className="card card-visible rounded-2xl p-5 md:p-6 flex flex-col relative order-2 transition-all duration-300 hover:shadow-xl hover:shadow-teal-900/10 hover:-translate-y-0.5"
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

          <h3 className="text-xl font-bold text-[var(--foreground)] mb-0.5">{crm ? 'CRM Online' : 'CCM Online'}</h3>
          <p className="text-[12px] text-slate-500 mb-2 font-medium">{crm ? 'Online component of Concussion Rehab Mastery — no workshop' : 'Online component of Concussion Clinical Mastery — no workshop'}</p>
          <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed mb-4">
            {crm
              ? <>The EP-scoped course with the working clinical tools, at your own pace. Your payment counts toward the Complete course — upgrade for ${upgradePriceFor()} any time.</>
              : <>Same 8 modules as the full CCM, at your own pace. Your payment counts toward the Complete course — upgrade for ${upgradePriceFor()}{' '}when your city&rsquo;s date is announced, and you&rsquo;re on the list for a seat before it goes public.</>}
          </p>

          {/* Visual: CCM Online course preview screenshot */}
          <div className="relative rounded-xl overflow-hidden border border-teal-100 mb-4 h-[120px] bg-white">
            <Image
              src={crm ? "/online-course-preview.jpg" : "/ccm-online-preview.png"}
              alt={crm ? "CRM Online course preview" : "CCM Online course preview interface"}
              fill
              sizes="(min-width: 1024px) 340px, 100vw"
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/30 pointer-events-none" aria-hidden="true" />
          </div>

          {/* 2-col feature bento */}
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-5 text-left">
            {[
              '8 modules · 8 CPD',
              'VOMS, BESS & SCAT6',
              'Pathophysiology',
              'Clinical Toolkit',
              'Lifetime access',
              `Upgrade $${upgradePriceFor()} anytime`,
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px]">
                <Check className="w-3 h-3 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[var(--muted-foreground)]">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Workshop-city nomination — OPTIONAL, and never pre-selected.
              Until 2026-08-10 this card had no city control at all while
              checkout still sent selectedLocation, so every online buyer who
              touched nothing was silently nominated into the mount default
              (Sydney) for a city they were never shown. That number is what
              decides which city gets booked. Now: nothing is sent unless the
              buyer picks, and if they pick they can see what they picked. */}
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-1.5">
              Workshop city <span className="font-medium normal-case tracking-normal opacity-70">— optional, for when you upgrade</span>
            </p>
            <div className="flex flex-wrap gap-1">
              {CITY_OPTIONS.map((city) => (
                <button
                  key={city.slug}
                  type="button"
                  onClick={() => {
                    setSelectedLocation(city.slug)
                    setLocationExplicit(true)
                    trackEvent('workshop_city_select', { city: city.slug, source: 'pricing_online_card' })
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                    locationExplicit && selectedLocation === city.slug
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'bg-white text-[var(--foreground)] border-slate-200 hover:border-[var(--accent)]/50'
                  }`}
                  aria-pressed={locationExplicit && selectedLocation === city.slug}
                >
                  {city.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 leading-snug">
              {locationExplicit
                ? `We'll tell you first when a ${cityLabel(selectedLocation)} date is announced.`
                : "Skip it if you're not sure — you can choose a city any time before you upgrade."}
            </p>
          </div>

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

        {/* ── CCM Complete — online + workshop, MOST POPULAR (displays first) ── */}
        <div className="card card-visible rounded-2xl p-5 md:p-6 flex flex-col relative order-1 shadow-lg shadow-teal-900/[0.07] transition-all duration-300 hover:shadow-2xl hover:shadow-teal-900/15 hover:-translate-y-1" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.3)' }}>
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
              {(earlyBird || bookOwner) && (
                <div className="flex items-center gap-1.5 justify-end mb-0.5 flex-wrap">
                  <span className="text-[11px] text-[var(--muted-foreground)] line-through">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</span>
                  {earlyBird && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Early bird</span>
                  )}
                  {bookOwner && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">−${BUNDLE_DISCOUNT}</span>
                  )}
                </div>
              )}
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-2xl font-bold text-[var(--foreground)] tracking-tight">${fullCoursePrice.toLocaleString()}</span>
                <span className="text-[11px] text-[var(--muted-foreground)]">AUD</span>
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)]">or 4 x ${afterpayInstalment(fullCoursePrice)}</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">incl. GST · tax invoice issued</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-[var(--foreground)] mb-0.5">{crm ? 'CRM Complete' : 'CCM Complete'}</h3>
          <p className="text-[12px] text-slate-500 mb-2 font-medium">{crm ? 'Full Concussion Rehab Mastery — online modules + the practical skills training' : 'Full Concussion Clinical Mastery — online modules + hands-on workshop'}</p>
          <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed mb-4">
            {crm
              ? 'Everything in CRM Online, plus the same full-day practical every clinician attends — one multidisciplinary room. Graded exertion testing and prescription hands-on, assessment observed for depth.'
              : 'Same 8 online modules as CCM Online, plus a full-day hands-on workshop — one shared room for all disciplines: physios, osteos and exercise professionals. Practice SCAT6, VOMS & BESS with expert feedback.'}
          </p>

          {/* CPD split bar — 8 online + 8 hands-on = 16, seen not read */}
          <div className="mb-4">
            <div className="flex h-2 overflow-hidden rounded-full">
              <div className="w-1/2 bg-teal-500" />
              <div className="w-1/2 bg-amber-400" />
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-semibold text-[var(--muted-foreground)]">
              <span className="text-teal-700">{CONFIG.COURSE.ONLINE_CPD_POINTS} CPD online</span>
              <span className="font-bold text-[var(--foreground)]">{CONFIG.COURSE.TOTAL_CPD_POINTS} CPD total</span>
              <span className="text-amber-600">{CONFIG.COURSE.IN_PERSON_CPD_POINTS} CPD hands-on</span>
            </div>
          </div>

          {/* Melbourne workshop mini-tile — thumbnail + date */}
          {CONFIG.LOCATIONS.MELBOURNE.status === 'confirmed' && (
            <div className="rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden mb-4">
              <div className="flex items-stretch">
                <div className="relative w-[90px] flex-shrink-0 bg-slate-900">
                  {/* Date-bearing alt text derives from CONFIG.LOCATIONS — the
                      literal "13 June 2026" here would keep asserting the
                      completed round's date to screen readers the moment the
                      next Melbourne round confirms with a new one. */}
                  <Image
                    src="/melbourne-workshop.jpg"
                    alt={`Melbourne workshop · ${CONFIG.LOCATIONS.MELBOURNE.date}`}
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
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-4 text-left">
            {(crm ? [
              'Everything in Online',
              'Full-day practical workshop',
              'Graded exertion, hands-on',
              '1:1 expert feedback',
              '16 CPD (8 online + 8 in-person)',
              'AU locations',
            ] : [
              'Everything in Online',
              'Full-day workshop',
              'SCAT6, VOMS, BESS',
              '1:1 expert feedback',
              '16 CPD (8 online + 8 in-person)',
              'AU locations',
            ]).map((feature, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px]">
                <Check className="w-3 h-3 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[var(--muted-foreground)]">{feature}</span>
              </li>
            ))}
          </ul>

          {/* City picker. "Later" button removed — it let users click Enrol
              with no city, sending location=undefined to Stripe and creating
              an ops mess. Every city is buyable (nomination model): no live
              date = early-bird nomination, date launches when the city fills. */}
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-1.5">Your workshop city</p>
            <div className="flex flex-wrap gap-1">
              {CITY_OPTIONS.map((city) => (
                <button
                  key={city.slug}
                  type="button"
                  onClick={() => {
                    setSelectedLocation(city.slug)
                    setLocationExplicit(true)
                    trackEvent('workshop_city_select', { city: city.slug, source: 'pricing_card' })
                  }}
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

              {/* THE CPD DEADLINE (full variant — the card /pricing actually
              renders). Licence-renewal compliance is the dominant documented
              trigger for clinician CPD purchases, ahead of course content,
              so the annual requirement and its closing date belong on the
              money card. Figures are the Boards' published minimums (physio
              20/yr, osteo 25/yr; CPD year 1 Dec – 30 Nov) and the countdown
              derives from config, so it can never go stale or need a copy
              edit in December. A published regulatory deadline is not
              scarcity marketing. */}
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
            <p className="text-[12px] font-bold text-amber-900 leading-snug">
              {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours — most of your year in one course
            </p>
            <p className="text-[11px] text-amber-900/80 leading-snug mt-0.5">
              Physiotherapists need {CPD_HOURS_PHYSIO} hours a year, osteopaths {CPD_HOURS_OSTEO}.
              The CPD year closes {CPD_YEAR_END_LABEL} — {daysUntilCpdYearEnd()} days away.
            </p>
          </div>

          {/* THE LIGHTER ACTION, NEXT TO THE HEAVY ONE (2026-08-24).
              Two separate visitors picked Byron Bay, hit "Enrol Now — $1,190",
              went to Stripe and left — and neither registered interest, because
              at the moment of hesitation the only affordance beside the price
              was a $1,190 commitment. The interest form lived further down the
              page and on the homepage, i.e. nowhere near the decision.
              A city with no scheduled date is exactly where a buyer is most
              likely to stall, so the low-commitment option belongs adjacent to
              the high-commitment one — not as a competing CTA above it. */}
          {!hasLiveDate && (
            <details className="mt-2.5 group">
              <summary className="cursor-pointer text-[11px] font-semibold text-[var(--accent)] hover:underline list-none">
                Not ready to enrol? Tell me when {cityLabel(selectedLocation)} gets a date →
              </summary>
              <div className="mt-2">
                <WorkshopInterestForm citySlug={selectedLocation} variant="compact" />
              </div>
            </details>
          )}

          {!hasLiveDate && (
            <>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-2.5 leading-snug">
                <strong className="text-[var(--foreground)]">Start the 8 online modules today</strong> —
                full online access is immediate; only the workshop day waits for a date.
                Your {cityLabel(selectedLocation)} workshop
                date launches when your city fills — minimum {CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks&rsquo;
                notice, and your ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} early-bird
                rate is locked in. Standard price ${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()} applies
                only in the final {CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE} days before a scheduled workshop.
              </p>
              {showMomentum && selectedProgress && (
                <div className="mt-2 flex">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                    <span className="text-[11px] font-semibold text-emerald-800 leading-snug">
                      {selectedProgress.enrolled} of {selectedProgress.threshold} enrolled in {cityLabel(selectedLocation)} — the date launches at {selectedProgress.threshold}.
                    </span>
                  </span>
                </div>
              )}
              {/* The date-alert form used to sit HERE, inside the card, expanded by
                  default. It added ~350px to the Complete tile and left the two
                  cards visibly unequal — an $1,190 card towering over a $497 one,
                  with a name/email form competing against its own Enrol button.
                  Moved to full width directly BELOW both cards (2026-08-07): same
                  visibility for date-hunters, without a lead-capture form living
                  inside a price. */}
            </>
          )}
        </div>

      </div>

      {/* The date-alert block was REMOVED 2026-08-07 (owner: "get rid of this
          completely"). The location bentos now sit directly under the pricing
          cards and carry their own per-city signup, so a standalone name/email
          form here was a second ask for the same thing. */}
      {/* Trust Signals */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[var(--muted-foreground)]">
        {['Afterpay / Klarna', '7-Day Guarantee', 'Secure Checkout', 'AHPRA Aligned', 'Lifetime Access', 'Certificate Included'].map(item => (
          <div key={item} className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={2.5} />
            {item}
          </div>
        ))}
      </div>

      {/* The team/clinic callout moved to CcmPricingContent, below the
          location bentos (owner 2026-08-07: bentos belong directly under
          the cards). Kept out of this shared component so the compact
          /preview variant is unaffected. */}
    </div>
  )
}
