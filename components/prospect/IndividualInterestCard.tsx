import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { CONFIG } from '@/lib/config'

/**
 * Quiet inline pointer for clinicians who land on the prospect dashboard
 * and want to enrol individually instead of being part of the team deal.
 * No form, no friction — straight to /pricing (with the ?prospect=
 * attribution param so the engagement engine can credit the signup).
 */
export function IndividualInterestCard({ slug }: { slug?: string }) {
  const href = slug ? `/pricing?prospect=${encodeURIComponent(slug)}` : '/pricing'
  return (
    <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-accent/15 bg-white px-5 py-4">
      <p className="text-[13px] text-foreground/80 leading-snug">
        Want to enrol just yourself? <span className="text-muted-foreground">Online-only access from ${CONFIG.COURSE.PRICE_ONLINE} · lifetime access · {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours online (up to {CONFIG.COURSE.TOTAL_CPD_POINTS} with the in-person day).</span>
      </p>
      <Link
        data-track-cta="individual-pricing"
        href={href}
        className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-dark whitespace-nowrap"
      >
        See pricing
        <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
