'use client'

import { useState, useEffect } from 'react'
import { CONFIG, Location } from '@/lib/config'
import { AlertCircle } from 'lucide-react'

interface SpotsRemainingProps {
  location: Location
  className?: string
}

export default function SpotsRemaining({ location, className = '' }: SpotsRemainingProps) {
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null)

  useEffect(() => {
    const locationData = CONFIG.LOCATIONS[location]
    if (!locationData || locationData.status !== 'confirmed') return

    // Fetch live enrollment count for confirmed cities.
    // NO FALLBACK: a stated seat count must be a REAL one. This used to fall
    // back to CAPACITY_PER_COURSE on any failure, so a 500 (or an HTML error
    // page that blew up `.json()`) rendered "12 spots remaining" — a number
    // nothing had measured, on the page where the buyer decides. Non-2xx and
    // network throws now both leave the counter unrendered.
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

  const isLowSpots = spotsLeft <= 5

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {isLowSpots && (
        <AlertCircle className="w-4 h-4 text-orange-600 animate-pulse" aria-hidden="true" />
      )}
      <span className={`text-sm font-bold ${isLowSpots ? 'text-orange-600' : 'text-slate-700'}`}>
        {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} remaining
      </span>
    </div>
  )
}
