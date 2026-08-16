/**
 * GET /api/city-progress — public, no auth.
 *
 * Aggregate counts only (no PII) for each non-completed CONFIG.LOCATIONS
 * city, powering truthful momentum lines on the buy surfaces (pricing tile,
 * homepage city cards). Numbers are REAL: enrolled = round-scoped paid
 * full-course nominations (getEnrollmentCount), interested = workshop_interest
 * rows. Display logic (e.g. "only show when genuinely motivating") lives in
 * the consuming UI — this endpoint just reports the truth.
 *
 * Cached: revalidate = 300 so the pricing page never makes this a hot DB path.
 * Errors NEVER break the pricing page — any failure returns { cities: [] }
 * with 200.
 */
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { getEnrollmentCount } from '@/lib/users'

export const revalidate = 300

export interface CityProgress {
  slug: string
  label: string
  enrolled: number
  threshold: number
  interested: number
  hasLiveDate: boolean
  date: string | null
}

export async function GET() {
  try {
    // 'completed' cities used to be dropped, but a completed city collecting
    // its NEXT round still sells round-scoped seats (ROUND_START) — Melbourne's
    // pre-release landing reads its seat count from here, and exclusion left
    // that counter blind (found in the 2026-08-16 pre-fire sweep). Round
    // scoping in getEnrollmentCount makes the count correct for every status.
    const locations = Object.values(CONFIG.LOCATIONS)

    // One grouped query for interest counts (public aggregate only)
    const { rows: interestRows } = await sql<{ city: string; count: number }>`
      SELECT city, COUNT(*)::int AS count
      FROM workshop_interest
      WHERE COALESCE(source, '') NOT LIKE '%suspect%'
      GROUP BY city
    `
    const interestedByCity = new Map(interestRows.map((r) => [r.city, Number(r.count)]))

    const cities: CityProgress[] = await Promise.all(
      locations.map(async (loc) => {
        let enrolled = 0
        try {
          enrolled = await getEnrollmentCount(loc.slug)
        } catch {
          // enrolled stays 0 — UI only ever shows counts that are proven real
        }
        const hasLiveDate =
          loc.status === 'confirmed' && !!loc.dateObj && loc.dateObj.getTime() > Date.now()
        return {
          slug: loc.slug,
          label: loc.city,
          enrolled,
          threshold: CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD,
          interested: interestedByCity.get(loc.slug) ?? 0,
          hasLiveDate,
          date: loc.date || null,
        }
      })
    )

    return NextResponse.json({ cities })
  } catch (err) {
    console.error('[city-progress] failed (returning empty set):', err)
    return NextResponse.json({ cities: [] })
  }
}
