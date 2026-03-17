import { NextRequest, NextResponse } from 'next/server'
import { createCourseCheckoutSession, VALID_LOCATIONS, VALID_COURSE_TYPES } from '@/lib/stripe'
import type { CourseType } from '@/lib/stripe'

/**
 * POST /api/create-checkout
 *
 * Creates a Stripe Checkout session for course purchases.
 *
 * Body params:
 *   courseType: 'online-only' | 'full-course'
 *   location?: 'sydney' | 'melbourne' | 'byron-bay' (required for full-course)
 *   email?: string (optional, pre-fills checkout)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseType, location, email, preferredCity } = body

    // Validate course type
    if (!courseType || !VALID_COURSE_TYPES.includes(courseType)) {
      return NextResponse.json(
        { error: 'Invalid course type.' },
        { status: 400 }
      )
    }

    // Validate location for full-course (optional — nominated after completing online modules)
    if (courseType === 'full-course' && location) {
      if (!VALID_LOCATIONS.includes(location)) {
        return NextResponse.json(
          { error: 'Invalid location. Must be "sydney", "melbourne", or "byron-bay".' },
          { status: 400 }
        )
      }
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      )
    }

    // Use server-side env var only — origin header is spoofable
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

    // Create Stripe Checkout Session
    const session = await createCourseCheckoutSession({
      courseType: courseType as CourseType,
      location: courseType === 'full-course' ? location : undefined,
      preferredCity: courseType === 'online-only' ? preferredCity : undefined,
      customerEmail: email,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: courseType === 'international-online'
        ? `${baseUrl}/pricing-international?canceled=true`
        : `${baseUrl}/pricing?canceled=true`,
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    )
  }
}
