'use client'

import Link from 'next/link'
import { ArrowRight, GraduationCap, Activity } from 'lucide-react'
import { CONFIG, SST_TIER_FROM_AUD } from '@/lib/config'
import { SecureSeatCheckout } from '@/components/SecureSeatCheckout'

export interface ScatFunnelExitsProps {
  /** Where this promo sits (analytics / copy tweaks). */
  context?: 'scat-mastery' | 'scat-complete' | 'scat-mid' | 'after-assessment' | 'module-8'
  /** Hide Secure your seat / Complete when already committed. */
  alreadyCommitted?: boolean
  /** Show SCAT promo code line (completers). */
  showPromo?: boolean
  className?: string
}

/**
 * Dual exit after free SCAT value (owner 2026-09-05):
 *  1) Learn full clinical competency — Online | Secure your seat | Complete
 *  2) Apply protocol in clinic — SST Clinical Testing (from A$49/mo)
 *
 * Kept visually separate — do not merge into one muddy CTA. Course buyers may
 * still get year-1 SST included elsewhere; this exit is for browsers who
 * already know the protocol and need the rehab app.
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

  const competencyLead =
    context === 'module-8'
      ? 'You finished the online modules — add the catered practical day when you are ready.'
      : context === 'scat-complete' || context === 'scat-mid'
        ? 'SCAT mastery is step one. Full concussion competency is the next clinical step — not a separate product pitch.'
        : 'After free SCAT value: learn full clinical competency, or apply the protocol in clinic with SST.'

  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm ${className}`}
      aria-labelledby="scat-funnel-exits"
    >
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b9aa6]">
        SCAT mastery → next step
      </p>
      <h2
        id="scat-funnel-exits"
        className="mt-2 text-xl font-bold tracking-tight text-slate-900 md:text-2xl"
      >
        Two paths from here
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
        {competencyLead}
      </p>

      {/* ── Exit 1: competency (course) ── */}
      <div className="mt-6 rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/80 to-white p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-100 border border-teal-200">
            <GraduationCap className="h-5 w-5 text-[#0d7377]" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900">
              Learn full clinical competency
            </h3>
            <p className="mt-1 text-[13px] leading-snug text-slate-600">
              Concussion Clinical Mastery — VOMS, BESS, phenotypes, return-to-play.
              {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD online · up to {CONFIG.COURSE.TOTAL_CPD_POINTS} with the catered day.
              {showPromo && (
                <> Completers: code <strong>{promo}</strong> · A${discount} off Online.</>
              )}
            </p>
          </div>
        </div>

        {!alreadyCommitted ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link
              href={pricingHref}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-teal-300"
            >
              <span className="text-[11px] font-bold uppercase tracking-wide text-teal-700">Online</span>
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

            <div className="sm:col-span-1">
              <SecureSeatCheckout
                variant="button"
                source={`scat_funnel_${context}`}
                className="h-full [&_button]:h-auto [&_button]:min-h-[3rem]"
              />
            </div>

            <Link
              href={`${pricingHref}#pricing-cards`}
              className="flex flex-col rounded-xl border-2 border-teal-300 bg-white p-3.5 transition-colors hover:border-teal-400"
            >
              <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Complete</span>
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
            <Link href="/learning" className="font-semibold text-[#0d7377] underline underline-offset-2">
              your courses
            </Link>
            .
          </p>
        )}
      </div>

      {/* ── Exit 2: SST apply protocol (pricing-separate) ── */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-200/80 border border-slate-300/60">
              <Activity className="h-5 w-5 text-slate-700" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900">
                Apply the protocol in clinic
              </h3>
              <p className="mt-1 text-[13px] leading-snug text-slate-600">
                Already competent and need the rehab app? SST Clinical Testing —
                measured sub-symptom exercise on the patient&apos;s watch. Standalone
                from A${SST_TIER_FROM_AUD}/mo (separate from course pricing).
              </p>
            </div>
          </div>
          <Link
            href="/clinical-suite"
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-100 transition-colors"
          >
            See SST Clinical Testing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
