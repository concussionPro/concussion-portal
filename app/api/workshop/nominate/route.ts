import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { findUserById } from '@/lib/users'
import { VALID_LOCATIONS } from '@/lib/stripe'
import { sql } from '@/lib/db'

/**
 * POST /api/workshop/nominate
 *
 * Allows full-course users to nominate their preferred workshop city.
 * Body: { location: 'sydney' | 'melbourne' }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const sessionData = verifySessionToken(sessionToken)
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const user = await findUserById(sessionData.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.accessLevel !== 'full-course') {
      return NextResponse.json({ error: 'Workshop nomination is available for Complete Course users only' }, { status: 403 })
    }

    const body = await request.json()
    const { location } = body

    if (!location || !VALID_LOCATIONS.includes(location)) {
      return NextResponse.json(
        { error: 'Invalid location. Must be "sydney" or "melbourne".' },
        { status: 400 }
      )
    }

    await sql`UPDATE users SET workshop_location = ${location} WHERE id = ${user.id}`

    return NextResponse.json({ success: true, workshopLocation: location })
  } catch (error) {
    console.error('Workshop nomination error:', error)
    return NextResponse.json({ error: 'Failed to save nomination' }, { status: 500 })
  }
}
