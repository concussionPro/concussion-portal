import Link from 'next/link'
import { ArrowRight, Activity, BookOpen } from 'lucide-react'
import { CONFIG } from '@/lib/config'

/**
 * "After the assessment" — the next step from the FREE clinical tools.
 *
 * WHY THIS EXISTS (owner directive 2026-07-26: "high intent traffic only, no
 * more free scat form downloaders"):
 *
 * The free SCAT surfaces carry real traffic — /scat-mastery 667, /scat-forms
 * 163, /scat6-download 124 views per 90 days — and /scat-forms had NO
 * commercial link at all, while /scat6-download pushed into the free course.
 * That free course converts 0 of 46 signups to paid: 17 people finished it,
 * earned the certificate and the $50 code, and none bought. Harvesting more
 * emails there produces more of the same.
 *
 * So this is deliberately NOT another email capture. Someone on these pages is
 * administering a SCAT6 *right now* — their intent is clinical, not
 * educational, and the honest next question is "you have a score; now what?".
 * It routes to the free-to-read TRIAL (no signup, real module content — the
 * genuine qualification step) and to the course, and names the two things the
 * assessment itself cannot tell them.
 *
 * Claims here must stay inside what CEA actually sells — see the module list on
 * /preview and the SST evidence page. No new offerings.
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
        ready to return to contact. Those are the decisions that carry the medico-legal weight,
        and in the published surveys they&rsquo;re the ones clinicians report least confidence in.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          href="/preview"
          className="group flex flex-col rounded-xl border border-slate-200 p-4 transition-colors hover:border-[#5b9aa6]/50 hover:bg-[#5b9aa6]/[0.03]"
        >
          <span className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-900">
            <BookOpen className="h-4 w-4 text-[#5b9aa6]" strokeWidth={2} />
            Read the course, free
          </span>
          <span className="mt-1 text-[12.5px] leading-snug text-slate-600">
            The opening of every module — no signup, no email. Phenotypes, VOMS, BESS,
            return-to-play reasoning.
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#5b9aa6]">
            Open the preview <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          href="/clinical-suite"
          className="group flex flex-col rounded-xl border border-slate-200 p-4 transition-colors hover:border-[#5b9aa6]/50 hover:bg-[#5b9aa6]/[0.03]"
        >
          <span className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-900">
            <Activity className="h-4 w-4 text-[#5b9aa6]" strokeWidth={2} />
            Measure the threshold, don&rsquo;t estimate it
          </span>
          <span className="mt-1 text-[12.5px] leading-snug text-slate-600">
            The SST Trainer measures the heart-rate threshold the exercise dose is built on, and
            returns every home session to you.
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#5b9aa6]">
            See the clinical tools <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      <p className="mt-4 text-[12px] text-slate-500">
        {CONFIG.COURSE.TOTAL_MODULES} modules · {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours online
        (up to {CONFIG.COURSE.TOTAL_CPD_POINTS} with the practical day) · endorsed by Osteopathy
        Australia.{' '}
        <Link href="/pricing" className="font-semibold text-[#5b9aa6] underline underline-offset-2">
          Pricing
        </Link>
      </p>
    </section>
  )
}
