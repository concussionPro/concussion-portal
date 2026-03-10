import { NextResponse } from 'next/server'
import { loadUsers } from '@/lib/users'

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

    const users = await loadUsers()
    const paidUsers = users.filter(
      u => u.accessLevel === 'online-only' || u.accessLevel === 'full-course'
    )

    cachedCount = paidUsers.length
    cacheTimestamp = now

    return NextResponse.json({ count: cachedCount })
  } catch (error) {
    console.error('Enrollment count error:', error)
    return NextResponse.json({ count: 0 })
  }
}
