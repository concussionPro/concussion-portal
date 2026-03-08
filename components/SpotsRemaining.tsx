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

    // Fetch live enrollment count
    fetch(`/api/early-bird-status?location=${locationData.slug}`)
      .then(res => res.json())
      .then(data => {
        if (typeof data.spotsRemaining === 'number') {
          setSpotsLeft(data.spotsRemaining)
        }
      })
      .catch(() => {
        // Fallback to static config
        setSpotsLeft(locationData.spotsRemaining as number)
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
