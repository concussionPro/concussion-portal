import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

/**
 * Quiet inline pointer for clinicians who land on the prospect dashboard
 * and want to enrol individually instead of being part of the team deal.
 * No form, no friction — straight to /pricing.
 */
export function IndividualInterestCard() {
  return (
    <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-accent/15 bg-white px-5 py-4">
      <p className="text-[13px] text-foreground/80 leading-snug">
        Want to enrol just yourself? <span className="text-muted-foreground">Online-only access from $497 · lifetime access · 14 CPD hours.</span>
      </p>
      <Link
        data-track-cta="individual-pricing"
        href="/pricing"
        className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-dark whitespace-nowrap"
      >
        See pricing
        <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
