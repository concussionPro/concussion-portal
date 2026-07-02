/**
 * Early Bird Status API
 *
 * Returns whether the $1,190 early-bird rate is active for a given location,
 * plus spotsRemaining for cities with a live scheduled round (consumed by
 * <SpotsRemaining /> — seat data must keep flowing regardless of pricing).
 *
 * NOMINATION MODEL (owner decision 2026-07-02): early bird is ALWAYS active
 * for any city with no live scheduled date (collecting / completed awaiting
 * next round). For a confirmed, future-dated round it stays active until
 * EARLY_BIRD_DAYS_BEFORE days out; the final window is standard price.
 * Single source of truth: isEarlyBirdForLocation() in lib/config.ts —
 * lib/stripe.ts charges from the same function.
 */

import { NextRequest, NextResponse } from 'next/server'
import { CONFIG, isEarlyBirdForLocation } from '@/lib/config'
import { getEnrollmentCount } from '@/lib/users'

export async function GET(request: NextRequest) {
  const location = request.nextUrl.searchParams.get('location')

  const locationConfig = Object.values(CONFIG.LOCATIONS).find(
    loc => loc.slug === location
  )

  const isActive = isEarlyBirdForLocation(location)

  const hasLiveDate =
    locationConfig?.status === 'confirmed' &&
    !!locationConfig.dateObj &&
    locationConfig.dateObj.getTime() > Date.now()

  if (!hasLiveDate || !locationConfig?.dateObj) {
    return NextResponse.json({
      isActive,
      reason: 'nomination_phase', // no live scheduled round — early bird holds
    })
  }

  // Live scheduled round: early bird closes EARLY_BIRD_DAYS_BEFORE days out.
  const dateDeadline = new Date(
    locationConfig.dateObj.getTime() -
      CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE * 24 * 60 * 60 * 1000
  )
  const enrollmentCount = await getEnrollmentCount(locationConfig.slug)
  const spotsRemaining = CONFIG.WORKSHOP.CAPACITY_PER_COURSE - enrollmentCount

  return NextResponse.json({
    isActive,
    deadline: dateDeadline.toISOString(),
    spotsRemaining: Math.max(0, spotsRemaining),
    reason: isActive ? 'active' : 'final_window',
  })
}
