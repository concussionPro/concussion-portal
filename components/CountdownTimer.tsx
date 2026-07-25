'use client'

import { useState, useEffect } from 'react'
import { useMounted } from '@/hooks/useMounted'
import { CONFIG } from '@/lib/config'
import { Clock } from 'lucide-react'

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * CountdownTimer — counts down to the moment the $1,190 early-bird rate closes
 * for a LIVE scheduled round (EARLY_BIRD_DAYS_BEFORE days before the workshop
 * date). Nomination model: with no confirmed future-dated round there is no
 * deadline — early bird simply holds — so the timer renders nothing (no false
 * urgency). Pass `locationSlug` to scope to one city; otherwise the soonest
 * live round's close is used.
 */
export default function CountdownTimer({ className = '', locationSlug }: { className?: string; locationSlug?: string }) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const mounted = useMounted()

  useEffect(() => {

    // Early-bird close = confirmed future date − EARLY_BIRD_DAYS_BEFORE.
    const candidates = Object.values(CONFIG.LOCATIONS).filter(
      (loc) =>
        loc.status === 'confirmed' &&
        loc.dateObj &&
        loc.dateObj.getTime() > Date.now() &&
        (!locationSlug || loc.slug === locationSlug)
    )
    if (candidates.length === 0) return
    const soonest = candidates.reduce((a, b) =>
      (a.dateObj!.getTime() < b.dateObj!.getTime() ? a : b)
    )
    const deadline =
      soonest.dateObj!.getTime() -
      CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE * 24 * 60 * 60 * 1000

    const calculateTimeRemaining = (): TimeRemaining | null => {
      const now = new Date().getTime()
      const difference = deadline - now

      if (difference <= 0) {
        return null
      }

      // Safety net: a deadline more than 60 days out means the config is
      // pointing at a placeholder/far-future date — a 26,000-day countdown
      // is false urgency, not marketing. Render nothing.
      if (difference > 60 * 24 * 60 * 60 * 1000) {
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
  }, [locationSlug])

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
