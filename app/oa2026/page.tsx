'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Loader2, MapPin, ShieldCheck } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { PracticalDayPhoto } from '@/components/pricing/PracticalDayPhoto'
import { CheckoutRescue } from '@/components/CheckoutRescue'
import { CheckoutEmailField, useCheckoutEmail } from '@/components/CheckoutEmailField'
import {
  CONFIG,
  cpdYearEnd,
  CPD_YEAR_END_LABEL,
  CPD_HOURS_PHYSIO,
  CPD_HOURS_OSTEO,
} from '@/lib/config'
import { trackEvent } from '@/lib/analytics'

/**
 * /oa2026 — the QR target on the closing slide of the Osteopathy Australia
 * National Conference workshop (Fri 16 Oct 2026, Sea World, two 90-min
 * sittings).
 *
 * ONE JOB: convert a room of AHPRA-registered osteopaths who have just
 * watched the live assessment workshop into an enrolment — practical day
 * first, online rung second. See [[feedback_page_purpose_optimization]].
 *
 * It exists as its own route rather than a printed deep link so the QR on a
 * submitted, backed-up deck stays valid if the destination has to change:
 * OA holds a copy of the .pptx from late September and changes after
 * submission are NOT guaranteed to reach the day. Every CTA carries
 * source:'oa2026' so conference traffic is separable in the funnel
 * (see [[cea_analytics_optimization_loop]]) — the conference is the volume
 * driver for Melbourne Round 4, so it has to be measurable on its own.
 *
 * CHECKOUT IS ON THIS PAGE (owner 2026-10-13: "make it easy", "no huge forms
 * or multiple clicks", "just click and pay. reserve seat"). It used to hand
 * off to /melbourne-nov7, which made the room do two page loads before they
 * could pay. The seat is now reserved from here: one email box, one button,
 * Stripe. /melbourne-nov7 still exists for the warm-list blast and still owns
 * the sold-out roll; this page posts to the same /api/create-checkout, so
 * there is one checkout implementation, not two.
 *
 * NOV 7 IS COMMIT-OR-DON'T. No email capture, no pre-registration and no $100
 * soft-commit on this date (owner: "no email sign up/pre reg for nov 7 ...
 * they commit or not"). The A$100 deposit is for ANY OTHER city or a future
 * date, and lives on those pages — not here.
 *
 * Date/venue copy is LOCAL, as on /melbourne-nov7 — this is an event page
 * with a fixed early-bird, not a surface the public config drives.
 */

const DATE_LABEL = 'Saturday 7 November 2026'
// Catering rides WITH the venue, not only in the small print under the button
// (owner 2026-10-13; same rule as feedback_catering_leads_the_benefits). A
// clinician giving up a Saturday reads the venue line and wants to know lunch
// is handled — it is a benefit, not a logistics footnote.
const VENUE = 'Rydges Melbourne — Exhibition Street, CBD · fully catered'
const EARLY_BIRD_LABEL = '24 October'
const PROMO = CONFIG.COURSE.OA_CONFERENCE_PROMO_CODE

export default function Oa2026Page() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stuckCheckoutUrl, setStuckCheckoutUrl] = useState<string | null>(null)
  const {
    email: checkoutEmail,
    setEmail: setCheckoutEmail,
    sessionEmail: checkoutSessionEmail,
    resolved: resolvedCheckoutEmail,
  } = useCheckoutEmail()

  // The conference discount, read off the live Stripe promotion code. Null
  // until the answer arrives, so the page renders the full early-bird price
  // first and only ever moves DOWN — a visitor never sees a discount appear
  // and then vanish, and never sees a price the checkout would refuse.
  // See /api/promo-status for why this is not a constant.
  const [promoOffAud, setPromoOffAud] = useState<number | null>(null)
  useEffect(() => {
    fetch(`/api/promo-status?code=${encodeURIComponent(PROMO)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.active && typeof d.amountOffAud === 'number') setPromoOffAud(d.amountOffAud)
      })
      .catch(() => null)
  }, [])

  const listPrice = CONFIG.COURSE.PRICE_EARLY_BIRD
  const payNow = promoOffAud ? listPrice - promoOffAud : listPrice

  useEffect(() => {
    trackEvent('page_view', { source: 'oa2026', surface: 'conference_qr' })
  }, [])

  // Redirect-blocked fallback — same pattern as /melbourne-nov7 and
  // PricingOptions: only renders if the page survives the navigation.
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

  const reserveSeat = async () => {
    if (loading) return
    if (!resolvedCheckoutEmail) {
      setError('Enter your email so we can send your enrolment link if checkout is interrupted.')
      return
    }
    setLoading(true)
    setError(null)
    trackEvent('checkout_start', {
      courseType: 'full-course',
      location: 'melbourne',
      source: 'oa2026',
      promo: PROMO,
    })
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseType: 'full-course',
          location: 'melbourne',
          email: resolvedCheckoutEmail,
          // Auto-applied so nobody in the room has to type it. Stripe is the
          // authority: an expired or exhausted code simply does not attach and
          // they pay the early-bird price the page was already showing.
          promoCode: PROMO,
          // Keys MUST be utm_source/utm_medium/utm_campaign: lib/stripe.ts
          // stamps metadata from `utm?.utm_source`, and utmSchema is a loose
          // string map, so a {source,medium,campaign} payload validates fine
          // and then silently stamps nothing. Verified against a live session
          // 2026-10-14 — conference attribution is the entire reason this
          // route exists, so it cannot be left to a key that reads as correct.
          utm: { utm_source: 'oa2026', utm_medium: 'qr', utm_campaign: 'oa_conference_2026' },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        setError(data?.error || 'Could not start checkout — please try again.')
        setLoading(false)
        return
      }
      try {
        sessionStorage.setItem('cea-checkout-pending', JSON.stringify({ url: data.url, t: Date.now() }))
      } catch {}
      window.location.href = data.url
      setTimeout(() => {
        setStuckCheckoutUrl(data.url)
        setLoading(false)
      }, 2500)
    } catch {
      setError('Network error — please try again.')
      setLoading(false)
    }
  }

  const cta = (destination: string, tier: string) =>
    trackEvent('enroll_button_click', { source: 'oa2026', destination, tier })

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-2xl mx-auto px-6 pt-[120px] pb-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent text-center mb-3">
          Osteopathy Australia National Conference · 16 October 2026
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-3">
          Concussion science in practice
        </h1>
        <p className="text-[15px] text-muted-foreground text-center mb-5 leading-relaxed">
          Everything demonstrated in the workshop — the rapid screen, the cervical and
          vestibulo-ocular differentiation, the exertion threshold and the staged return —
          is taught in full in Concussion Clinical Mastery.
        </p>

        {/* AUTHORITY + VALUE, BEFORE THE PRICE.
            This was the second-to-last block on the page, below four tool
            descriptions. Two problems with that: the reader is standing inside
            an OA conference, so OA's own endorsement is the most relevant trust
            signal available and it was arriving last; and the CPD total — the
            thing that makes $1,190 read as cheap rather than expensive — was
            reached only after the price had already been judged.
            Osteopaths need CPD_HOURS_OSTEO a year and the CPD year closes
            30 Nov, 23 days after this workshop. That is the strongest
            documented purchase trigger for a clinician (it is why the same
            block exists on /melbourne-nov7) and it was missing here entirely. */}
        <div className="rounded-2xl border border-teal-200 bg-teal-50/70 px-5 py-4 mb-6">
          <p className="text-[13.5px] font-bold text-slate-900 flex items-start gap-2">
            <ShieldCheck className="w-[18px] h-[18px] text-teal-700 flex-shrink-0 mt-[1px]" />
            Endorsed by Osteopathy Australia · {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours
            <span className="font-medium text-slate-600">
              {' '}
              ({CONFIG.COURSE.ONLINE_CPD_POINTS} online + {CONFIG.COURSE.IN_PERSON_CPD_POINTS} in
              person)
            </span>
          </p>
          <p className="text-[13px] text-slate-700 mt-1.5 leading-relaxed">
            Osteopaths need {CPD_HOURS_OSTEO} hours a year and the CPD year closes{' '}
            {CPD_YEAR_END_LABEL} — so this is {CONFIG.COURSE.TOTAL_CPD_POINTS} of your{' '}
            {CPD_HOURS_OSTEO}, certificate issued on the day,{' '}
            {Math.max(
              0,
              Math.round(
                (cpdYearEnd().getTime() - (CONFIG.LOCATIONS.MELBOURNE.dateObj?.getTime() ?? 0)) /
                  86400000,
              ),
            )}{' '}
            days before the deadline. Physiotherapists need {CPD_HOURS_PHYSIO}.
          </p>
        </div>

        <PracticalDayPhoto stream="ccm" />

        {/* PRIMARY — the practical day */}
        <div
          className="card card-visible rounded-2xl p-6 md:p-7 mb-5"
          style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.35)' }}
        >
          {/* NAME THE WHOLE THING ABOVE THE PRICE. The shared
              PracticalDayPhoto above is headed "The practical day", so without
              this the reader forms a price judgement on $1,190-for-one-Saturday
              and only learns the 8 online modules are included four bullets
              later. Same price, completely different judgement. */}
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent mb-1.5">
            Complete course · {CONFIG.COURSE.TOTAL_MODULES} online modules + the practical day
          </p>
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-xl font-bold text-foreground">{DATE_LABEL}</p>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-accent" /> {VENUE}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wide bg-amber-100 border border-amber-300 text-amber-900 rounded-full px-2.5 py-0.5 mb-1">
                {promoOffAud ? 'Conference rate' : 'Early-bird'} until {EARLY_BIRD_LABEL}
              </span>
              <div className="flex items-baseline gap-1.5 justify-end">
                {promoOffAud ? (
                  <span className="text-[15px] font-semibold text-muted-foreground line-through decoration-slate-400">
                    ${listPrice.toLocaleString()}
                  </span>
                ) : null}
                <span className="text-3xl font-bold text-foreground tracking-tight">
                  ${payNow.toLocaleString()}
                </span>
                <span className="text-[11px] text-muted-foreground">AUD</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                then ${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()} · complete course
              </p>
            </div>
          </div>

          <ul className="space-y-1.5 mb-5">
            {[
              'The three demonstrations from the workshop, practised on each other with feedback',
              'Supervised practice on real subjects — SCAT6, VOMS, BESS, cervical assessment',
              'Graded exertional testing through to the exercise prescription',
              `All ${CONFIG.COURSE.TOTAL_MODULES} online modules + clinical toolkit included — ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours total`,
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13.5px] text-slate-700">
                <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                {f}
              </li>
            ))}
          </ul>

          {promoOffAud ? (
            <p className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[13px] text-amber-900 text-center">
              <span className="font-bold">
                A${promoOffAud} conference discount applied — code {PROMO}.
              </span>{' '}
              Already on the button below. It closes with the early bird on {EARLY_BIRD_LABEL}.
            </p>
          ) : null}
          <CheckoutEmailField
            email={checkoutEmail}
            setEmail={setCheckoutEmail}
            sessionEmail={checkoutSessionEmail}
            disabled={loading}
            inputId="oa2026-checkout-email"
            className="mb-3 text-left"
          />
          <button
            type="button"
            onClick={reserveSeat}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-[15px] font-bold rounded-xl disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Reserve my seat — ${payNow.toLocaleString()} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          {stuckCheckoutUrl && (
            <div className="mt-3">
              <CheckoutRescue url={stuckCheckoutUrl} />
            </div>
          )}
          {error && <p className="text-xs text-red-600 mt-2 text-center">{error}</p>}
          <p className="text-[12px] text-muted-foreground text-center mt-2.5">
            Capped at {CONFIG.WORKSHOP.CAPACITY_PER_COURSE} seats · fully catered · practical
            handbook included
          </p>
          <p className="text-[11px] text-muted-foreground text-center mt-1.5">
            Secure Stripe checkout · 7-day money-back guarantee · tax invoice with payment
          </p>
        </div>


        {/* THE CLINICAL SUITE — the answer to "what changes in my practice?"
            The session could not make this argument: the submitted disclosure
            says no products are sold during it. The page behind the QR is
            where it belongs, and it is the part of the offer that is not a
            course at all. Framed as instruments Zac built for his own
            caseload, because that is what they are — and described by what
            they DO rather than by a superiority claim, which AHPRA
            advertising rules would require us to substantiate. */}
        <div className="card card-visible rounded-2xl p-6 md:p-7 mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-2">
            Included with either option
          </p>
          <h2 className="text-xl font-bold text-foreground mb-1.5">
            The clinical suite
          </h2>
          <p className="text-[13.5px] text-muted-foreground mb-5 leading-relaxed">
            I built these for my own caseload, because the things I needed did not exist. They
            are part of the course, not an upsell.
          </p>

          <div className="space-y-4">
            {[
              {
                name: 'Pre-season baseline platform',
                body: 'A whole squad self-administers the SCAT6 baseline sections remotely — about five minutes each, no appointments. A report per athlete comes back to your clinic and is stored, so the re-test after an injury compares against their own number instead of a population norm.',
              },
              {
                name: 'Threshold-guided trainer + clinician dashboard',
                body: 'Sub-symptom aerobic prescription is the part patients get wrong alone. The band holds them at 80–90% of their measured threshold at home, and the session comes back to you — whether they stayed in band, what symptoms did afterwards, and whether the threshold has moved. Three months included.',
              },
              {
                name: 'SCAT6, SCOAT6 and Child SCAT6, scored as you go',
                body: 'The full forms in the browser, totalled automatically, exported as a PDF for the medical record. No paper, no arithmetic errors at the end of a long consult.',
              },
              {
                name: 'BCTT calculator and the clinical toolkit',
                body: 'The exertion protocol worked out for you, plus the flowcharts, referral thresholds and patient handouts from the course — the same ones I use in clinic.',
              },
            ].map((t) => (
              <div key={t.name} className="flex gap-3">
                <Check
                  className="w-4 h-4 text-accent flex-shrink-0 mt-[3px]"
                  strokeWidth={2.5}
                />
                <div>
                  <p className="text-[14.5px] font-bold text-foreground leading-snug">{t.name}</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">
                    {t.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECONDARY — the online rung */}
        <div className="card card-visible rounded-2xl p-5 md:p-6 mb-6">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2.5">
            <div>
              <p className="text-[15px] font-bold text-foreground">
                Not ready for the practical day?
              </p>
              <p className="text-[13.5px] text-muted-foreground mt-0.5">
                Start with the {CONFIG.COURSE.TOTAL_MODULES} online modules —{' '}
                {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours, self-paced, access never expires.
                You can add the practical day later.
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground tracking-tight">
                ${CONFIG.COURSE.PRICE_ONLINE.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">AUD</span>
            </div>
          </div>
          <Link
            href="/course"
            onClick={() => cta('/course', 'online')}
            className="text-[14px] font-bold text-accent inline-flex items-center gap-1.5 hover:underline"
          >
            See what the modules cover <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          {/* The third door, kept to one line. 7 Nov is commit-or-don't; the
              A$100 deposit is for any other city or a future date (owner:
              "they can sign up to any location for any other future date with
              $100 deposit"). It is NOT offered against Nov 7 above. */}
          <p className="mt-3 pt-3 border-t border-slate-200 text-[13px] text-muted-foreground leading-relaxed">
            Not in Melbourne on the 7th?{' '}
            <Link
              href="/in-person"
              onClick={() => cta('/in-person', 'deposit')}
              className="font-semibold text-accent hover:underline"
            >
              A$100 holds a place in another city or a future date
            </Link>{' '}
            — refundable, and it counts in full toward whatever you enrol in.
          </p>
        </div>
        {/* The OA endorsement + CPD total moved to the top of the page. What
            remains here is the one fact that lived only in that box: CRM is a
            SEPARATE, ESSA-accredited stream that shares this practical day.
            Kept apart from the OA line by design — docs/brand-voice.md bans
            presenting the two accreditations as one offering, and
            tests/factual-claims-lock.test.ts enforces it. */}
        <p className="text-[12.5px] text-muted-foreground text-center mt-6 leading-relaxed">
          Concussion Rehab Mastery, the separate ESSA-accredited stream for exercise
          physiologists, shares the same practical day.
        </p>

        <p className="text-[12.5px] text-muted-foreground text-center mt-8">
          Questions about the workshop or the course?{' '}
          <a
            href="mailto:info@concussion-education-australia.com"
            className="text-accent font-semibold hover:underline"
            onClick={() => trackEvent('shop_click', { source: 'oa2026', destination: 'email' })}
          >
            info@concussion-education-australia.com
          </a>
        </p>
      </main>
    </div>
  )
}
