'use client'

import { useState, useEffect } from 'react'
import { CONFIG, Location } from '@/lib/config'
import { AlertCircle } from 'lucide-react'
import { buildSecureSeatUrgency } from '@/lib/secure-seat-urgency'

interface SpotsRemainingProps {
  location: Location
  className?: string
}

/**
 * Confirmed-city seat line — honest counts only, gated by the half-full rule.
 * Owner 2026-09-05: never show n/12 (or "N spots remaining") when the room
 * looks empty. Below half of CAPACITY (6 of 12) use forming copy with no
 * numbers; at ≥6 show progress; at ≥9 use "only X left."
 */
export default function SpotsRemaining({ location, className = '' }: SpotsRemainingProps) {
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null)

  useEffect(() => {
    const locationData = CONFIG.LOCATIONS[location]
    if (!locationData || locationData.status !== 'confirmed') return

    // NO FALLBACK: a stated seat count must be a REAL one. Non-2xx / throws
    // leave the counter unrendered rather than inventing capacity.
    fetch(`/api/early-bird-status?location=${locationData.slug}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && typeof data.spotsRemaining === 'number') {
          setSpotsLeft(data.spotsRemaining)
        }
      })
      .catch(() => {
        // Silent — render nothing rather than a fabricated count.
      })
  }, [location])

  if (!CONFIG.FEATURES.SHOW_SPOTS_REMAINING || spotsLeft === null) {
    return null
  }

  const locationData = CONFIG.LOCATIONS[location]
  const capacity = CONFIG.WORKSHOP.CAPACITY_PER_COURSE
  const enrolled = Math.max(0, capacity - Math.floor(spotsLeft))
  const urgency = buildSecureSeatUrgency({
    cityLabel: locationData?.city || 'this city',
    enrolled,
    threshold: capacity,
    progressKnown: true,
  })

  const halfFull = Math.floor(capacity / 2)
  const highUrgency = enrolled >= capacity - 3 && enrolled < capacity
  const line = urgency.progressLine
  if (!line) return null

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {highUrgency && (
        <AlertCircle className="w-4 h-4 text-orange-600 animate-pulse" aria-hidden="true" />
      )}
      <span
        className={`text-sm font-bold ${
          highUrgency ? 'text-orange-600' : enrolled >= halfFull ? 'text-slate-700' : 'text-slate-600'
        }`}
      >
        {line}
      </span>
    </div>
  )
}
