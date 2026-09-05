import Link from 'next/link'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { CONFIG } from '@/lib/config'

/**
 * Above-the-fold offer route for organic-search landings.
 *
 * Work order (analytics engine, 2026-08-17): 27 organic visitors in 30 days,
 * 0 reached a money page — organic lands on blog guideline posts and the
 * SCAT form tools, and nothing above the fold routed a clinician to the
 * offer. This strip is that route: the free SCAT course as the low-friction
 * step, Online enrolment as the direct money path (not a buried /courses hub).
 *
 * Server-safe (no client JS). Attribution rides ?src= so the analytics
 * search field marks strip-originated sessions without client tracking.
 */
export function OrganicOfferStrip({ src }: { src: string }) {
  return (
    <div className="rounded-xl border border-[rgba(13,115,119,0.25)] bg-[rgba(13,115,119,0.05)] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
      <p className="m-0 flex items-center gap-2 text-[13.5px] font-semibold text-slate-800 flex-1 min-w-0">
        <GraduationCap className="w-4 h-4 flex-none text-[var(--accent,#0d7377)]" strokeWidth={2} />
        Clinician? Free SCAT6 mastery, or enrol Online for full clinical competency.
      </p>
      <span className="flex flex-none flex-wrap items-center gap-2">
        <Link
          href={`/scat-mastery?src=${src}`}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--accent,#0d7377)] text-white text-xs font-bold px-3.5 py-2 hover:opacity-90 transition-opacity"
        >
          Free SCAT6 course
        </Link>
        <Link
          href={`/pricing?src=${src}`}
          className="inline-flex items-center gap-1 rounded-full border border-[rgba(13,115,119,0.4)] text-[var(--accent,#0d7377)] text-xs font-bold px-3.5 py-2 hover:bg-[rgba(13,115,119,0.08)] transition-colors"
        >
          Enrol Online · A${CONFIG.COURSE.PRICE_ONLINE}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </span>
    </div>
  )
}
