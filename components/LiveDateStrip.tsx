'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CONFIG, isEarlyBirdForLocation, workshopPriceFor } from '@/lib/config'
import { trackEvent } from '@/lib/analytics'

/**
 * LIVE-DATE STRIP (2026-09-20).
 *
 * WHY. With Melbourne confirmed for 7 November and seats on sale, the date was
 * invisible where Australian clinicians actually arrive: absent from
 * /scat-forms, /scat-mastery and /scat6-download (the top AU entry pages), and
 * on /pricing it first appeared at y=2466 — three screens down. /melbourne-nov7
 * took 1–2 sessions a week. Nobody was being told there is a date to buy.
 *
 * WHAT. One slim line naming the confirmed city, date and current price,
 * linking to that date's page. It sits in the gap every page already reserves
 * under the fixed nav (content starts at pt-[120px], the nav ends ~62px), so it
 * adds no height and causes no layout shift — a lead-capture page keeps its one
 * job, and /pricing keeps its price above the fold.
 *
 * RULES.
 *  - Everything derives from CONFIG.LOCATIONS (date-bearing-copy rule). It
 *    renders only while a city is 'confirmed' with a FUTURE date, and goes away
 *    by itself the day the workshop runs. Nothing here is a literal date.
 *  - Price is workshopPriceFor() — the same function Stripe charges with — and
 *    the early-bird close is date − EARLY_BIRD_DAYS_BEFORE, shown only while
 *    early-bird is actually open.
 *  - Capacity is stated ("12 places"), never seats sold or remaining.
 *  - Overseas visitors never see it: the practical day is not sold to them
 *    (/api/geo, the same signal SiteNav uses; unknown geo is treated as home).
 */

// The dated landing page for a confirmed round, where one exists. Any other
// confirmed city falls back to its /courses/<slug> page.
const DATE_PAGE: Record<string, string> = { melbourne: '/melbourne-nov7' }

function liveCity(now: number) {
  return Object.values(CONFIG.LOCATIONS)
    .filter((l) => l.status === 'confirmed' && !!l.dateObj && l.dateObj.getTime() > now)
    .sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime())[0]
}

const shortDate = (d: Date) =>
  new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Australia/Melbourne' }).format(d).replace(',', '')
const dayMonth = (d: Date) =>
  new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', timeZone: 'Australia/Melbourne' }).format(d).replace(',', '')

export function LiveDateStrip({ source }: { source: string }) {
  // Resolved after mount: the date maths uses the clock and the geo check is a
  // fetch, so rendering on the server would risk a hydration mismatch.
  const [show, setShow] = useState(false)
  useEffect(() => {
    let cancelled = false
    fetch('/api/geo')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setShow(!d?.routedAsInternational) })
      .catch(() => { if (!cancelled) setShow(true) })
    return () => { cancelled = true }
  }, [])

  if (!show) return null
  const loc = liveCity(Date.now())
  if (!loc || !loc.dateObj) return null

  const earlyBird = isEarlyBirdForLocation(loc.slug)
  const price = workshopPriceFor(loc.slug)
  const closes = new Date(loc.dateObj.getTime() - CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE * 24 * 60 * 60 * 1000)
  const href = DATE_PAGE[loc.slug] ?? `/courses/${loc.slug}`

  return (
    <div className="absolute top-[68px] inset-x-0 z-20 flex justify-center px-3 pointer-events-none">
      <Link
        href={href}
        onClick={() => trackEvent('live_date_strip_click', { source, city: loc.slug })}
        className="pointer-events-auto inline-flex items-center gap-2 max-w-full rounded-full border border-emerald-200 bg-white/95 px-3.5 py-1.5 text-[12px] sm:text-[13px] leading-tight text-slate-700 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"
      >
        <span className="flex-none w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
        <span className="truncate">
          <strong className="font-bold text-slate-900">
            {loc.city}<span className="hidden sm:inline"> practical day</span> · {shortDate(loc.dateObj)}
          </strong>
          <span className="hidden sm:inline"> · {CONFIG.WORKSHOP.CAPACITY_PER_COURSE} places</span>
          {' · '}
          {earlyBird ? `early-bird A$${price.toLocaleString('en-AU')} to ${dayMonth(closes)}` : `A$${price.toLocaleString('en-AU')}`}
        </span>
        <ArrowRight className="flex-none w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
      </Link>
    </div>
  )
}
