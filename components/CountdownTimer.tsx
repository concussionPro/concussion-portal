'use client'

import { useState, useEffect } from 'react'
import { CONFIG } from '@/lib/config'
import { Clock } from 'lucide-react'

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * CountdownTimer — shows countdown to the EARLY BIRD DEADLINE (price reverts).
 * Hidden when:
 *   - No confirmed workshops exist (nothing to be early about), OR
 *   - The early-bird deadline has already passed (deadline → null → render null)
 *
 * Previously counted down to the workshop date itself which mislabelled the
 * timer as "Early Bird Ends" when it was really showing "Workshop Starts In".
 */
export default function CountdownTimer({ className = '' }: { className?: string }) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Need at least one confirmed workshop for an "early bird" framing to make sense
    const hasConfirmedWorkshop = Object.values(CONFIG.LOCATIONS).some(
      (loc) => loc.status === 'confirmed' && loc.dateObj
    )
    if (!hasConfirmedWorkshop) return

    // The actual target — the early-bird PRICE deadline (config string yyyy-mm-dd, AEST end-of-day)
    const deadline = new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T23:59:59+10:00').getTime()

    const calculateTimeRemaining = (): TimeRemaining | null => {
      const now = new Date().getTime()
      const difference = deadline - now

      if (difference <= 0) {
        return null
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      }
    }

    setTimeRemaining(calculateTimeRemaining())

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)

      if (!remaining) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!mounted || !timeRemaining || !CONFIG.FEATURES.SHOW_COUNTDOWN) {
    return null
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2 text-orange-600">
        <Clock className="w-4 h-4 animate-pulse" />
        <span className="text-sm font-bold">Early Bird Ends:</span>
      </div>
      <div className="flex items-center gap-2">
        {timeRemaining.days > 0 && (
          <div className="bg-orange-500/10 px-3 py-1 rounded-lg">
            <span className="text-lg font-bold text-orange-600">{timeRemaining.days}</span>
            <span className="text-xs text-orange-600 ml-1">days</span>
          </div>
        )}
        <div className="bg-orange-500/10 px-3 py-1 rounded-lg">
          <span className="text-lg font-bold text-orange-600">{String(timeRemaining.hours).padStart(2, '0')}</span>
          <span className="text-xs text-orange-600 ml-1">hrs</span>
        </div>
        <div className="bg-orange-500/10 px-3 py-1 rounded-lg">
          <span className="text-lg font-bold text-orange-600">{String(timeRemaining.minutes).padStart(2, '0')}</span>
          <span className="text-xs text-orange-600 ml-1">min</span>
        </div>
        <div className="bg-orange-500/10 px-3 py-1 rounded-lg">
          <span className="text-lg font-bold text-orange-600">{String(timeRemaining.seconds).padStart(2, '0')}</span>
          <span className="text-xs text-orange-600 ml-1">sec</span>
        </div>
      </div>
    </div>
  )
}
