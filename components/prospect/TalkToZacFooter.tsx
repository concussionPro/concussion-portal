'use client'

import { ArrowUpRight, Calendar } from 'lucide-react'

/**
 * Sticky bottom CTA shown on every prospect-portal sub-page (toolkit
 * sub-pages, references, learning, module-1). Highest-engagement
 * surface — a prospect reading template 4 of 6 in the outreach kit is
 * 80% sold — but until now those pages had no book-a-call affordance.
 *
 * Stays out of the way (z-30, semi-transparent backdrop blur, margin
 * from bottom on desktop) so it doesn't blanket the actual content.
 */
export function TalkToZacFooter({
  clinicShortName,
  context,
}: {
  clinicShortName: string
  /** Optional context slug used in cal.com UTM so analytics can show
   *  which sub-page drove the booking (clinical-toolkit / outreach-kit
   *  / admin-workflow / learning / etc) */
  context?: string
}) {
  const calUrl =
    `https://cal.com/zac-lewis-so8zjs/30min` +
    `?utm_source=portal&utm_medium=sticky_footer` +
    `&utm_campaign=${encodeURIComponent(context || 'toolkit')}`
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg print:hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-0.5">
            See how it lands for your team
          </p>
          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
            15-min chat about implementing this at {clinicShortName}
          </p>
        </div>
        <a
          href={calUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-track-cta={`sticky-${context || 'toolkit'}`}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-accent text-white text-xs sm:text-sm font-bold hover:bg-accent/90 transition-colors shadow-md"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Talk to Zac</span>
          <span className="sm:hidden">Book</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}
