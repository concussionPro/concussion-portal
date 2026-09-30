'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, MapPin, ShieldCheck } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { PracticalDayPhoto } from '@/components/pricing/PracticalDayPhoto'
import { CONFIG } from '@/lib/config'
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
 * Checkout is deliberately NOT duplicated here: the practical-day CTA hands
 * off to /melbourne-nov7, which owns the live seat count, the sold-out roll
 * and the rescue path.
 *
 * Date/venue copy is LOCAL, as on /melbourne-nov7 — this is an event page
 * with a fixed early-bird, not a surface the public config drives.
 */

const DATE_LABEL = 'Saturday 7 November 2026'
const VENUE = 'Rydges Melbourne — Exhibition Street, CBD'
const EARLY_BIRD_LABEL = '24 October'

export default function Oa2026Page() {
  useEffect(() => {
    trackEvent('page_view', { source: 'oa2026', surface: 'conference_qr' })
  }, [])

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
        <p className="text-[15px] text-muted-foreground text-center mb-8 leading-relaxed">
          Everything demonstrated in the workshop — the rapid screen, the cervical and
          vestibulo-ocular differentiation, the exertion threshold and the staged return —
          is taught in full in Concussion Clinical Mastery.
        </p>

        <PracticalDayPhoto stream="ccm" />

        {/* PRIMARY — the practical day */}
        <div
          className="card card-visible rounded-2xl p-6 md:p-7 mb-5"
          style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.35)' }}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-xl font-bold text-foreground">{DATE_LABEL}</p>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-accent" /> {VENUE}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wide bg-amber-100 border border-amber-300 text-amber-900 rounded-full px-2.5 py-0.5 mb-1">
                Early-bird until {EARLY_BIRD_LABEL}
              </span>
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-3xl font-bold text-foreground tracking-tight">
                  ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}
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

          <Link
            href="/melbourne-nov7"
            onClick={() => cta('/melbourne-nov7', 'complete')}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-[15px] font-bold rounded-xl"
          >
            Take a Melbourne seat <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[12px] text-muted-foreground text-center mt-2.5">
            Capped at {CONFIG.WORKSHOP.CAPACITY_PER_COURSE} seats · fully catered · practical
            handbook included
          </p>
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

        <div className="flex items-start gap-2.5 rounded-xl bg-teal-50 border border-teal-200 px-4 py-3">
          <ShieldCheck className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">Endorsed by Osteopathy Australia</span>{' '}
            — {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours in total (
            {CONFIG.COURSE.ONLINE_CPD_POINTS} online + {CONFIG.COURSE.IN_PERSON_CPD_POINTS} in
            person). Concussion Rehab Mastery, the separate ESSA-accredited stream for exercise
            physiologists, shares the same practical day.
          </p>
        </div>

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
