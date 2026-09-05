'use client'

import Link from 'next/link'
import { ArrowRight, GraduationCap, Activity } from 'lucide-react'
import { CONFIG, SST_TIER_FROM_AUD } from '@/lib/config'
import { SecureSeatCheckout } from '@/components/SecureSeatCheckout'

export interface ScatFunnelExitsProps {
  /** Where this promo sits (analytics / copy tweaks). */
  context?: 'scat-mastery' | 'scat-complete' | 'scat-mid' | 'after-assessment' | 'module-8'
  /** Hide Unlock your seat / Complete when already committed. */
  alreadyCommitted?: boolean
  /** Show SCAT promo code line (completers). */
  showPromo?: boolean
  className?: string
}

/**
 * Equal-weight dual exit after free SCAT value (owner 2026-09-05 — push SST harder):
 *  1) Learn full clinical competency — Online (front door) | Unlock your seat | Complete
 *  2) Apply your protocol with SST — /clinical-suite (Baseline shares the suite licence)
 *
 * Two separate surfaces — never mash course A$ and SST A$/mo into one card.
 */
export function ScatFunnelExits({
  context = 'scat-mastery',
  alreadyCommitted = false,
  showPromo = true,
  className = '',
}: ScatFunnelExitsProps) {
  const promo = CONFIG.COURSE.PROMO_CODE
  const discount = CONFIG.COURSE.SCAT_DISCOUNT_AUD
  const pricingHref = showPromo ? `/pricing?promo=${promo}` : '/pricing'

  const lead =
    context === 'module-8'
      ? 'You finished the online modules — add the catered practical day when you are ready, or run the protocol in clinic with SST.'
      : context === 'scat-complete' || context === 'scat-mid'
        ? 'SCAT mastery taught the assessment. Next: full clinical competency, or apply the rehab protocol in clinic with SST.'
        : 'SCAT mastery taught the assessment. Two equal next steps: learn full competency, or apply the rehab protocol in clinic with SST.'

  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm ${className}`}
      aria-labelledby="scat-funnel-exits"
    >
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b9aa6]">
        After free SCAT value
      </p>
      <h2
        id="scat-funnel-exits"
        className="mt-2 text-xl font-bold tracking-tight text-slate-900 md:text-2xl"
      >
        Two paths from here
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
        {lead}
      </p>

      {/* Equal-weight dual columns — course price and SST monthly stay on separate surfaces */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 md:gap-5">
        {/* ── Path 1: competency (course) ── */}
        <div className="flex flex-col rounded-2xl border-2 border-teal-300/80 bg-gradient-to-br from-teal-50/90 to-white p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-teal-100">
              <GraduationCap className="h-5 w-5 text-[#0d7377]" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700">
                Path 1 · Training
              </p>
              <h3 className="mt-0.5 text-lg font-bold text-slate-900">
                Learn full competency
              </h3>
              <p className="mt-1.5 text-[13px] leading-snug text-slate-600">
                Concussion Clinical Mastery — VOMS, BESS, phenotypes, return-to-play.
                {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD online · up to {CONFIG.COURSE.TOTAL_CPD_POINTS}{' '}
                with the catered day.
                {showPromo && (
                  <>
                    {' '}
                    Completers: code <strong>{promo}</strong> · A${discount} off Online.
                  </>
                )}
              </p>
            </div>
          </div>

          {!alreadyCommitted ? (
            <div className="mt-4 grid flex-1 gap-2.5 sm:grid-cols-1">
              <Link
                href={pricingHref}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-teal-300"
              >
                <span className="text-[11px] font-bold uppercase tracking-wide text-teal-700">
                  Online
                </span>
                <span className="mt-1 text-sm font-bold text-slate-900">
                  From A${CONFIG.COURSE.PRICE_ONLINE - (showPromo ? discount : 0)}
                </span>
                <span className="mt-0.5 text-[11px] text-slate-500">
                  {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD · start today
                </span>
                <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#0d7377]">
                  Enrol Online <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>

              <SecureSeatCheckout
                variant="button"
                source={`scat_funnel_${context}`}
                className="[&_button]:h-auto [&_button]:min-h-[3rem] [&_button]:w-full"
              />

              <Link
                href={`${pricingHref}#pricing-cards`}
                className="flex flex-col rounded-xl border-2 border-teal-300 bg-white p-3.5 transition-colors hover:border-teal-400"
              >
                <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
                  Complete
                </span>
                <span className="mt-1 text-sm font-bold text-slate-900">
                  From A${CONFIG.COURSE.PRICE_EARLY_BIRD}
                </span>
                <span className="mt-0.5 text-[11px] text-slate-500">
                  Date TBD · {CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD} paid commits
                </span>
                <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#0d7377]">
                  Enrol Complete <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              You already have a seat commitment — see{' '}
              <Link
                href="/learning"
                className="font-semibold text-[#0d7377] underline underline-offset-2"
              >
                your courses
              </Link>
              .
            </p>
          )}
        </div>

        {/* ── Path 2: SST apply protocol (equal weight, separate price surface) ── */}
        <div className="flex flex-col rounded-2xl border-2 border-cyan-300/80 bg-gradient-to-br from-cyan-50/90 to-white p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-100">
              <Activity className="h-5 w-5 text-cyan-800" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-800">
                Path 2 · Clinic tools
              </p>
              <h3 className="mt-0.5 text-lg font-bold text-slate-900">
                Apply your protocol with SST
              </h3>
              <p className="mt-1.5 text-[13px] leading-snug text-slate-600">
                SCAT mastery taught the assessment. SST is how you run the rehab protocol
                in clinic — measured sub-symptom exercise on the patient&apos;s watch.
                Baseline shares the suite licence.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-1 flex-col rounded-xl border border-cyan-200/80 bg-white p-4">
            <span className="text-[11px] font-bold uppercase tracking-wide text-cyan-800">
              SST Clinical Testing
            </span>
            <span className="mt-1 text-sm font-bold text-slate-900">
              From A${SST_TIER_FROM_AUD}/mo
            </span>
            <span className="mt-0.5 text-[11px] text-slate-500">
              Standalone suite pricing — not mixed with course fees
            </span>
            <p className="mt-3 text-[12.5px] leading-snug text-slate-600">
              Trainer + Baseline under one Clinical Testing licence. Pricing and plans live
              on /clinical-suite.
            </p>
            <div className="mt-auto flex flex-col gap-2.5 pt-4">
              <Link
                href="/clinical-suite"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-cyan-400 bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-700 transition-colors"
              >
                See SST Clinical Testing
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/clinical-suite/start"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300 bg-white px-5 py-2.5 text-sm font-bold text-cyan-900 hover:bg-cyan-50 transition-colors"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[12px] text-slate-500">
        Course pricing on{' '}
        <Link href={pricingHref} className="font-semibold text-[#0d7377] underline underline-offset-2">
          /pricing
        </Link>
        ; SST monthly on{' '}
        <Link
          href="/clinical-suite"
          className="font-semibold text-[#0d7377] underline underline-offset-2"
        >
          /clinical-suite
        </Link>
        . Separate products — do not combine into one fee.
      </p>
    </section>
  )
}
