'use client'

import { useState } from 'react'
import { Lock, ArrowRight, Award, BookOpen, ShieldCheck, Star, Loader2 } from 'lucide-react'
import { CONFIG, workshopPriceFor } from '@/lib/config'
import { trackEvent, trackLeadConversion } from '@/lib/analytics'

// Google Ads conversion label for paid enrol/checkout clicks (Add to cart)
const ENROL_CLICK_LABEL = 'vHoXCNKd6Y8cEJWXu_9C'

// Workshop-city nomination options (must match lib/schemas locationSchema)
const CITIES = [
  { slug: 'melbourne', label: 'Melbourne' },
  { slug: 'sydney', label: 'Sydney' },
  { slug: 'byron-bay', label: 'Byron Bay' },
  { slug: 'adelaide', label: 'Adelaide' },
  { slug: 'wa', label: 'Perth (WA)' },
]

export function ContentLockedBanner({ remainingSections }: { remainingSections?: string[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [city, setCity] = useState('melbourne')

  const fullPrice = workshopPriceFor(city)

  const handleCheckout = async (courseType: 'online-only' | 'full-course') => {
    setLoading(courseType)
    setError(null)
    trackEvent('checkout_start', { courseType, source: 'content_locked_banner', location: city })
    const value = courseType === 'full-course' ? fullPrice : CONFIG.COURSE.PRICE_ONLINE
    trackLeadConversion(ENROL_CLICK_LABEL, value)

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // full-course requires a workshop location (lib/schemas.ts superRefine
        // rejects it otherwise). Nomination model: the chosen city's date
        // launches when the city fills; buyers before then pay early-bird.
        body: JSON.stringify({
          courseType,
          ...(courseType === 'full-course' ? { location: city } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Checkout unavailable — please try again or contact support.')
        setLoading(null)
      }
    } catch {
      setError('Something went wrong. Please try again or contact support.')
      setLoading(null)
    }
  }

  return (
    <div className="relative my-8">
      {/* Fade out effect above the banner */}
      <div className="absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-white z-10"></div>

      {/* Lock banner */}
      <div className="relative z-20 glass rounded-2xl p-8 border-2 border-accent/30 shadow-xl">
        <div className="text-center">
          {/* Lock Icon */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>

          {/* Headline */}
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {remainingSections && remainingSections.length > 0
              ? `${remainingSections.length} more sections in this module`
              : 'Unlock the Full Course'}
          </h3>
          <p className="text-muted-foreground text-base mb-3 leading-relaxed max-w-2xl mx-auto">
            You&apos;ve seen the foundations. The full course teaches you to <strong className="text-foreground">administer VOMS screening, score BESS accurately, make confident return-to-play decisions, and treat by concussion phenotype</strong> &mdash; the clinical skills most practitioners haven&apos;t been trained on.
          </p>

          {/* Testimonial */}
          <div className="max-w-md mx-auto my-5 px-5 py-4 rounded-xl bg-accent/5 border border-accent/10">
            <div className="flex items-center justify-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-sm text-foreground italic leading-relaxed">
              &ldquo;Hands on component was invaluable — I feel confident assessing concussion now, not just reading about it.&rdquo;
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">Amelia, Physiotherapist</p>
          </div>

          <p className="text-sm text-accent font-semibold mb-1">
            7-day money-back guarantee &middot; Afterpay / Klarna available
          </p>
          <p className="text-[11px] text-muted-foreground mb-1">
            Full refund within 7 days if you&apos;ve completed fewer than 2 modules.
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            Endorsed by Osteopathy Australia &middot; AHPRA Aligned
          </p>

          {/* Value props row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 max-w-lg mx-auto">
            <div className="glass rounded-xl p-3 border border-border/30">
              <BookOpen className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-lg font-bold text-foreground">{CONFIG.COURSE.TOTAL_MODULES}</div>
              <div className="text-xs text-muted-foreground">Modules</div>
            </div>
            <div className="glass rounded-xl p-3 border border-border/30">
              <Award className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-lg font-bold text-foreground">Up to {CONFIG.COURSE.TOTAL_CPD_POINTS}</div>
              <div className="text-xs text-muted-foreground">8 online + 6 workshop</div>
            </div>
            <div className="glass rounded-xl p-3 border border-border/30">
              <ShieldCheck className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-xs font-semibold text-foreground leading-tight mt-1">AHPRA Aligned</div>
              <div className="text-xs text-muted-foreground">Endorsed by OA</div>
            </div>
          </div>

          {/* Direct checkout CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
            <button
              onClick={() => handleCheckout('online-only')}
              disabled={loading !== null}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm bg-[var(--foreground)] text-white hover:bg-[var(--foreground)]/90 transition-colors disabled:opacity-40"
            >
              {loading === 'online-only' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Online — ${CONFIG.COURSE.PRICE_ONLINE}</>
              )}
            </button>
            <button
              onClick={() => handleCheckout('full-course')}
              disabled={loading !== null}
              className="w-full sm:w-auto btn-primary inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-40"
            >
              {loading === 'full-course' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Complete — ${fullPrice.toLocaleString()}
                  {fullPrice < CONFIG.COURSE.PRICE_REGULAR && (
                    <span className="text-[11px] font-semibold opacity-80">early bird</span>
                  )}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Workshop-city nomination for the Complete option */}
          <div className="flex items-center justify-center gap-2 mb-3 text-xs text-muted-foreground">
            <span>Workshop city:</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              aria-label="Workshop city"
            >
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <p role="alert" aria-live="assertive" className="text-sm text-red-700 mt-2 max-w-md mx-auto">
              {error}
            </p>
          )}

          <p className="text-muted-foreground text-xs mt-2">
            8 CPD hours (online) &middot; 14 CPD hours (complete with workshop) &middot; your workshop date launches when your city fills
          </p>
        </div>
      </div>

      {/* Remaining sections as greyed-out titles */}
      {remainingSections && remainingSections.length > 0 && (
        <div className="relative mt-4 pointer-events-none select-none">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-xl"></div>
          <div className="space-y-3 py-2">
            {remainingSections.map((title, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200 opacity-50"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-400 text-sm">{title}</div>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded w-full"></div>
                    <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                    <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
