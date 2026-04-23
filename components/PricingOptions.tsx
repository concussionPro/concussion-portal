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
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { CONFIG, afterpayInstalment } from '@/lib/config'
import { trackEvent, trackLeadConversion } from '@/lib/analytics'

// Google Ads conversion label for paid enrol/checkout clicks (Add to cart)
const ENROL_CLICK_LABEL = 'vHoXCNKd6Y8cEJWXu_9C'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PricingOptionsProps {
  variant?: 'full' | 'compact'
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PricingOptions({ variant = 'full' }: PricingOptionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isCompact = variant === 'compact'

  // Early bird: check deadline. Server is source of truth at checkout.
  const isEarlyBird = new Date() < new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T23:59:59')

  // Read pre-selected location, promo code, and UTM params from URL
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [utmParams, setUtmParams] = useState<Record<string, string>>({})
  const [bookOwner, setBookOwner] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const loc = params.get('location')
    if (loc && ['sydney', 'melbourne', 'byron-bay'].includes(loc)) {
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
          {/* Online Course - Compact (Most Popular) — primary conversion target */}
          <div className="card card-visible rounded-xl p-5 flex flex-col relative" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.2)' }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50">
                <BookOpen className="w-4 h-4 text-[var(--accent)]" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[var(--accent)] border border-teal-200">
                Most Popular
              </span>
            </div>

            <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">Online Course</h3>

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
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">One-time · Lifetime access · 8 CPD pts</p>
            </div>

            <ul className="space-y-1.5 mb-4 flex-1">
              {[
                '8 online modules (8 CPD points)',
                'Own pace — no deadlines',
                'Clinical Toolkit & resources',
                'Upgrade to add workshop anytime',
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

          {/* Complete Course - Compact (Upgrade path) */}
          <div className="card rounded-xl p-5 flex flex-col relative">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200/50">
                <Award className="w-4 h-4 text-orange-500" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                + Hands-On Workshop
              </span>
            </div>

            <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">Complete Course</h3>

            <div className="mb-4">
              {isEarlyBird ? (
                <>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm text-[var(--muted-foreground)] line-through">${(bookOwner ? CONFIG.COURSE.PRICE_EARLY_BIRD : CONFIG.COURSE.PRICE_REGULAR).toLocaleString()}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                      {bookOwner ? `Bundle −$${BUNDLE_DISCOUNT}` : `Save $${CONFIG.COURSE.SAVINGS}`}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[var(--foreground)]">${fullCoursePrice.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400">≈ $770 USD</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">or 4 x ${afterpayInstalment(fullCoursePrice)} with Afterpay or Klarna</p>
                  <p className="text-[10px] text-orange-600 font-medium mt-0.5">Early bird ends {new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })} — then ${CONFIG.COURSE.PRICE_REGULAR}</p>
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
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">One-time · 14 AHPRA CPD points</p>
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
                  </div>
                </div>
              </div>
            )}

            <ul className="space-y-1.5 mb-4 flex-1">
              {[
                'Everything in Online, plus:',
                'Full-day workshop (6 CPD points)',
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
      {/* Promo code banner */}
      {promoCode && (
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

        {/* ── Reference + Toolkit — entry tier ────────────── */}
        <div
          className="card rounded-2xl p-5 md:p-6 flex flex-col relative"
          style={{ borderWidth: '1.5px', borderColor: 'rgba(194, 65, 12, 0.2)' }}
        >
          {/* Header row: badge left, price right */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200/50 flex-shrink-0">
                <FileText className="w-4.5 h-4.5 text-orange-600" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                Start here
              </span>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-2xl font-bold text-[var(--foreground)] tracking-tight">$97</span>
                <span className="text-[11px] text-[var(--muted-foreground)]">AUD</span>
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)]">Instant PDF</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-[var(--foreground)] mb-1.5">Reference + Toolkit</h3>
          <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed mb-4">
            256-page reference text + 2026 Clinical Toolkit. Apply concussion care in clinic — without the CPD course.
          </p>

          {/* Visual: reference cover + Clinical Toolkit cover */}
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50/60 border border-orange-100 mb-4 h-[120px] flex items-center justify-center gap-3">
            <div className="relative w-[72px] h-[96px] rounded-md overflow-hidden shadow-[0_6px_16px_-6px_rgba(15,23,42,0.25)] ring-1 ring-slate-200 -rotate-[5deg]">
              <Image
                src="/ccm-cover.png"
                alt="Reference text cover"
                fill
                sizes="72px"
                className="object-cover"
              />
            </div>
            <div
              className="relative w-[72px] h-[96px] rounded-md overflow-hidden shadow-[0_6px_16px_-6px_rgba(15,23,42,0.3)] ring-1 ring-orange-200/60 rotate-[5deg] flex flex-col items-center justify-center px-1.5"
              style={{
                background:
                  'linear-gradient(135deg, #fb923c 0%, #f97316 40%, #e11d48 100%)',
              }}
              aria-label="Clinical Toolkit 2026 cover"
            >
              <p className="text-[11px] font-black tracking-wider text-white leading-[1.05] text-center">CLINICAL</p>
              <p className="text-[11px] font-black tracking-wider text-white leading-[1.05] text-center">TOOLKIT</p>
              <div className="w-6 h-px bg-white/70 my-1.5" />
              <p className="text-[9px] font-semibold text-white/90 tracking-wide">2026</p>
            </div>
          </div>

          <ul className="space-y-1.5 mb-4">
            {[
              '256-page Clinical Reference',
              'Cheat Sheet · PPCS · Referral Map',
              'RehabFlow + RTP/RTL/RTW ladder',
              'Patient handouts + templates',
              '$100 off course on upgrade',
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px]">
                <Check className="w-3 h-3 text-orange-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[var(--muted-foreground)]">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/reference"
            className="w-full py-3 px-5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm bg-orange-600 text-white hover:bg-orange-700 transition-colors"
          >
            Get Reference + Toolkit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Online Course — Most Popular ────────────────── */}
        <div
          className="card card-visible rounded-2xl p-5 md:p-6 flex flex-col relative"
          style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.2)' }}
        >
          {/* Header row: badge left, price right */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50 flex-shrink-0">
                <BookOpen className="w-4.5 h-4.5 text-[var(--accent)]" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-[var(--accent)] border border-teal-200">
                Most Popular
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

          <h3 className="text-xl font-bold text-[var(--foreground)] mb-1.5">Online Course</h3>
          <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed mb-4">
            8 comprehensive modules at your own pace. Upgrade to add hands-on training anytime.
          </p>

          {/* Visual: course interface preview */}
          <div className="relative rounded-xl overflow-hidden border border-teal-100 mb-4 h-[120px] bg-white">
            <Image
              src="/online-course-preview.jpg"
              alt="Online course interface preview"
              fill
              sizes="(min-width: 1024px) 340px, 100vw"
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/40 pointer-events-none" aria-hidden="true" />
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

        {/* ── Complete Course — + Hands-on Workshop ────────── */}
        <div className="card rounded-2xl p-5 md:p-6 flex flex-col relative">
          {/* Header row: badge left, price right */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200/50 flex-shrink-0">
                <Award className="w-4.5 h-4.5 text-orange-500" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                + Workshop
              </span>
            </div>
            <div className="text-right flex-shrink-0">
              {isEarlyBird ? (
                <>
                  <div className="flex items-center gap-1.5 justify-end mb-0.5">
                    <span className="text-[11px] text-[var(--muted-foreground)] line-through">${(bookOwner ? CONFIG.COURSE.PRICE_EARLY_BIRD : CONFIG.COURSE.PRICE_REGULAR).toLocaleString()}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                      {bookOwner ? `−$${BUNDLE_DISCOUNT}` : `−$${CONFIG.COURSE.SAVINGS}`}
                    </span>
                  </div>
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

          <h3 className="text-xl font-bold text-[var(--foreground)] mb-1.5">Complete Course</h3>
          <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed mb-4">
            Online course + full-day hands-on workshop. Practice SCAT6, VOMS &amp; BESS with expert feedback.
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

          {/* Compact location picker */}
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-1.5">City</p>
            <div className="flex flex-wrap gap-1">
              {[
                { slug: 'sydney', label: 'Sydney' },
                { slug: 'melbourne', label: 'Melbourne' },
                { slug: 'byron-bay', label: 'Byron' },
              ].map(city => (
                <button
                  key={city.slug}
                  type="button"
                  onClick={() => setSelectedLocation(selectedLocation === city.slug ? null : city.slug)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                    selectedLocation === city.slug
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'bg-white text-[var(--foreground)] border-slate-200 hover:border-[var(--accent)]/50'
                  }`}
                >
                  {city.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedLocation(null)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                  selectedLocation === null
                    ? 'bg-slate-100 text-[var(--foreground)] border-slate-300'
                    : 'bg-white text-[var(--muted-foreground)] border-slate-200 hover:border-slate-300'
                }`}
              >
                Later
              </button>
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

          {isEarlyBird && (
            <p className="text-[10px] text-orange-600 font-medium text-center mt-2">
              Early bird ends {new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })} — then ${CONFIG.COURSE.PRICE_REGULAR}
            </p>
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
    </div>
  )
}
