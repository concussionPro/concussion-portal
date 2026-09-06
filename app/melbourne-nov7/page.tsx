'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, Check, Loader2, MapPin, Users, Utensils } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { PracticalDayPhoto } from '@/components/pricing/PracticalDayPhoto'
import { CheckoutRescue } from '@/components/CheckoutRescue'
import { CheckoutEmailField, useCheckoutEmail } from '@/components/CheckoutEmailField'
import { CONFIG, upgradePriceFor, cpdYearEnd, CPD_YEAR_END_LABEL, CPD_HOURS_PHYSIO, CPD_HOURS_OSTEO } from '@/lib/config'
import { buildSecureSeatUrgency } from '@/lib/secure-seat-urgency'
import { trackEvent } from '@/lib/analytics'

/**
 * /melbourne-nov7 — PRE-RELEASE landing for the Round-4 Melbourne practical
 * day (Sat 7 Nov 2026, Rydges Exhibition St). The date is NOT public on the
 * site (owner pulled it until the venue is contracted); this page exists so
 * the warm-list blast's "Take a Melbourne seat" lands on the actual date card
 * and a DIRECT checkout, not generic /pricing (owner 2026-08-16). noindex via
 * layout; linked only from the blast.
 *
 * Date/venue copy is deliberately LOCAL here, not CONFIG (config drives the
 * public site; this page is the pre-release exception and dies at launch).
 */

const DATE_LABEL = 'Saturday 7 November 2026'
const VENUE = 'Rydges Melbourne — Exhibition Street, CBD'

export default function MelbourneNov7Page() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Redirect-blocked fallback — see PricingOptions: renders only if the page
  // survives the navigation order (proxy blocked stripe.com).
  const [stuckCheckoutUrl, setStuckCheckoutUrl] = useState<string | null>(null)
  const {
    email: checkoutEmail,
    setEmail: setCheckoutEmail,
    sessionEmail: checkoutSessionEmail,
    resolved: resolvedCheckoutEmail,
  } = useCheckoutEmail()
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('cea-checkout-pending')
      if (raw) {
        const { url, t } = JSON.parse(raw)
        if (url && Date.now() - t < 10 * 60 * 1000) setStuckCheckoutUrl(url)
        else sessionStorage.removeItem('cea-checkout-pending')
      }
    } catch {}
  }, [])
  // Live round-scoped seat count (same /api/city-progress the cards use).
  // The pre-release path has no hard cap at checkout (Melbourne isn't
  // status='confirmed'), so the HONESTY control at volume is here: show real
  // seats remaining and flip to a next-round state when the room is full —
  // extra buyers legally roll to the next round (nomination model), but
  // nobody is sold a "Nov 7 seat" the page knows is gone.
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null)
  useEffect(() => {
    fetch('/api/city-progress')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const mel = d?.cities?.find?.((c: { slug: string }) => c.slug === 'melbourne')
        if (mel && typeof mel.enrolled === 'number') {
          setSeatsLeft(Math.max(0, CONFIG.WORKSHOP.CAPACITY_PER_COURSE - mel.enrolled))
        }
      })
      .catch(() => null)
  }, [])
  const soldOut = seatsLeft === 0

  const enrol = async () => {
    if (loading) return
    if (!resolvedCheckoutEmail) {
      setError('Enter your email so we can send your enrolment link if checkout is interrupted.')
      return
    }
    setLoading(true)
    setError(null)
    trackEvent('checkout_start', { courseType: 'full-course', location: 'melbourne', source: 'melbourne-nov7' })
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseType: 'full-course',
          location: 'melbourne',
          email: resolvedCheckoutEmail,
          utm: { source: 'email', medium: 'email', campaign: 'quarterly_blast_v1' },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        setError(data?.error || 'Could not start checkout — please try again.')
        setLoading(false)
        return
      }
      try { sessionStorage.setItem('cea-checkout-pending', JSON.stringify({ url: data.url, t: Date.now() })) } catch {}
      window.location.href = data.url
      setTimeout(() => { setStuckCheckoutUrl(data.url); setLoading(false) }, 2500)
    } catch {
      setError('Network error — please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-2xl mx-auto px-6 pt-[120px] pb-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent text-center mb-3">
          Melbourne Round 4 — enrolling now
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-8">
          Melbourne practical skills training
        </h1>

        {/* The portal's practical-day media card — same component as /pricing */}
        <PracticalDayPhoto stream="ccm" />

        {/* The date card */}
        <div className="card card-visible rounded-2xl p-6 md:p-7" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.35)' }}>
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-xl font-bold text-foreground">{DATE_LABEL}</p>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-accent" /> {VENUE}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wide bg-amber-100 border border-amber-300 text-amber-900 rounded-full px-2.5 py-0.5 mb-1">
                Early-bird until 24 October
              </span>
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-3xl font-bold text-foreground tracking-tight">${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}</span>
                <span className="text-[11px] text-muted-foreground">AUD</span>
              </div>
              <p className="text-[11px] text-muted-foreground">then ${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()} · complete course</p>
            </div>
          </div>

          {/* THE SALES DRIVERS — owner: never hidden, never muted */}
          <div className="grid gap-2 mb-4">
            <div className="flex items-center gap-2.5 rounded-xl bg-teal-50 border border-teal-200 px-3.5 py-2.5">
              <Users className="w-5 h-5 text-teal-700 flex-shrink-0" />
              <p className="text-[14px] font-bold text-slate-900">
                {(() => {
                  const capacity = CONFIG.WORKSHOP.CAPACITY_PER_COURSE
                  if (seatsLeft === null) return `Capped at ${capacity} seats`
                  const enrolled = Math.max(0, capacity - seatsLeft)
                  const urgency = buildSecureSeatUrgency({
                    cityLabel: 'Melbourne',
                    enrolled,
                    threshold: capacity,
                    progressKnown: true,
                  })
                  // Half-full rule: never flash "11 of 12 seats left" on a 1-paid room.
                  return urgency.progressLine || `Capped at ${capacity} seats`
                })()}
                <span className="font-medium text-slate-600"> — CCM and CRM streams train together, one multidisciplinary room</span>
              </p>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-teal-50 border border-teal-200 px-3.5 py-2.5">
              <Utensils className="w-5 h-5 text-teal-700 flex-shrink-0" />
              <p className="text-[14px] font-bold text-slate-900">
                Fully catered
                <span className="font-medium text-slate-600"> — lunch, morning tea and barista coffee all day, included</span>
              </p>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-teal-50 border border-teal-200 px-3.5 py-2.5">
              <BookOpen className="w-5 h-5 text-teal-700 flex-shrink-0" />
              <p className="text-[14px] font-bold text-slate-900">
                High-quality practical handbook
                <span className="font-medium text-slate-600"> — included with the day</span>
              </p>
            </div>
          </div>

          <ul className="space-y-1.5 mb-5">
            {[
              'Supervised practice on real subjects — SCAT6, VOMS, BESS, cervical assessment',
              'Graded exertional testing through to the exercise prescription',
              `All ${CONFIG.COURSE.TOTAL_MODULES} online modules + clinical toolkit included — ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours total`,
              'Physios, osteos and exercise professionals in one room',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13.5px] text-slate-700">
                <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                {f}
              </li>
            ))}
          </ul>

          {soldOut && (
            <p className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[13px] text-amber-900">
              This room is full. Enrolling now secures your seat at the next Melbourne round —
              your early-bird rate is locked and your payment carries in full.
            </p>
          )}
          <CheckoutEmailField
            email={checkoutEmail}
            setEmail={setCheckoutEmail}
            sessionEmail={checkoutSessionEmail}
            disabled={loading}
            inputId="melbourne-nov7-checkout-email"
            className="mb-3 text-left"
          />
          <button
            type="button"
            onClick={enrol}
            disabled={loading}
            className="btn-primary w-full py-3.5 px-5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{soldOut ? 'Secure the next Melbourne round' : 'Take a Melbourne seat'} — ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} <ArrowRight className="w-4 h-4" /></>}
          </button>
          {stuckCheckoutUrl && (
            <div className="mt-3">
              <CheckoutRescue url={stuckCheckoutUrl} />
            </div>
          )}
          {error && <p className="text-xs text-red-600 mt-2 text-center">{error}</p>}
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            Secure Stripe checkout · 7-day money-back guarantee · tax invoice with payment
          </p>

          {/* THE CPD DEADLINE — the single strongest documented purchase trigger
              for clinicians is licence-renewal compliance, not content. This is
              a published regulatory date (Physiotherapy/Osteopathy Boards: CPD
              year 1 Dec – 30 Nov, renewal due 30 Nov), so it can be stated
              plainly without touching the no-fake-scarcity rule. */}
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
            <p className="text-[13px] font-bold text-amber-900">
              {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours — most of your year, in one course
            </p>
            <p className="text-[12px] text-amber-900/85 mt-0.5 leading-snug">
              Physiotherapists need {CPD_HOURS_PHYSIO} hours a year and osteopaths {CPD_HOURS_OSTEO};
              the CPD year closes {CPD_YEAR_END_LABEL}. This day sits{' '}
              {Math.max(
                0,
                Math.round((cpdYearEnd().getTime() - (CONFIG.LOCATIONS.MELBOURNE.dateObj?.getTime() ?? 0)) / 86400000),
              )}{' '}
              days before that deadline — and your certificate is issued on the day.
            </p>
          </div>
        </div>

        {/* Already-online upgrade */}
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-center">
          <p className="text-sm font-bold text-foreground mb-1">Already bought the online course?</p>
          <p className="text-[13px] text-muted-foreground mb-3">
            Upgrade to the practical skills training for the difference — ${upgradePriceFor('melbourne')} — your online payment counts in full.
          </p>
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white border border-amber-300 text-sm font-semibold text-foreground hover:bg-amber-50 transition-colors"
          >
            Upgrade for ${upgradePriceFor('melbourne')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <p className="mt-6 text-[12px] text-muted-foreground text-center">
          Can&rsquo;t make Melbourne? Reply to the email and nominate Sydney or Byron Bay — dates
          are set on the numbers.
        </p>

        {/* Endorsement badges — bottom placement per the approved campaign pattern */}
        <div className="mt-10 pt-8 border-t border-slate-200 text-center">
          <p className="text-[13px] font-semibold text-foreground mb-4">
            {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours — available to all allied health clinicians
          </p>
          <div className="flex items-center justify-center gap-6 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/osteopathy-australia-endorsed.png" alt="Endorsed by Osteopathy Australia" className="h-12 w-auto" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/essa-accredited-pd.png" alt="Accredited by ESSA" className="h-9 w-auto" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            CCM and CRM are officially endorsed and accredited by Osteopathy Australia and ESSA respectively.
          </p>
        </div>
      </main>
    </div>
  )
}
