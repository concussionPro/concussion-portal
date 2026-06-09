/**
 * Early Bird Status API
 *
 * Returns whether early bird pricing is active for a given location, plus
 * spotsRemaining for confirmed cities (consumed by <SpotsRemaining /> —
 * seat data must keep flowing even when early bird is over).
 *
 * EARLY BIRD IS OVER (hard deadline 2026-05-31, past) — isActive is false
 * everywhere. The per-location rules below only matter if a future round
 * moves the deadline forward:
 * - Collecting cities: early bird while within the hard deadline
 * - Confirmed cities: also ends when EITHER condition is met:
 *     1. 7 days before the course date
 *     2. 50% of seats are sold (6 out of 12)
 */

import { NextRequest, NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'
import { getEnrollmentCount } from '@/lib/users'

export async function GET(request: NextRequest) {
  const location = request.nextUrl.searchParams.get('location')

  // Hard deadline — applies globally regardless of location. Don't return
  // early for confirmed cities: they still need spotsRemaining below.
  const hardDeadline = new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T23:59:59')
  const pastHardDeadline = new Date() > hardDeadline

  // Find location config
  const locationConfig = Object.values(CONFIG.LOCATIONS).find(
    loc => loc.slug === location
  )

  // Collecting or unknown location → early bird only within the hard deadline
  if (!locationConfig || locationConfig.status === 'collecting') {
    return NextResponse.json({
      isActive: !pastHardDeadline,
      reason: pastHardDeadline ? 'past_hard_deadline' : 'collecting_phase',
    })
  }

  // Completed → no early bird
  if (locationConfig.status === 'completed') {
    return NextResponse.json({
      isActive: false,
      reason: 'completed',
    })
  }

  // Confirmed with date → apply date-proximity + seat-count logic
  if (!locationConfig.dateObj) {
    return NextResponse.json({
      isActive: !pastHardDeadline,
      reason: pastHardDeadline ? 'past_hard_deadline' : 'no_date_set',
    })
  }

  // Check date condition: 7 days before course
  const courseDate = locationConfig.dateObj
  const dateDeadline = new Date(courseDate.getTime() - CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE * 24 * 60 * 60 * 1000)
  dateDeadline.setHours(23, 59, 59, 999)
  const now = new Date()
  const pastDateDeadline = now >= dateDeadline

  // Check seat condition: 50% sold
  const enrollmentCount = await getEnrollmentCount(locationConfig.slug)
  const seatThresholdReached = enrollmentCount >= CONFIG.WORKSHOP.EARLY_BIRD_SEAT_THRESHOLD

  const isActive = !pastHardDeadline && !pastDateDeadline && !seatThresholdReached
  const spotsRemaining = CONFIG.WORKSHOP.CAPACITY_PER_COURSE - enrollmentCount

  let reason: string
  if (pastHardDeadline) {
    reason = 'past_hard_deadline'
  } else if (seatThresholdReached) {
    reason = 'seats_threshold'
  } else if (pastDateDeadline) {
    reason = 'past_deadline'
  } else {
    reason = 'active'
  }

  return NextResponse.json({
    isActive,
    deadline: dateDeadline.toISOString(),
    spotsRemaining: Math.max(0, spotsRemaining),
    reason,
  })
}
