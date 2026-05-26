import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { createCourseCheckoutSession, type CourseType } from '@/lib/stripe'
import { findUserByEmail } from '@/lib/users'

/**
 * GET /pay/[code]
 *
 * Just-in-time short link for admin-generated upgrade checkouts.
 *
 * Stripe checkout sessions cap at expires_at = 24h max. To make
 * admin-emailed links effectively permanent, we DON'T pre-create the
 * Stripe session — we store only the intent (email + location). When
 * the recipient clicks, we create a fresh session and 302 to it. Each
 * click gets its own 24h window; from the recipient's perspective the
 * short link never expires.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  if (!code || !/^[A-Za-z0-9_-]{4,32}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }
  try {
    const { rows } = await sql<{ email: string; location: string | null; course_type: string | null }>`
      SELECT email, location, course_type FROM pay_links WHERE code = ${code} LIMIT 1
    `
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }
    const { email, location, course_type } = rows[0]
    const courseType = (course_type ?? 'workshop-upgrade') as CourseType

    // Validate the user is still in a state where this upgrade makes sense.
    const user = await findUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: 'Recipient account no longer exists.' }, { status: 410 })
    }
    if (courseType === 'workshop-upgrade' && user.accessLevel !== 'online-only') {
      // Already upgraded — send them to the dashboard rather than charging again.
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
      return NextResponse.redirect(`${baseUrl}/dashboard`, 302)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const session = await createCourseCheckoutSession({
      courseType,
      location: location ?? undefined,
      customerEmail: user.email,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/upgrade?canceled=true`,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 500 })
    }
    return NextResponse.redirect(session.url, 302)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Lookup failed' }, { status: 500 })
  }
}
