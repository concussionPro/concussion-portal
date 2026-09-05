import Link from 'next/link'
import { ArrowRight, Activity, GraduationCap } from 'lucide-react'
import { CONFIG, SST_TIER_FROM_AUD } from '@/lib/config'

/**
 * "After the assessment" — dual exit for free SCAT tool traffic (owner 2026-09-05).
 *
 * 1) Learn full clinical competency → /pricing (Online / Secure your seat / Complete)
 * 2) Apply protocol in clinic → /clinical-suite (SST standalone)
 *
 * Course and SST stay on separate surfaces — do not merge prices into one CTA.
 */
export function AfterTheAssessment({ className = '' }: { className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 ${className}`}
      aria-labelledby="after-the-assessment"
    >
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b9aa6]">
        After the assessment
      </p>
      <h2
        id="after-the-assessment"
        className="mt-2 text-xl font-bold leading-snug tracking-tight text-slate-900 sm:text-2xl"
      >
        You have a score. The SCAT6 doesn&rsquo;t tell you what to do next.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
        It confirms a suspected concussion and flags red flags — it does not tell you which
        phenotype you&rsquo;re looking at, what the exercise dose should be, or when this person is
        ready to return to contact. Those are the decisions that carry the medico-legal weight.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          href="/pricing"
          className="group flex flex-col rounded-xl border border-teal-200 bg-teal-50/40 p-4 transition-colors hover:border-teal-400 hover:bg-teal-50/70"
        >
          <span className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-900">
            <GraduationCap className="h-4 w-4 text-[#5b9aa6]" strokeWidth={2} />
            Learn full clinical competency
          </span>
          <span className="mt-1 text-[12.5px] leading-snug text-slate-600">
            Online · Secure your seat (A${CONFIG.COURSE.PRICE_SECURE_SEAT} refundable) · Complete
            (date TBD). SCAT mastery → full concussion competency.
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#5b9aa6]">
            See Online / Secure seat / Complete{' '}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          href="/clinical-suite"
          className="group flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition-colors hover:border-slate-400 hover:bg-slate-100/80"
        >
          <span className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-900">
            <Activity className="h-4 w-4 text-slate-700" strokeWidth={2} />
            Apply the protocol in clinic
          </span>
          <span className="mt-1 text-[12.5px] leading-snug text-slate-600">
            Already know the protocol? SST Clinical Testing measures the heart-rate threshold
            and returns home sessions — standalone from A${SST_TIER_FROM_AUD}/mo.
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-slate-700">
            See SST Clinical Testing{' '}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      <p className="mt-4 text-[12px] text-slate-500">
        Course pricing on{' '}
        <Link href="/pricing" className="font-semibold text-[#5b9aa6] underline underline-offset-2">
          /pricing
        </Link>
        ; SST standalone on{' '}
        <Link href="/clinical-suite" className="font-semibold text-[#5b9aa6] underline underline-offset-2">
          /clinical-suite
        </Link>
        . CCM / CRM enrolment may include year-1 SST separately.
      </p>
    </section>
  )
}
