/**
 * Early Bird Status API
 *
 * Returns whether early bird pricing is active for a given location.
 * Early bird ends when EITHER condition is met:
 *   1. 7 days before the course date
 *   2. 50% of seats are sold (6 out of 12)
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

  // Default: use the static deadline from config
  if (!locationConfig || locationConfig.status !== 'confirmed' || !locationConfig.dateObj) {
    const now = new Date()
    const isActive = now < CONFIG.EARLY_BIRD_DEADLINE
    const deadline = CONFIG.EARLY_BIRD_DEADLINE.toISOString()
    return NextResponse.json({
      isActive,
      deadline,
      reason: isActive ? 'before_deadline' : 'past_deadline',
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
    enrollmentCount,
    spotsRemaining: Math.max(0, spotsRemaining),
    capacity: CONFIG.WORKSHOP.CAPACITY_PER_COURSE,
    reason,
  })
}
