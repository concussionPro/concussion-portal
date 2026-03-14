import { NextResponse } from 'next/server'
import { getEnrollmentCount } from '@/lib/users'
import { CONFIG } from '@/lib/config'

/**
 * GET /api/enrollment-counts
 *
 * Returns per-city paid enrollment counts (aggregate only, no PII).
 * Used by PricingOptions to show threshold progress.
 * Cached for 60 seconds.
 */

let cachedCounts: Record<string, number> | null = null
let cacheTimestamp = 0
const CACHE_TTL = 60 * 1000 // 60 seconds

export async function GET() {
  try {
    const now = Date.now()
    if (cachedCounts !== null && now - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json({
        counts: cachedCounts,
        threshold: CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD,
      })
    }

    const locations = Object.values(CONFIG.LOCATIONS)
    const counts: Record<string, number> = {}

    await Promise.all(
      locations.map(async (loc) => {
        counts[loc.slug] = await getEnrollmentCount(loc.slug)
      })
    )

    cachedCounts = counts
    cacheTimestamp = now

    return NextResponse.json({
      counts,
      threshold: CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD,
    })
  } catch (error) {
    console.error('Enrollment counts error:', error)
    return NextResponse.json({
      counts: cachedCounts ?? {},
      threshold: CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD,
    })
  }
}
