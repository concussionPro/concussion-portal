import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { findUserById } from '@/lib/users'
import { userOwnsCrm, userOwnsCrmPractical } from '@/lib/crm-course'
import { holdsPracticalDaySeat } from '@/lib/practical-day-seat'
import { VALID_LOCATIONS } from '@/lib/stripe'
import { sql } from '@/lib/db'

/**
 * POST /api/workshop/nominate
 *
 * Body: { location: <VALID_LOCATIONS slug> }
 *
 * PAID nomination — sets users.workshop_location, which counts toward
 * CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD. Held by anyone with a seat at the
 * SHARED practical day:
 *   - full-course users (CCM), and
 *   - owners of the CRM 'crm-practical' entitlement (Complete / upgrade). Their
 *     access_level stays 'preview' because the streams are isolated, so the old
 *     access_level test 403'd a buyer who had already PAID for the seat.
 *
 * NO-CHARGE nomination — records an interest row (source
 * 'dashboard_nomination'), a demand signal that gets them first notice when the
 * city's date launches. Held by online-course owners of either stream
 * (CCM online-only, CRM 'crm' without the practical day). Costs nothing; the
 * paid upgrade stays a separate, optional step.
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

    // CRM entitlements live in course_purchases, never in access_level.
    const [ownsPractical, ownsCrmOnline] = await Promise.all([
      userOwnsCrmPractical(user.email),
      userOwnsCrm(user.email),
    ])
    // A Clinic Hub Pack seat is 'full-course' but buys ONLINE only — it must
    // fall to the interest row below, not write workshop_location (the PAID
    // seat column that feeds CONFIRMATION_THRESHOLD).
    const holdsPaidSeat = holdsPracticalDaySeat({
      accessLevel: user.accessLevel,
      hubPackSeat: Boolean(user.hubPackSeatAt),
      ownsCrmPractical: ownsPractical,
    })
    const ownsOnlineCourse =
      user.accessLevel === 'online-only' || ownsCrmOnline || Boolean(user.hubPackSeatAt)

    if (!holdsPaidSeat && !ownsOnlineCourse) {
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

    if (!holdsPaidSeat) {
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
