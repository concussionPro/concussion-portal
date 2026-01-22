'use client'

import { CONFIG, Location } from '@/lib/config'
import { AlertCircle } from 'lucide-react'

interface SpotsRemainingProps {
  location: Location
  className?: string
}

export default function SpotsRemaining({ location, className = '' }: SpotsRemainingProps) {
  if (!CONFIG.FEATURES.SHOW_SPOTS_REMAINING) {
    return null
  }

  const locationData = CONFIG.LOCATIONS[location]
  const spotsLeft = locationData.spotsRemaining
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
