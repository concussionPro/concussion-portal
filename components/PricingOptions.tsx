'use client'

import { useState, useEffect } from 'react'
import {
  Check,
  ArrowRight,
  Loader2,
  AlertCircle,
  BookOpen,
  Award,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { CONFIG } from '@/lib/config'
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
  }, [])

  const handleCheckout = async (courseType: 'online-only' | 'full-course') => {
    console.log('[handleCheckout] ENTERED - courseType:', courseType)
    try {
      setLoading(courseType)
      setError(null)

      // Fire analytics in background (non-blocking)
      trackEvent('checkout_start', { courseType, source: 'pricing_page', location: selectedLocation })
        .catch(() => {})

      // Fire Google Ads conversion in background (non-blocking)
      const conversionValue = courseType === 'full-course'
        ? (isEarlyBird ? CONFIG.COURSE.PRICE_EARLY_BIRD : CONFIG.COURSE.PRICE_REGULAR)
        : CONFIG.COURSE.PRICE_ONLINE
      trackLeadConversion(ENROL_CLICK_LABEL, conversionValue)
        .catch(() => {})

      console.log('[checkout] Creating session for:', courseType)

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
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
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
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-[var(--foreground)]">${CONFIG.COURSE.PRICE_ONLINE}</span>
                <span className="text-[10px] text-slate-400">≈ $320 USD</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">or 4 x ${(Math.ceil(CONFIG.COURSE.PRICE_ONLINE / 4 * 100) / 100).toFixed(2)} with Afterpay or Klarna</p>
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
              onClick={() => { console.log('[btn] compact online-only clicked'); handleCheckout('online-only') }}
              disabled={loading !== null}
              className="btn-primary w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading === 'online-only' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                `Enrol Now — $${CONFIG.COURSE.PRICE_ONLINE}`
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
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm text-[var(--muted-foreground)] line-through">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">Save ${CONFIG.COURSE.SAVINGS}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[var(--foreground)]">${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400">≈ $770 USD</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">or 4 x ${(Math.ceil(CONFIG.COURSE.PRICE_EARLY_BIRD / 4 * 100) / 100).toFixed(2)} with Afterpay or Klarna</p>
                  <p className="text-[10px] text-orange-600 font-medium mt-0.5">Early bird ends {new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })} — then ${CONFIG.COURSE.PRICE_REGULAR}</p>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[var(--foreground)]">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400">≈ $910 USD</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">or 4 x ${(Math.ceil(CONFIG.COURSE.PRICE_REGULAR / 4 * 100) / 100).toFixed(2)} with Afterpay or Klarna</p>
                </>
              )}
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">One-time · 14 AHPRA CPD points</p>
            </div>

            <ul className="space-y-1.5 mb-4 flex-1">
              {[
                'Everything in Online, plus:',
                'Full-day workshop (6 CPD points)',
                'Hands-on SCAT6, VOMS, BESS',
                'Choose your preferred AU location',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3 h-3 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className={`text-[var(--muted-foreground)] ${i === 0 ? 'font-semibold' : ''}`}>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => { console.log('[btn] compact full-course clicked'); handleCheckout('full-course') }}
              disabled={loading !== null}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-[var(--foreground)] text-white hover:bg-[var(--foreground)]/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'full-course' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                `Enrol Now — $${isEarlyBird ? CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString() : CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}`
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
    <div className="max-w-[900px] mx-auto">
      {/* Promo code banner */}
      {promoCode && (
        <div className="max-w-2xl mx-auto mb-6 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2.5} />
          <span className="text-emerald-800 font-semibold">Promo code {promoCode} will be applied at checkout</span>
        </div>
      )}

      {/* Global error */}
      {error && (
        <div className="max-w-2xl mx-auto mb-8 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Pricing Cards — Online Course first (primary conversion target), Complete Course as upgrade */}
      <div className="grid md:grid-cols-2 gap-6 pt-5">

        {/* Online Course — Most Popular (primary conversion target) */}
        <div className="card card-visible rounded-2xl p-7 md:p-8 flex flex-col relative" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.2)' }}>
          {/* Icon + Badge */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50">
              <BookOpen className="w-5 h-5 text-[var(--accent)]" strokeWidth={2} />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-[var(--accent)] border border-teal-200">
              Most Popular
            </span>
          </div>

          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Online Course</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
            8 comprehensive modules at your own pace. Master concussion assessment theory, then upgrade to add hands-on training when you&apos;re ready.
          </p>

          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[var(--foreground)] tracking-tight">${CONFIG.COURSE.PRICE_ONLINE}</span>
              <span className="text-sm text-[var(--muted-foreground)]">AUD</span>
              <span className="text-xs text-slate-400">≈ $320 USD</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">or 4 x ${(Math.ceil(CONFIG.COURSE.PRICE_ONLINE / 4 * 100) / 100).toFixed(2)} with Afterpay or Klarna</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">One-time payment · Lifetime access · Content updated regularly · 8 CPD points</p>
          </div>

          <ul className="space-y-3 mb-7 flex-1">
            {[
              '8 online modules (8 CPD points)',
              'Understand concussion pathophysiology & phenotypes',
              'Learn VOMS, BESS & SCAT6 protocols in depth',
              'Clinical Toolkit & downloadable resources',
              'Upgrade to add hands-on workshop anytime',
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <Check className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[var(--muted-foreground)]">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => { console.log('[btn] full online-only clicked'); handleCheckout('online-only') }}
            disabled={loading !== null}
            className="btn-primary w-full py-3.5 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {loading === 'online-only' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Enrol Now — ${CONFIG.COURSE.PRICE_ONLINE}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <Link
            href="/preview"
            className="w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm mt-2 border border-slate-200 text-[var(--foreground)] hover:bg-slate-50 transition-colors"
          >
            Preview Course
          </Link>

          <p className="text-[11px] text-[var(--muted-foreground)] mt-3 text-center italic">
            &ldquo;Well organised...content explained in a way that was relevant and memorable&rdquo; — Alex, Osteopath
          </p>

        </div>

        {/* Complete Course — Upgrade path (+ hands-on workshop) */}
        <div className="card rounded-2xl p-7 md:p-8 flex flex-col relative">
          {/* Icon + Badge */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200/50">
              <Award className="w-5 h-5 text-orange-500" strokeWidth={2} />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              + Hands-On Workshop
            </span>
          </div>

          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Complete Course</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
            Everything in Online, plus a full-day hands-on workshop. Practice SCAT6, VOMS &amp; BESS with expert feedback.
          </p>

          <div className="mb-6">
            {isEarlyBird ? (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-base text-[var(--muted-foreground)] line-through">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                    Save ${CONFIG.COURSE.SAVINGS}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[var(--foreground)] tracking-tight">${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}</span>
                  <span className="text-sm text-[var(--muted-foreground)]">AUD</span>
                  <span className="text-xs text-slate-400">≈ $770 USD</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">or 4 x ${(Math.ceil(CONFIG.COURSE.PRICE_EARLY_BIRD / 4 * 100) / 100).toFixed(2)} with Afterpay or Klarna</p>
                <p className="text-xs text-orange-600 font-medium mt-1">Early bird ends {new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })} — then ${CONFIG.COURSE.PRICE_REGULAR}</p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[var(--foreground)] tracking-tight">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</span>
                  <span className="text-sm text-[var(--muted-foreground)]">AUD</span>
                  <span className="text-xs text-slate-400">≈ $910 USD</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">or 4 x ${(Math.ceil(CONFIG.COURSE.PRICE_REGULAR / 4 * 100) / 100).toFixed(2)} with Afterpay or Klarna</p>
              </>
            )}
            <p className="text-xs text-[var(--muted-foreground)] mt-1">One-time payment · 14 AHPRA CPD points</p>
          </div>

          <ul className="space-y-3 mb-6 flex-1">
            {[
              'Everything in Online, plus:',
              'Full-day hands-on workshop (6 extra CPD)',
              'Administer SCAT6, VOMS & BESS with confidence',
              'Expert coaching & 1:1 feedback',
              'Choose your preferred AU location',
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <Check className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className={`text-[var(--muted-foreground)] ${i === 0 ? 'font-semibold' : ''}`}>{feature}</span>
              </li>
            ))}
          </ul>

          {/* Q1 social proof */}
          {CONFIG.WORKSHOP.Q1_COMPLETED && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200/60">
              <p className="text-xs text-emerald-800 font-medium">
                Q1 2026 workshops delivered in Sydney, Melbourne &amp; Byron Bay. Next round: {CONFIG.WORKSHOP.NEXT_ROUND}.
              </p>
            </div>
          )}

          {/* Workshop photo */}
          <div className="relative rounded-xl overflow-hidden mb-4">
            <Image
              src="/workshop-training.jpg"
              alt="Hands-on clinical assessment at a Concussion Education Australia workshop"
              width={600}
              height={450}
              className="w-full h-auto"
            />
          </div>

          {/* Location selector */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--foreground)] mb-2">Preferred workshop city</p>
            <div className="flex flex-wrap gap-2">
              {[
                { slug: 'sydney', label: 'Sydney' },
                { slug: 'melbourne', label: 'Melbourne' },
                { slug: 'byron-bay', label: 'Byron Bay' },
              ].map(city => (
                <button
                  key={city.slug}
                  type="button"
                  onClick={() => setSelectedLocation(selectedLocation === city.slug ? null : city.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedLocation === null
                    ? 'bg-slate-100 text-[var(--foreground)] border-slate-300'
                    : 'bg-white text-[var(--muted-foreground)] border-slate-200 hover:border-slate-300'
                }`}
              >
                Choose later
              </button>
            </div>
          </div>

          {/* Enroll Button */}
          <button
            onClick={() => { console.log('[btn] full full-course clicked'); handleCheckout('full-course') }}
            disabled={loading !== null}
            className="w-full py-3.5 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-[var(--foreground)] text-white hover:bg-[var(--foreground)]/90 transition-colors"
          >
            {loading === 'full-course' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Enrol Now — ${isEarlyBird ? CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString() : CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <Link
            href="/preview"
            className="w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm mt-2 border border-slate-200 text-[var(--foreground)] hover:bg-slate-50 transition-colors"
          >
            Preview Course
          </Link>

          <p className="text-[11px] text-[var(--muted-foreground)] mt-3 text-center italic">
            &ldquo;Hands on component was invaluable&rdquo; — Amelia, Physiotherapist
          </p>

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
