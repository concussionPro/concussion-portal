'use client'

import Link from 'next/link'
import { Calendar, MapPin, ArrowRight, Utensils } from 'lucide-react'
import { CONFIG } from '@/lib/config'

/**
 * Reusable Melbourne workshop promo.
 * Only renders when MELBOURNE.status is 'confirmed'. Two visual variants:
 *   - "card" (default): full glass card — use on completion screens and standalone
 *   - "banner": slim pill — use in hero areas / signup flows
 */
export function MelbourneWorkshopCallout({
  variant = 'card',
  source = 'unknown',
}: {
  variant?: 'card' | 'banner'
  source?: string
}) {
  const mel = CONFIG.LOCATIONS.MELBOURNE
  if (mel.status !== 'confirmed') return null

  const earlyBirdActive = new Date() < new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T23:59:59')
  const href = `/courses/melbourne?utm_source=portal&utm_medium=internal&utm_campaign=melbourne_workshop&utm_content=${encodeURIComponent(source)}`

  if (variant === 'banner') {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm hover:bg-orange-100 transition-colors"
      >
        <span className="inline-flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" aria-hidden="true" />
        <span className="font-semibold text-orange-900">Melbourne workshop — {mel.date}</span>
        <span className="text-orange-800 hidden sm:inline">Rydges CBD · catering included</span>
        <ArrowRight className="w-4 h-4 text-orange-700" aria-hidden="true" />
      </Link>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-wide text-orange-800">
          Next workshop confirmed
        </span>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">
        Melbourne · Saturday 13 June 2026
      </h3>
      <p className="text-sm text-slate-700 mb-4">
        Hands-on full day at <strong>Rydges Melbourne</strong> on Exhibition St. {CONFIG.COURSE.TOTAL_CPD_POINTS} AHPRA CPD points — one certificate covering SCAT6, SCOAT6, VOMS, mBESS, return-to-play and rehabilitation by phenotype. Lifetime online access included.
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-700 mb-5">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-orange-600" aria-hidden="true" />
          8am–4pm
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-orange-600" aria-hidden="true" />
          Melbourne CBD
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Utensils className="w-4 h-4 text-orange-600" aria-hidden="true" />
          Catering included
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href={href}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors"
        >
          See Melbourne workshop
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
        {earlyBirdActive && (
          <span className="inline-flex items-center text-xs font-semibold text-orange-900 bg-orange-100 px-3 py-2 rounded-lg">
            Early bird ${CONFIG.COURSE.PRICE_EARLY_BIRD} — ends {new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })}
          </span>
        )}
      </div>
    </div>
  )
}
