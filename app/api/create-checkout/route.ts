import { NextRequest, NextResponse } from 'next/server'
import { createCourseCheckoutSession, VALID_LOCATIONS } from '@/lib/stripe'

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
    const { courseType, location, email } = body

    // Validate course type
    if (!courseType || !['online-only', 'full-course'].includes(courseType)) {
      return NextResponse.json(
        { error: 'Invalid course type. Must be "online-only" or "full-course".' },
        { status: 400 }
      )
    }

    // Validate location for full-course
    if (courseType === 'full-course') {
      if (!location || !VALID_LOCATIONS.includes(location)) {
        return NextResponse.json(
          { error: 'Location is required for full course. Must be "sydney", "melbourne", or "byron-bay".' },
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

    // Get base URL
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

    // Create Stripe Checkout Session
    const session = await createCourseCheckoutSession({
      courseType,
      location: courseType === 'full-course' ? location : undefined,
      customerEmail: email,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/pricing?canceled=true`,
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
