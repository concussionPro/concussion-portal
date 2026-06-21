import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'

/**
 * Returns ONLY the next test number for an exact athlete match
 * (clinicCode + name [+ dob]). This endpoint is unauthenticated, so it
 * deliberately returns the minimum needed to rotate word lists / label the
 * test — never an enumerable list of prior test dates, which would let a
 * caller probe who has been tested at a clinic (APP 11 / re-identification).
 * Rate limited per IP to blunt enumeration of athlete names.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit({ key: `athlete-history:${ip}`, limit: 20, windowSec: 60 })
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { clinicCode, name, dob } = await request.json()

    if (!clinicCode || !name) {
      return NextResponse.json({ testNumber: 1 })
    }

    const normName = String(name).trim().toLowerCase()
    const normCode = String(clinicCode).trim().toUpperCase()

    // Count prior baselines for this exact athlete. Return a count only —
    // no dates, no per-row data — scoped to an exact name (+ dob when given).
    const { rows } = dob
      ? await sql`
          SELECT COUNT(*)::int AS n FROM preseason_baselines
          WHERE clinic_code = ${normCode}
            AND LOWER(TRIM(athlete_name)) = ${normName}
            AND (dob IS NULL OR dob = ${dob})
        `
      : await sql`
          SELECT COUNT(*)::int AS n FROM preseason_baselines
          WHERE clinic_code = ${normCode}
            AND LOWER(TRIM(athlete_name)) = ${normName}
        `

    const priorCount = rows[0]?.n ?? 0
    return NextResponse.json({ testNumber: priorCount + 1 })
  } catch (error) {
    console.error('Athlete history lookup error:', error)
    // Fail safe to test #1 — never leak detail
    return NextResponse.json({ testNumber: 1 })
  }
}
