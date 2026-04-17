import { NextRequest, NextResponse } from 'next/server'
import { createCourseCheckoutSession, VALID_LOCATIONS, VALID_COURSE_TYPES } from '@/lib/stripe'
import type { CourseType } from '@/lib/stripe'
import { verifySessionToken } from '@/lib/jwt-session'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'
import { createCheckoutSchema } from '@/lib/schemas'

/**
 * POST /api/create-checkout
 *
 * Creates a Stripe Checkout session for course purchases.
 *
 * Body params:
 *   courseType: 'online-only' | 'full-course' | 'workshop-upgrade'
 *   location?: 'sydney' | 'melbourne' | 'byron-bay' (required for full-course and workshop-upgrade)
 *   email?: string (optional, pre-fills checkout — ignored for workshop-upgrade, uses session email)
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit({ key: `checkout:${ip}`, limit: 10, windowSec: 60 })
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many checkout attempts. Please wait a minute.' }, { status: 429 })
    }

    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }
    const parsed = createCheckoutSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { courseType, location, email, preferredCity, promoCode, utm } = parsed.data

    // Defense in depth: schema covers enum already, but keep the guard so a schema
    // drift doesn't accidentally open up new course types without a code review.
    if (!VALID_COURSE_TYPES.includes(courseType)) {
      return NextResponse.json(
        { error: 'Invalid course type.' },
        { status: 400 }
      )
    }

    // Workshop upgrade: requires authenticated online-only user + valid location
    let sessionEmail: string | undefined
    if (courseType === 'workshop-upgrade') {
      const sessionCookie = request.cookies.get('session')?.value
      if (!sessionCookie) {
        return NextResponse.json(
          { error: 'You must be logged in to upgrade.' },
          { status: 401 }
        )
      }
      const session = verifySessionToken(sessionCookie)
      if (!session) {
        return NextResponse.json(
          { error: 'Invalid session. Please log in again.' },
          { status: 401 }
        )
      }
      if (session.accessLevel !== 'online-only') {
        return NextResponse.json(
          { error: 'Upgrade is only available for online-only course holders.' },
          { status: 403 }
        )
      }
      if (!location || !VALID_LOCATIONS.includes(location)) {
        return NextResponse.json(
          { error: 'Please select a workshop location.' },
          { status: 400 }
        )
      }
      // Use session email to prevent upgrading a different account
      sessionEmail = session.email
    }

    // Use server-side env var only — origin header is spoofable
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

    // Determine cancel URL based on course type
    let cancelUrl: string
    if (courseType === 'workshop-upgrade') {
      cancelUrl = `${baseUrl}/upgrade?canceled=true`
    } else if (courseType === 'international-online') {
      cancelUrl = `${baseUrl}/pricing-international?canceled=true`
    } else {
      cancelUrl = `${baseUrl}/pricing?canceled=true`
    }

    // Create Stripe Checkout Session
    const checkoutSession = await createCourseCheckoutSession({
      courseType: courseType as CourseType,
      location: (courseType === 'full-course' || courseType === 'workshop-upgrade') ? location : undefined,
      preferredCity: courseType === 'online-only' ? preferredCity : undefined,
      customerEmail: sessionEmail || email,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl,
      promoCode: typeof promoCode === 'string' ? promoCode : undefined,
      utm: utm && typeof utm === 'object' ? utm : undefined,
    })

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    )
  }
}
