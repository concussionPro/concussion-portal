'use client'

import { useState, useEffect } from 'react'
import {
  Check,
  ArrowRight,
  MapPin,
  Loader2,
  AlertCircle,
  BookOpen,
  Award,
  Users,
} from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { trackEvent } from '@/lib/analytics'

// ─── Types ───────────────────────────────────────────────────────────────────

type LocationStatus = 'collecting' | 'confirmed' | 'completed'

interface LocationOption {
  value: string
  label: string
  date: string
  status: LocationStatus
}

export interface PricingOptionsProps {
  variant?: 'full' | 'compact'
}

// ─── Location data ────────────────────────────────────────────────────────────

const LOCATIONS: LocationOption[] = [
  {
    value: CONFIG.LOCATIONS.SYDNEY.slug,
    label: CONFIG.LOCATIONS.SYDNEY.city,
    date: CONFIG.LOCATIONS.SYDNEY.date,
    status: CONFIG.LOCATIONS.SYDNEY.status,
  },
  {
    value: CONFIG.LOCATIONS.BYRON_BAY.slug,
    label: CONFIG.LOCATIONS.BYRON_BAY.city,
    date: CONFIG.LOCATIONS.BYRON_BAY.date,
    status: CONFIG.LOCATIONS.BYRON_BAY.status,
  },
  {
    value: CONFIG.LOCATIONS.MELBOURNE.slug,
    label: CONFIG.LOCATIONS.MELBOURNE.city,
    date: CONFIG.LOCATIONS.MELBOURNE.date,
    status: CONFIG.LOCATIONS.MELBOURNE.status,
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export function PricingOptions({ variant = 'full' }: PricingOptionsProps) {
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [preferredCity, setPreferredCity] = useState<string>('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0)
  const [isEarlyBird, setIsEarlyBird] = useState(true)

  const isCompact = variant === 'compact'

  // Early bird: let the server decide at checkout; default to showing early bird price
  useEffect(() => {
    const selectedLoc = LOCATIONS.find(l => l.value === selectedLocation)
    setIsEarlyBird(!selectedLoc || selectedLoc.status !== 'completed')
  }, [selectedLocation])

  // Fetch total enrollment count for social proof
  useEffect(() => {
    fetch('/api/enrollment-count')
      .then(res => res.json())
      .then(data => { if (data.count > 0) setEnrollmentCount(data.count) })
      .catch(() => {})
  }, [])

  const handleLocationSelect = (value: string) => {
    setSelectedLocation(value)
    setError(null)
  }

  const handleCheckout = async (courseType: 'online-only' | 'full-course') => {
    setLoading(courseType)
    setError(null)

    trackEvent('checkout_start', { courseType, source: 'pricing_page' })

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseType,
          location: courseType === 'full-course' && selectedLocation ? selectedLocation : undefined,
          preferredCity: courseType === 'online-only' ? preferredCity || undefined : undefined,
        }),
      })

      const data = await res.json()

      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(null)
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
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
          {/* Online Course - Compact */}
          <div className="card rounded-xl p-5 flex flex-col relative">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50">
                <BookOpen className="w-4 h-4 text-[var(--accent)]" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Start Here
              </span>
            </div>

            <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">Online Course</h3>

            <div className="mb-3">
              <div className="text-2xl font-bold text-[var(--foreground)]">${CONFIG.COURSE.PRICE_ONLINE}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">or 4 x ${Math.ceil(CONFIG.COURSE.PRICE_ONLINE / 4 * 100) / 100} with Afterpay</p>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">One-time · Lifetime access · Content updated regularly · 8 CPD pts</p>
            </div>

            <ul className="space-y-1.5 mb-4 flex-1">
              {[
                '8 online modules (8 CPD points)',
                'Own pace — no deadlines',
                'Clinical Toolkit & resources',
                'Upgrade to Complete Course anytime',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-[var(--muted-foreground)]">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mb-3">
              <label className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1.5 block">
                Preferred workshop city (optional)
              </label>
              <select
                value={preferredCity}
                onChange={(e) => setPreferredCity(e.target.value)}
                className="w-full py-2 px-2.5 rounded-lg border border-[rgba(13,115,119,0.1)] bg-[rgba(255,255,255,0.8)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/40"
              >
                <option value="">Not sure yet</option>
                {LOCATIONS.map(loc => (
                  <option key={loc.value} value={loc.value}>{loc.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleCheckout('online-only')}
              disabled={loading !== null}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-[var(--foreground)] text-white hover:bg-[var(--foreground)]/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'online-only' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                `Enrol Now — $${CONFIG.COURSE.PRICE_ONLINE}`
              )}
            </button>
            <div className="mt-3 text-center">
              <a
                href="/scat-mastery"
                className="text-[11px] font-semibold text-[var(--accent)] hover:underline underline-offset-4"
              >
                Or start free — 2 CPD points →
              </a>
            </div>
          </div>

          {/* Complete Course - Compact (Recommended) */}
          <div className="card card-visible rounded-xl p-5 flex flex-col relative" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.2)' }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200/50">
                <Award className="w-4 h-4 text-orange-500" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                Recommended
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
                  <div className="text-2xl font-bold text-[var(--foreground)]">${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">or 4 x ${Math.ceil(CONFIG.COURSE.PRICE_EARLY_BIRD / 4 * 100) / 100} with Afterpay</p>
                  <p className="text-[10px] text-orange-600 font-medium mt-0.5">Early bird ends {new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-[var(--foreground)]">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">or 4 x ${Math.ceil(CONFIG.COURSE.PRICE_REGULAR / 4 * 100) / 100} with Afterpay</p>
                </>
              )}
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">One-time · 14 AHPRA CPD points</p>
            </div>

            <ul className="space-y-1.5 mb-4 flex-1">
              {[
                '8 online modules (8 CPD points)',
                'Full-day workshop (6 CPD points)',
                'Hands-on SCAT6, VOMS, BESS',
                'Clinical Toolkit & resources',
                'Certificate included',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3 h-3 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-[var(--muted-foreground)]">{f}</span>
                </li>
              ))}
            </ul>

            {/* Why hands-on matters */}
            <div className="mb-4 p-3 rounded-lg bg-[rgba(13,115,119,0.04)] border border-[rgba(13,115,119,0.12)]">
              <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wide mb-2">Why hands-on matters</p>
              <ul className="space-y-1.5">
                {[
                  'Practice SCAT6 administration on real subjects with expert feedback',
                  'Master BESS & tandem gait scoring — the sections clinicians find most challenging',
                  'Leave with a clinical toolkit you can use Monday morning',
                ].map((item, i) => (
                  <li key={i} className="text-[11px] text-[var(--muted-foreground)] leading-relaxed flex items-start gap-1.5">
                    <span className="text-[var(--accent)] mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Workshop preference */}
            <div className="mb-3">
              <label className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1.5 block">
                Preferred workshop city (AU/NZ only)
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => handleLocationSelect(e.target.value)}
                className="w-full py-2 px-2.5 rounded-lg border border-[rgba(13,115,119,0.1)] bg-[rgba(255,255,255,0.8)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/40"
              >
                <option value="">Select city</option>
                {LOCATIONS.map(loc => (
                  <option key={loc.value} value={loc.value}>{loc.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                Complete online modules first. Nominate your workshop date from your dashboard.
              </p>
            </div>

            <button
              onClick={() => handleCheckout('full-course')}
              disabled={loading !== null}
              className="btn-primary w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading === 'full-course' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                `Enrol — $${isEarlyBird ? CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString() : CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}`
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // FULL VARIANT
  return (
    <div className="max-w-[900px] mx-auto">
      {/* Global error */}
      {error && (
        <div className="max-w-2xl mx-auto mb-8 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 pt-5">

        {/* Online Course */}
        <div className="card rounded-2xl p-7 md:p-8 flex flex-col relative">
          {/* Icon + Badge */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50">
              <BookOpen className="w-5 h-5 text-[var(--accent)]" strokeWidth={2} />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Start Here
            </span>
          </div>

          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Online Course</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
            Start with the 8 online modules at your own pace. Upgrade to the Complete Course to add hands-on SCAT6, VOMS &amp; BESS training (14 CPD points total).
          </p>

          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[var(--foreground)] tracking-tight">${CONFIG.COURSE.PRICE_ONLINE}</span>
              <span className="text-sm text-[var(--muted-foreground)]">AUD</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">or 4 x ${Math.ceil(CONFIG.COURSE.PRICE_ONLINE / 4 * 100) / 100} with Afterpay</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">One-time payment · Lifetime access · Content updated regularly · 8 CPD points</p>
          </div>

          {/* Mobile-only CTA */}
          <div className="md:hidden mb-5">
            <button
              onClick={() => handleCheckout('online-only')}
              disabled={loading !== null}
              className="btn-primary w-full py-3.5 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
            <p className="text-[11px] text-[var(--muted-foreground)] mt-2 text-center">
              Afterpay / Klarna available · 7-day guarantee · Secure checkout
            </p>
          </div>

          <ul className="space-y-3 mb-7 flex-1">
            {[
              '8 online modules (8 CPD points)',
              'Complete at your own pace — no deadlines',
              'Lifetime access — content updated regularly',
              'Clinical Toolkit & downloadable resources',
              'Reference Repository (140+ articles)',
              'Digital certificate',
              'Upgrade to Complete Course anytime',
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <Check className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[var(--muted-foreground)]">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mb-4">
            <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1.5 block">
              Which city would you attend a future workshop?
            </label>
            <select
              value={preferredCity}
              onChange={(e) => setPreferredCity(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-[rgba(13,115,119,0.1)] bg-[rgba(255,255,255,0.8)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/40"
            >
              <option value="">Not sure yet</option>
              {LOCATIONS.map(loc => (
                <option key={loc.value} value={loc.value}>{loc.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleCheckout('online-only')}
            disabled={loading !== null}
            className="btn-primary w-full py-3.5 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

          <p className="text-[11px] text-[var(--muted-foreground)] mt-3 text-center">
            Afterpay / Klarna available · 7-day guarantee · Secure checkout
          </p>

          <div className="mt-4 pt-4 border-t border-[rgba(13,115,119,0.08)] text-center">
            <p className="text-xs text-[var(--muted-foreground)] mb-2">Not ready to commit?</p>
            <a
              href="/scat-mastery"
              className="text-sm font-semibold text-[var(--accent)] hover:underline underline-offset-4"
            >
              Start free — 2 CPD points, no card needed →
            </a>
          </div>
        </div>

        {/* Complete Course — Recommended */}
        <div className="card card-visible rounded-2xl p-7 md:p-8 flex flex-col relative" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.2)' }}>
          {/* Icon + Badge */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200/50">
              <Award className="w-5 h-5 text-orange-500" strokeWidth={2} />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              Recommended
            </span>
          </div>

          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Complete Course</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
            Full training: 8 online modules plus a full-day hands-on workshop. Everything you need for clinical confidence.
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
                </div>
                <p className="text-sm text-slate-500 mt-1">or 4 x ${Math.ceil(CONFIG.COURSE.PRICE_EARLY_BIRD / 4 * 100) / 100} with Afterpay</p>
                <p className="text-xs text-orange-600 font-medium mt-1">Early bird ends {new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[var(--foreground)] tracking-tight">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</span>
                  <span className="text-sm text-[var(--muted-foreground)]">AUD</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">or 4 x ${Math.ceil(CONFIG.COURSE.PRICE_REGULAR / 4 * 100) / 100} with Afterpay</p>
              </>
            )}
            <p className="text-xs text-[var(--muted-foreground)] mt-1">One-time payment · 14 AHPRA CPD points</p>
          </div>

          <ul className="space-y-3 mb-6 flex-1">
            {[
              '8 online modules (8 CPD points)',
              'Full-day in-person workshop (6 CPD points)',
              'Hands-on SCAT6, VOMS, BESS training',
              'Clinical Toolkit & all resources',
              'Reference Repository (140+ articles)',
              'Choose your preferred location',
              'Flexible workshop date selection',
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <Check className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[var(--muted-foreground)]">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Why hands-on matters */}
          <div className="mb-6 p-4 rounded-xl bg-[rgba(13,115,119,0.04)] border border-[rgba(13,115,119,0.12)]">
            <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wide mb-2.5">Why hands-on matters</p>
            <ul className="space-y-2">
              {[
                'Practice SCAT6 administration on real subjects with expert feedback',
                'Master BESS & tandem gait scoring — the sections clinicians find most challenging',
                'Leave with a clinical toolkit you can use Monday morning',
              ].map((item, i) => (
                <li key={i} className="text-sm text-[var(--muted-foreground)] leading-relaxed flex items-start gap-2">
                  <span className="text-[var(--accent)] mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Q1 social proof */}
          {CONFIG.WORKSHOP.Q1_COMPLETED && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200/60">
              <p className="text-xs text-emerald-800 font-medium">
                Q1 2026 workshops delivered in Sydney, Melbourne &amp; Byron Bay. Next round: {CONFIG.WORKSHOP.NEXT_ROUND}.
              </p>
            </div>
          )}

          {/* Workshop Preference */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-[var(--foreground)]">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
              Preferred Workshop City
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => handleLocationSelect(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-[rgba(13,115,119,0.1)] bg-[rgba(255,255,255,0.8)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/40"
            >
              <option value="">Select city</option>
              {LOCATIONS.map(loc => (
                <option key={loc.value} value={loc.value}>{loc.label}</option>
              ))}
            </select>
            <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
              Complete online modules first. Nominate your workshop date from your dashboard after finishing the course.
            </p>
          </div>

          {/* Enroll Button */}
          <button
            onClick={() => handleCheckout('full-course')}
            disabled={loading !== null}
            className="btn-primary w-full py-3.5 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {loading === 'full-course' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Enrol — ${isEarlyBird ? CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString() : CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-[var(--muted-foreground)] mt-3 text-center">
            Afterpay / Klarna available · 7-day guarantee · Flexible workshop dates
          </p>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[var(--muted-foreground)]">
        {enrollmentCount >= 10 && (
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={2.5} />
            {enrollmentCount}+ clinicians enrolled
          </div>
        )}
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
