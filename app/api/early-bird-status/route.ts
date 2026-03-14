/**
 * Early Bird Status API
 *
 * Returns whether early bird pricing is active for a given location.
 * - Collecting cities: always early bird
 * - Confirmed cities: ends when EITHER condition is met:
 *     1. 7 days before the course date
 *     2. 50% of seats are sold (6 out of 12)
 */

import { NextRequest, NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'
import { getEnrollmentCount } from '@/lib/users'

export async function GET(request: NextRequest) {
  const location = request.nextUrl.searchParams.get('location')

  // Find location config
  const locationConfig = Object.values(CONFIG.LOCATIONS).find(
    loc => loc.slug === location
  )

  // Collecting or unknown location → always early bird
  if (!locationConfig || locationConfig.status === 'collecting') {
    return NextResponse.json({
      isActive: true,
      reason: 'collecting_phase',
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
      isActive: true,
      reason: 'no_date_set',
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

  const isActive = !pastDateDeadline && !seatThresholdReached
  const spotsRemaining = CONFIG.WORKSHOP.CAPACITY_PER_COURSE - enrollmentCount

  let reason: string
  if (seatThresholdReached) {
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
