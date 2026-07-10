import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { getHubByOwner, getHubUsage, getHubMembers } from '@/lib/course-hub'

/**
 * GET /api/hub/mine — the logged-in user's OWN Hub Pack (if they bought one).
 *
 * Ownership = course_hubs.owner_email matches the session email (that's how
 * the Stripe webhook stores the buyer). Returns { hub: null } for everyone
 * else — the dashboard renders nothing in that case. Members/usage power the
 * owner's seat-visibility card so paid seats stop dying silently.
 */
export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  if (!sessionToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const session = verifySessionToken(sessionToken)
  if (!session) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  try {
    const hub = await getHubByOwner(session.email)
    if (!hub) {
      // Not a hub owner — cheap single indexed SELECT, nothing to render.
      return NextResponse.json({ hub: null })
    }

    const [usage, members] = await Promise.all([
      getHubUsage(hub.code),
      getHubMembers(hub.code),
    ])

    return NextResponse.json({
      hub: {
        code: hub.code,
        clinicName: hub.clinicName,
        clinicianSeats: hub.clinicianSeats,
        adminSeats: hub.adminSeats,
        clinicianUsed: usage?.clinicianUsed ?? 0,
        adminUsed: usage?.adminUsed ?? 0,
        // First name + email only — the owner's team view, no more.
        members: members.map((m) => ({
          firstName: (m.name || m.email.split('@')[0]).split(' ')[0],
          email: m.email,
          role: m.role,
        })),
      },
    })
  } catch (err) {
    console.error('[hub/mine] lookup failed:', err)
    return NextResponse.json({ error: 'Failed to load hub' }, { status: 500 })
  }
}
