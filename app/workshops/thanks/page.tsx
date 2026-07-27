import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: 'You’re counted — Concussion Education Australia',
  robots: { index: false, follow: false },
}

const CITY_LABELS: Record<string, string> = {
  melbourne: 'Melbourne',
  'byron-bay': 'Byron Bay',
  sydney: 'Sydney',
  none: 'none of the listed dates',
}

/**
 * Landing page for the one-click date vote. The micro-commitment just
 * happened — this page's job is the next step: lock the early-bird seat.
 * Dates/prices derive from CONFIG (never hardcoded — date-bearing copy rule).
 */
export default async function VoteThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>
}) {
  const { city = '' } = await searchParams
  const label = CITY_LABELS[city] || 'your city'
  const isNone = city === 'none'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-teal-600" strokeWidth={2} />
        </div>
        {isNone ? (
          <>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Noted — we&rsquo;ll keep you posted.</h1>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              You&rsquo;re on the list for future dates and cities. The online course is available
              any time — 8 CPD hours, self-paced, with the practical day addable later at the
              difference in price.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-900 mb-2">You&rsquo;re counted for {label}.</h1>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Thanks — this helps us lock numbers. A vote isn&rsquo;t a seat: enrolment secures your
              place at the early-bird ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} (it moves to
              ${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()} in the final fortnight before each date),
              and the online modules start today.
            </p>
          </>
        )}
        <Link
          href="/pricing?utm_source=vote-thanks&utm_medium=web&utm_campaign=nov-dates-2026"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          {isNone ? 'See the online course' : 'Secure your seat — early-bird'}
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="mt-5 text-xs text-slate-400">
          Questions? Just reply to the email this came from.
        </p>
      </div>
    </div>
  )
}
