'use client'

import { useState, useEffect } from 'react'
import {
  Check,
  ArrowRight,
  Loader2,
  AlertCircle,
  BookOpen,
  Award,
  Bell,
  ChevronDown,
} from 'lucide-react'
import {
  CONFIG,
  afterpayInstalment,
  defaultNominationCity,
  isEarlyBirdForLocation,
  upgradePriceFor,
  workshopPriceFor,
  daysUntilCpdYearEnd,
  CPD_YEAR_END_LABEL,
  CPD_HOURS_PHYSIO,
  CPD_HOURS_OSTEO,
  SST_TIER_FROM_AUD,
} from '@/lib/config'
import { trackEvent, trackLeadConversion, getAttribution } from '@/lib/analytics'
import { PaymentMethodsStrip } from '@/components/PaymentMethodsStrip'
import { CheckoutRescue } from '@/components/CheckoutRescue'
import { CheckoutEmailField, useCheckoutEmail } from '@/components/CheckoutEmailField'
import { buildSecureSeatUrgency } from '@/lib/secure-seat-urgency'

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

function cityLabel(slug: string): string {
  const opt = CITY_OPTIONS.find((c) => c.slug === slug)
  return opt?.label ?? slug
}

// ─── City momentum (real counts only) ────────────────────────────────────────
//
// /api/city-progress returns TRUE round-scoped paid-nomination counts. A low
// count is anti-social-proof ("1 of 12" reads as an empty room), so numeric
// n/N progress renders ONLY once half full (enrolled >= MOMENTUM_MIN_ENROLLED,
// half of CONFIRMATION_THRESHOLD 12). Below that, buildSecureSeatUrgency uses
// forming copy with no invented numbers. Never fabricate; never show zeros;
// interest counts are never shown here.
export const MOMENTUM_MIN_ENROLLED = 6

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

function CityChips({
  selected,
  onSelect,
  size = 'sm',
  accent = 'teal',
  requireExplicit = false,
  locationExplicit = true,
  trackSource,
}: {
  selected: string
  onSelect: (slug: string) => void
  size?: 'sm' | 'xs'
  accent?: 'teal' | 'amber'
  /** When true, only highlight if locationExplicit (Online optional picker). */
  requireExplicit?: boolean
  locationExplicit?: boolean
  trackSource?: string
}) {
  const active = (slug: string) =>
    requireExplicit ? locationExplicit && selected === slug : selected === slug
  const pad = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
  const activeCls =
    accent === 'amber'
      ? 'bg-amber-100 border-amber-300 text-amber-900'
      : 'bg-[var(--accent)] text-white border-[var(--accent)]'
  const idleCls =
    accent === 'amber'
      ? 'bg-white border-slate-200 text-slate-600 hover:border-amber-200'
      : 'bg-white text-[var(--foreground)] border-slate-200 hover:border-[var(--accent)]/50'

  return (
    <div className="flex flex-wrap gap-1">
      {CITY_OPTIONS.map((city) => (
        <button
          key={city.slug}
          type="button"
          onClick={() => {
            onSelect(city.slug)
            if (trackSource) {
              trackEvent('workshop_city_select', { city: city.slug, source: trackSource }).catch(() => {})
            }
          }}
          className={`${pad} rounded-full font-medium border transition-colors ${
            active(city.slug) ? activeCls : idleCls
          }`}
          aria-pressed={active(city.slug)}
        >
          {city.label}
        </button>
      ))}
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
  const {
    email: checkoutEmail,
    setEmail: setCheckoutEmail,
    sessionEmail: checkoutSessionEmail,
    resolved: resolvedCheckoutEmail,
    loaded: checkoutEmailLoaded,
    needsField: checkoutNeedsField,
  } = useCheckoutEmail()

  const softEmailBlocks = (courseType: 'online-only' | 'full-course' | 'secure-seat') => {
    // Soft email on every Online / Complete / Secure CTA — CCM and CRM alike —
    // so Stripe sessions stamp customer_email for abandoned-checkout rescue.
    void courseType
    return checkoutEmailLoaded && checkoutNeedsField && !resolvedCheckoutEmail
  }

  const focusCheckoutEmail = (inputId: string) => {
    if (typeof document === 'undefined') return
    const el = document.getElementById(inputId) as HTMLInputElement | null
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.focus()
  }

  const emailInputIdFor = (
    courseType: 'online-only' | 'full-course' | 'secure-seat',
    compact: boolean,
  ) => {
    const prefix = compact ? 'checkout-email-compact' : 'checkout-email'
    if (courseType === 'online-only') return `${prefix}-online`
    if (courseType === 'full-course') return `${prefix}-complete`
    return `${prefix}-secure`
  }

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
  // Momentum / forming line — ALWAYS via buildSecureSeatUrgency (never raw n/12).
  // Helper omits numeric progress below half full; forming copy has no invented counts.
  const selectedProgress = cityProgress[selectedLocation]
  const seatUrgency = buildSecureSeatUrgency({
    cityLabel: cityLabel(selectedLocation || 'melbourne'),
    enrolled: selectedProgress?.enrolled,
    threshold: selectedProgress?.threshold ?? CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD,
    progressKnown: !!selectedProgress,
    priceAud: CONFIG.COURSE.PRICE_SECURE_SEAT,
  })

  const handleCheckout = async (
    courseType: 'online-only' | 'full-course' | 'secure-seat',
    opts?: { emailInputId?: string },
  ) => {
    // Only reachable when no city is open (defaultNominationCity() === null).
    // lib/schemas rejects a full-course / secure-seat without a location, so ask for one
    // instead of letting the buyer hit a generic "Invalid request."
    if ((courseType === 'full-course' || courseType === 'secure-seat') && !selectedLocation) {
      setError('Please choose your workshop city.')
      return
    }
    // Soft email: CCM + CRM Online/Complete/Secure — required for abandon rescue.
    if (!resolvedCheckoutEmail) {
      setError('Enter your email so we can send your enrolment link if checkout is interrupted.')
      focusCheckoutEmail(opts?.emailInputId ?? emailInputIdFor(courseType, isCompact))
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
      const conversionValue = courseType === 'full-course'
        ? fullCoursePrice
        : courseType === 'secure-seat'
          ? CONFIG.COURSE.PRICE_SECURE_SEAT
          : onlinePrice
      trackLeadConversion(ENROL_CLICK_LABEL, conversionValue)
        .catch(() => {})

      const res = await fetch(crm ? '/api/crm/checkout' : '/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(crm ? {
          tier: courseType === 'full-course' ? 'complete' : 'online',
          ...(selectedLocation ? { location: selectedLocation } : {}),
          email: resolvedCheckoutEmail,
          ...(Object.keys(utmParams).length > 0 ? { utm: utmParams } : {}),
          attribution: getAttribution(),
        } : {
          courseType,
          email: resolvedCheckoutEmail,
          ...((courseType === 'full-course' || courseType === 'secure-seat') && selectedLocation
            ? { location: selectedLocation }
            : {}),
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

  const onlineBullets = [
    `${CONFIG.COURSE.TOTAL_MODULES} modules · ${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD`,
    'Clinical Toolkit — VOMS, BESS & SCAT6',
    `Lifetime access · upgrade later $${upgradePriceFor()}`,
  ]

  const completeBullets = crm
    ? [
        'Includes everything in Online',
        `Catered practical day (+${CONFIG.COURSE.IN_PERSON_CPD_POINTS} CPD)`,
        'Graded exertion & 1:1 feedback',
      ]
    : [
        'Includes everything in Online',
        `Catered practical day (+${CONFIG.COURSE.IN_PERSON_CPD_POINTS} CPD)`,
        'Hands-on VOMS, BESS & real cases',
      ]

  const unlockBullets = [
    `Counts toward ${CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD}-seat gate`,
    'Credited to Complete when date opens',
    'Full refund if cohort does not form',
  ]

  // COMPACT VARIANT
  if (isCompact) {
    return (
      <div className="space-y-4">
      {stuckCheckoutUrl && (
        <div className="max-w-3xl mx-auto mb-4">
          <CheckoutRescue url={stuckCheckoutUrl} />
        </div>
      )}
        {error && (
          <div role="alert" aria-live="assertive" className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4 pt-4 max-w-5xl mx-auto items-stretch">
          {/* Online — primary */}
          <div
            className="card card-visible rounded-xl p-4 flex flex-col relative overflow-hidden"
            style={{
              borderWidth: '1.5px',
              borderColor: 'rgba(13, 122, 111, 0.28)',
              boxShadow: '0 2px 4px rgba(15,39,68,0.05), 0 12px 28px rgba(13,122,111,0.10)',
            }}
          >
            <div
              aria-hidden="true"
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
              style={{ background: 'linear-gradient(180deg, #1aa897, #0d7a6f 40%, #0a5f57)' }}
            />
            <div className="flex items-center justify-between gap-2 mb-2 pl-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0a5f57] border border-teal-200">
                Start today · {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD
              </span>
              <div className="text-right">
                {bookOwner && (
                  <span className="text-[10px] text-[var(--muted-foreground)] line-through mr-1">${CONFIG.COURSE.PRICE_ONLINE}</span>
                )}
                <span className="text-xl font-bold text-[var(--foreground)]">${onlinePrice}</span>
              </div>
            </div>
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-0.5 pl-1">Online</h3>
            <p className="text-[11px] text-slate-500 mb-2 pl-1 leading-snug">
              {CONFIG.COURSE.TOTAL_MODULES} modules · own pace · credits toward Complete
            </p>
            <div className="mb-2 ml-1 rounded-lg border border-teal-200/70 bg-gradient-to-br from-teal-50/80 to-white px-2.5 py-1.5">
              <p className="text-[10px] leading-snug text-[var(--foreground)]">
                <strong className="text-[#0a5f57]">Year 1 tools included</strong>
                {' '}· then A${SST_TIER_FROM_AUD}/mo
              </p>
            </div>
            <ul className="space-y-1 mb-3 flex-1 pl-1">
              {onlineBullets.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px]">
                  <Check className="w-3 h-3 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-[var(--muted-foreground)]">{f}</span>
                </li>
              ))}
            </ul>
            <CheckoutEmailField
              email={checkoutEmail}
              setEmail={setCheckoutEmail}
              sessionEmail={checkoutSessionEmail}
              disabled={loading !== null}
              inputId="checkout-email-compact-online"
              className="mb-2"
              placeholder="Email for your receipt & enrolment"
            />
            <button
              onClick={() => handleCheckout('online-only')}
              disabled={loading !== null || softEmailBlocks('online-only')}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-white mt-auto"
              style={{
                background: 'linear-gradient(180deg, #129284, #0d7a6f)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.22) inset, 0 6px 16px rgba(13,122,111,0.28)',
              }}
            >
              {loading === 'online-only' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                `Enrol Now — $${onlinePrice}`
              )}
            </button>
          </div>

          {/* Complete — quieter */}
          <div
            className="card card-visible rounded-xl p-4 flex flex-col relative"
            style={{ borderWidth: '1px', borderColor: 'rgba(15, 39, 68, 0.12)' }}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Online + practical day
              </span>
              <div className="text-right">
                {(earlyBird || bookOwner) && (
                  <span className="text-[10px] text-[var(--muted-foreground)] line-through mr-1">
                    ${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}
                  </span>
                )}
                <span className="text-xl font-bold text-[var(--foreground)]">${fullCoursePrice.toLocaleString()}</span>
              </div>
            </div>
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-0.5">Complete</h3>
            <p className="text-[11px] text-slate-500 mb-2 leading-snug">
              Includes Online · {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD · date TBD
            </p>
            <ul className="space-y-1 mb-3 flex-1">
              {completeBullets.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px]">
                  <Check className="w-3 h-3 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className={`text-[var(--muted-foreground)] ${i === 0 ? 'font-semibold' : ''}`}>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mb-2">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-1">Workshop city</p>
              <CityChips
                selected={selectedLocation}
                onSelect={(slug) => {
                  setSelectedLocation(slug)
                  setLocationExplicit(true)
                }}
                size="xs"
                trackSource="pricing_compact"
              />
            </div>
            <CheckoutEmailField
              email={checkoutEmail}
              setEmail={setCheckoutEmail}
              sessionEmail={checkoutSessionEmail}
              disabled={loading !== null}
              inputId="checkout-email-compact-complete"
              className="mb-2"
              placeholder="Email for your receipt & enrolment"
            />
            <button
              onClick={() => handleCheckout('full-course')}
              disabled={loading !== null || softEmailBlocks('full-course')}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-[var(--foreground)] text-white hover:bg-[var(--foreground)]/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
            >
              {loading === 'full-course' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                `Enrol Now — $${fullCoursePrice.toLocaleString()}`
              )}
            </button>
          </div>

          {/* Unlock — slim secondary */}
          <div
            className="card card-visible rounded-xl p-3.5 flex flex-col relative"
            style={{ borderWidth: '1px', borderColor: 'rgba(15, 39, 68, 0.08)' }}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wide text-amber-700/80">
                A${CONFIG.COURSE.PRICE_SECURE_SEAT} refundable
              </span>
              <span className="text-lg font-bold text-[var(--foreground)]">${CONFIG.COURSE.PRICE_SECURE_SEAT}</span>
            </div>
            <h3 className="text-[13px] font-bold text-[var(--foreground)] mb-0.5">Unlock your seat</h3>
            <p className="text-[10px] text-slate-500 mb-2 leading-snug">
              Soft commit · Online remains the front door
            </p>
            <ul className="space-y-1 mb-2.5 flex-1">
              {unlockBullets.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[10px]">
                  <Check className="w-2.5 h-2.5 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-[var(--muted-foreground)]">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mb-2">
              <CityChips
                selected={selectedLocation}
                onSelect={(slug) => {
                  setSelectedLocation(slug)
                  setLocationExplicit(true)
                }}
                size="xs"
                accent="amber"
              />
            </div>
            <CheckoutEmailField
              email={checkoutEmail}
              setEmail={setCheckoutEmail}
              sessionEmail={checkoutSessionEmail}
              disabled={loading !== null}
              inputId="checkout-email-compact-secure"
              className="mb-2"
              placeholder="Email for your receipt & enrolment"
            />
            <button
              type="button"
              onClick={() => handleCheckout('secure-seat')}
              disabled={loading !== null || softEmailBlocks('secure-seat')}
              className="w-full py-2 px-3 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 bg-white text-[var(--foreground)] hover:bg-slate-50 mt-auto"
            >
              {loading === 'secure-seat' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                seatUrgency.ctaLabel
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 max-w-5xl mx-auto">
          <PaymentMethodsStrip />
        </div>

        {/* Exit-point restate (2026-08-03 work order: 22 money-path sessions/14d
          died here without a money action — restate the offer where they leave). */}
      <div className="mt-10 max-w-2xl mx-auto rounded-2xl border-2 border-accent/25 bg-white p-6 text-center">
        <p className="text-lg font-bold text-foreground mb-1.5">Still deciding? Start online today.</p>
        <p className="text-sm text-muted-foreground mb-4">
          ${CONFIG.COURSE.PRICE_ONLINE}{' '}gets you all 8 modules and the clinical platform now — and every
          dollar counts toward the Complete course when your city&rsquo;s workshop date launches.
        </p>
        <div className="max-w-sm mx-auto mb-3 text-left">
          <CheckoutEmailField
            email={checkoutEmail}
            setEmail={setCheckoutEmail}
            sessionEmail={checkoutSessionEmail}
            disabled={loading !== null}
            inputId="checkout-email-compact-exit"
            placeholder="Email for your receipt & enrolment"
          />
        </div>
        <button
          type="button"
          onClick={() => handleCheckout('online-only', { emailInputId: 'checkout-email-compact-exit' })}
          disabled={loading !== null || softEmailBlocks('online-only')}
          className="btn-primary inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Enrol online — ${CONFIG.COURSE.PRICE_ONLINE}
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[12px] text-muted-foreground mt-3">
          Or secure your seat above (A$100 refundable) — a date launches when it hits critical mass.
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

  // FULL VARIANT — Online primary; Complete quieter; Unlock slim
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
        <div className="max-w-3xl mx-auto mb-4">
          <CheckoutRescue url={stuckCheckoutUrl} />
        </div>
      )}
      {/* Global error */}
      {error && (
        <div role="alert" aria-live="assertive" className="max-w-2xl mx-auto mb-8 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Pricing Cards — Online primary (teal), Complete quieter, Unlock slim.
          DOM order Online → Complete → Unlock. */}
      <div className="grid md:grid-cols-3 gap-4 pt-4 items-stretch max-w-6xl mx-auto">

        {/* ── Online — PRIMARY ── */}
        <div
          className="card card-visible rounded-2xl p-4 md:p-5 flex flex-col relative order-1 overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
          style={{
            borderWidth: '1.5px',
            borderColor: 'rgba(13, 122, 111, 0.22)',
            boxShadow: '0 2px 4px rgba(15,39,68,0.05), 0 12px 28px rgba(13,122,111,0.12)',
          }}
        >
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
            style={{ background: 'linear-gradient(180deg, #1aa897, #0d7a6f 40%, #0a5f57)' }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(13,122,111,0.12), transparent 70%)' }}
          />

          <div className="flex items-start justify-between gap-3 mb-3 pl-1 relative">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50 flex-shrink-0">
                <BookOpen className="w-4 h-4 text-[#0d7a6f]" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-[#0a5f57] border border-teal-200">
                Start today · {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD
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
                <span className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">${onlinePrice}</span>
                <span className="text-[11px] text-[var(--muted-foreground)]">AUD</span>
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)]">or 4 × ${afterpayInstalment(onlinePrice)}</p>
            </div>
          </div>

          <h3 className="text-xl font-extrabold text-[var(--foreground)] mb-0.5 pl-1 tracking-tight">Online</h3>
          <p className="text-[13px] text-[var(--muted-foreground)] leading-snug mb-3 pl-1">
            {crm
              ? `${CONFIG.COURSE.TOTAL_MODULES} modules · start today · upgrade to Complete later for $${upgradePriceFor()}.`
              : `${CONFIG.COURSE.TOTAL_MODULES} modules · start today · credits toward Complete (upgrade $${upgradePriceFor()}).`}
          </p>

          <div className="mb-3 ml-1 flex items-start gap-2 rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50/90 to-white px-3 py-2">
            <span
              aria-hidden="true"
              className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#0d7a6f]"
              style={{ boxShadow: '0 0 0 3px rgba(13,122,111,0.15)' }}
            />
            <p className="text-[12px] leading-snug text-[var(--foreground)] font-medium m-0">
              <strong className="text-[#0a5f57]">Year 1 tools included</strong>
              {' '}· then A${SST_TIER_FROM_AUD}/mo clinical tools. Cancel anytime after year 1.
            </p>
          </div>

          <ul className="space-y-1.5 mb-3 pl-1 text-left flex-1">
            {onlineBullets.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px]">
                <Check className="w-3.5 h-3.5 text-[#0d7a6f] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[var(--muted-foreground)]">{feature}</span>
              </li>
            ))}
          </ul>

          <details className="mb-3 ml-1 group rounded-lg border border-slate-200/80 bg-slate-50/40 px-3 py-2">
            <summary className="cursor-pointer list-none flex items-center justify-between text-[11px] font-semibold text-[var(--muted-foreground)]">
              What&apos;s included
              <ChevronDown className="w-3.5 h-3.5 opacity-60 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-2 space-y-2">
              <p className="text-[11px] text-[var(--muted-foreground)] leading-snug">
                {crm
                  ? `For exercise physiologists · ${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD · own pace · Clinical Toolkit.`
                  : `For physiotherapists, osteopaths & allied health · ${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD · own pace.`}
              </p>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-1">
                  Preferred city <span className="font-medium normal-case tracking-normal opacity-70">— optional</span>
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
                    : "Skip it if you're not sure — choose a city any time before you upgrade."}
                </p>
              </div>
            </div>
          </details>

          <CheckoutEmailField
            email={checkoutEmail}
            setEmail={setCheckoutEmail}
            sessionEmail={checkoutSessionEmail}
            disabled={loading !== null}
            inputId="checkout-email-online"
            className="mb-3"
            placeholder="Email for your receipt & enrolment"
          />
          <button
            onClick={() => handleCheckout('online-only')}
            disabled={loading !== null || softEmailBlocks('online-only')}
            className="w-full py-3 px-5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm text-white mt-auto"
            style={{
              background: 'linear-gradient(180deg, #129284, #0d7a6f)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.22) inset, 0 6px 16px rgba(13,122,111,0.28)',
            }}
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
        </div>

        {/* ── Complete — quieter ── */}
        <div
          className="card card-visible rounded-2xl p-4 md:p-5 flex flex-col relative order-2 transition-all duration-300 hover:-translate-y-0.5"
          style={{
            borderWidth: '1px',
            borderColor: 'rgba(15, 39, 68, 0.12)',
            boxShadow: '0 1px 2px rgba(15,39,68,0.04), 0 4px 12px rgba(15,39,68,0.05)',
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/80 flex-shrink-0">
                <Award className="w-4 h-4 text-slate-600" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Online + practical day
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
                <span className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">${fullCoursePrice.toLocaleString()}</span>
                <span className="text-[11px] text-[var(--muted-foreground)]">AUD</span>
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)]">or 4 × ${afterpayInstalment(fullCoursePrice)}</p>
            </div>
          </div>

          <h3 className="text-xl font-extrabold text-[var(--foreground)] mb-0.5 tracking-tight">Complete</h3>
          <p className="text-[13px] text-[var(--muted-foreground)] leading-snug mb-3">
            Includes Online (unlocks now) + catered practical day · {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD · date TBD
          </p>

          <ul className="space-y-1.5 mb-3 text-left flex-1">
            {completeBullets.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px]">
                <Check className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className={`text-[var(--muted-foreground)] ${i === 0 ? 'font-semibold' : ''}`}>{feature}</span>
              </li>
            ))}
          </ul>

          <details className="mb-3 group rounded-lg border border-slate-200/80 bg-slate-50/40 px-3 py-2">
            <summary className="cursor-pointer list-none flex items-center justify-between text-[11px] font-semibold text-[var(--muted-foreground)]">
              What&apos;s included
              <ChevronDown className="w-3.5 h-3.5 opacity-60 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-2 space-y-2.5">
              <div>
                <div className="flex h-1.5 overflow-hidden rounded-full">
                  <div className="w-1/2 bg-teal-500" />
                  <div className="w-1/2 bg-amber-400" />
                </div>
                <div className="mt-1 flex justify-between text-[10px] font-semibold text-[var(--muted-foreground)]">
                  <span className="text-teal-700">{CONFIG.COURSE.ONLINE_CPD_POINTS} online</span>
                  <span className="font-bold text-[var(--foreground)]">{CONFIG.COURSE.TOTAL_CPD_POINTS} total</span>
                  <span className="text-amber-600">{CONFIG.COURSE.IN_PERSON_CPD_POINTS} hands-on</span>
                </div>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] leading-snug">
                Date confirms when {CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD} paid clinicians commit, with{' '}
                {CONFIG.WORKSHOP.LEAD_TIME_WEEKS}+ weeks&rsquo; notice. Early-bird locked in until then.
              </p>
              <p className="text-[11px] text-amber-900/90 leading-snug rounded-md border border-amber-200 bg-amber-50/70 px-2.5 py-1.5">
                <strong>{CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours</strong> — physios need {CPD_HOURS_PHYSIO}/yr, osteos {CPD_HOURS_OSTEO}.
                Year closes {CPD_YEAR_END_LABEL} ({daysUntilCpdYearEnd()} days).
              </p>
              {!hasLiveDate && seatUrgency.progressLine && (
                <p className="text-[11px] font-semibold text-emerald-800">{seatUrgency.progressLine}</p>
              )}
            </div>
          </details>

          <CheckoutEmailField
            email={checkoutEmail}
            setEmail={setCheckoutEmail}
            sessionEmail={checkoutSessionEmail}
            disabled={loading !== null}
            inputId="checkout-email-complete"
            className="mb-3"
            placeholder="Email for your receipt & enrolment"
          />
          <button
            onClick={() => handleCheckout('full-course')}
            disabled={loading !== null || softEmailBlocks('full-course')}
            className="w-full py-3 px-5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-[var(--foreground)] text-white hover:bg-[var(--foreground)]/90 transition-colors mt-auto"
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
        </div>

        {/* ── Unlock — slim secondary ── */}
        <div
          className="card card-visible rounded-2xl p-3.5 md:p-4 flex flex-col relative order-3 transition-all duration-300"
          style={{
            borderWidth: '1px',
            borderColor: 'rgba(15, 39, 68, 0.08)',
            boxShadow: 'none',
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200/70 flex-shrink-0">
                <Bell className="w-3.5 h-3.5 text-amber-700/80" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-amber-800/80">
                Soft commit
              </span>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-2xl font-bold text-[var(--foreground)] tracking-tight">${CONFIG.COURSE.PRICE_SECURE_SEAT}</span>
                <span className="text-[10px] text-[var(--muted-foreground)]">AUD</span>
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)]">refundable</p>
            </div>
          </div>

          <h3 className="text-base font-bold text-[var(--foreground)] mb-0.5">{seatUrgency.headlineShort}</h3>
          <p className="text-[12px] text-slate-500 mb-2 leading-snug">
            Preferred city below · open the date at {CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD}
          </p>
          {seatUrgency.progressLine && (
            <p className="mb-2 text-[11px] font-semibold text-emerald-800 leading-snug">{seatUrgency.progressLine}</p>
          )}

          <ul className="space-y-1 mb-3 text-left flex-1">
            {unlockBullets.map((feature, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px]">
                <Check className="w-3 h-3 text-amber-600/90 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[var(--muted-foreground)]">{feature}</span>
              </li>
            ))}
          </ul>

          <CheckoutEmailField
            email={checkoutEmail}
            setEmail={setCheckoutEmail}
            sessionEmail={checkoutSessionEmail}
            disabled={loading !== null}
            inputId="checkout-email-secure"
            className="mb-2.5 mt-auto"
            placeholder="Email for your receipt & enrolment"
          />
          <button
            type="button"
            onClick={() => handleCheckout('secure-seat')}
            disabled={loading !== null || softEmailBlocks('secure-seat')}
            className="w-full py-2.5 px-4 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 bg-white text-[var(--foreground)] hover:bg-slate-50"
          >
            {loading === 'secure-seat' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>{seatUrgency.ctaLabel} <ArrowRight className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>

      </div>

      {/* Shared workshop-city strip — chips moved out of card bodies */}
      <div className="mt-4 max-w-6xl mx-auto rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-0.5">
              Workshop city
            </p>
            <p className="text-[12px] text-[var(--muted-foreground)] leading-snug">
              Required for Complete &amp; Unlock · date TBD when {CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD} paid commit
            </p>
          </div>
          <CityChips
            selected={selectedLocation}
            onSelect={(slug) => {
              setSelectedLocation(slug)
              setLocationExplicit(true)
            }}
            trackSource="pricing_card"
          />
        </div>
      </div>

      {/* Trust + payment logos once under the row */}
      <div className="mt-5 max-w-6xl mx-auto">
        <PaymentMethodsStrip />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[var(--muted-foreground)]">
        {['Afterpay / Klarna', '7-Day Guarantee', 'Secure Checkout', 'AHPRA Aligned', 'Lifetime Access', 'Certificate Included'].map(item => (
          <div key={item} className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={2.5} />
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
