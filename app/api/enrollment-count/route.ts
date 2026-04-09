import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

/**
 * GET /api/enrollment-count
 *
 * Returns the count of paid users (online-only + full-course).
 * Used for social proof on pricing page.
 * Cached for 5 minutes to avoid excessive reads.
 */

let cachedCount: number | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  try {
    const now = Date.now()
    if (cachedCount !== null && now - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json({ count: cachedCount })
    }

    const { rows } = await sql`
      SELECT COUNT(*) as cnt FROM users
      WHERE access_level IN ('online-only', 'full-course')
    `
    cachedCount = Number(rows[0].cnt)
    cacheTimestamp = now

    return NextResponse.json({ count: cachedCount })
  } catch (error) {
    console.error('Enrollment count error:', error)
    // Return cached count if available, otherwise 0 (don't expose error to client)
    return NextResponse.json({ count: cachedCount ?? 0 })
  }
}
