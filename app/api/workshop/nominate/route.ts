import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { findUserById } from '@/lib/users'
import { VALID_LOCATIONS } from '@/lib/stripe'
import { sql } from '@/lib/db'

/**
 * POST /api/workshop/nominate
 *
 * Body: { location: <VALID_LOCATIONS slug> }
 *
 * - full-course users: sets users.workshop_location — the PAID nomination
 *   that counts toward CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD.
 * - online-only users (2026-07-02): records a NO-CHARGE city nomination in
 *   workshop_interest (source 'dashboard_nomination') — a demand signal that
 *   gets them first notice when the city's date launches. Costs nothing; the
 *   paid upgrade (early-bird difference at /upgrade) stays a separate,
 *   optional step.
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

    if (user.accessLevel !== 'full-course' && user.accessLevel !== 'online-only') {
      return NextResponse.json({ error: 'Workshop nomination is available to enrolled users only' }, { status: 403 })
    }

    const body = await request.json()
    const { location } = body

    if (!location || !VALID_LOCATIONS.includes(location)) {
      return NextResponse.json(
        { error: `Invalid location. Must be one of: ${VALID_LOCATIONS.join(', ')}.` },
        { status: 400 }
      )
    }

    if (user.accessLevel === 'online-only') {
      // No-charge nomination: interest row only — never touches
      // workshop_location (that column is the PAID seat count).
      const cleanEmail = user.email.toLowerCase()
      const cleanName = (user.name || cleanEmail.split('@')[0]).slice(0, 100)
      await sql`
        INSERT INTO workshop_interest (email, name, city, source)
        VALUES (${cleanEmail}, ${cleanName}, ${location}, 'dashboard_nomination')
        ON CONFLICT (email, city) DO NOTHING
      `
      return NextResponse.json({ success: true, type: 'interest', city: location })
    }

    await sql`UPDATE users SET workshop_location = ${location} WHERE id = ${user.id}`

    return NextResponse.json({ success: true, type: 'paid-nomination', workshopLocation: location })
  } catch (error) {
    console.error('Workshop nomination error:', error)
    return NextResponse.json({ error: 'Failed to save nomination' }, { status: 500 })
  }
}
