import Link from 'next/link'
import { ArrowRight, Activity, GraduationCap } from 'lucide-react'
import { CONFIG, SST_TIER_FROM_AUD } from '@/lib/config'

/**
 * "After the assessment" — equal-weight dual exit for free SCAT tool traffic.
 *
 * 1) Learn full clinical competency → /pricing (Online front door / Unlock seat / Complete)
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
          className="group flex flex-col rounded-xl border-2 border-teal-300/80 bg-gradient-to-br from-teal-50/90 to-white p-4 transition-colors hover:border-teal-400"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700">
            Path 1 · Training
          </p>
          <span className="mt-0.5 inline-flex items-center gap-2 text-[13px] font-bold text-slate-900">
            <GraduationCap className="h-4 w-4 text-[#0d7377]" strokeWidth={2} />
            Learn full clinical competency
          </span>
          <span className="mt-1 text-[12.5px] leading-snug text-slate-600">
            Enrol Online first (front door). Then unlock your seat (A$
            {CONFIG.COURSE.PRICE_SECURE_SEAT}) toward the {CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD}
            -seat gate — or Complete. Date opens when demand is met.
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#0d7377]">
            Enrol Online / Unlock seat{' '}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          href="/clinical-suite"
          className="group flex flex-col rounded-xl border-2 border-cyan-300/80 bg-gradient-to-br from-cyan-50/90 to-white p-4 transition-colors hover:border-cyan-400"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-800">
            Path 2 · Clinic tools
          </p>
          <span className="mt-0.5 inline-flex items-center gap-2 text-[13px] font-bold text-slate-900">
            <Activity className="h-4 w-4 text-cyan-800" strokeWidth={2} />
            Apply your protocol with SST
          </span>
          <span className="mt-1 text-[12.5px] leading-snug text-slate-600">
            SST Clinical Testing measures the heart-rate threshold and returns home sessions —
            standalone from A${SST_TIER_FROM_AUD}/mo. Equal next step; separate from course fees.
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-cyan-900">
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
        . Separate products — do not combine into one fee.
      </p>
    </section>
  )
}
