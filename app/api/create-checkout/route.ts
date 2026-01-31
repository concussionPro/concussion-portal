import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe'

/**
 * Create Stripe Checkout Session API
 *
 * Called when user clicks "Enroll Now" or "Get Started"
 * Returns Stripe Checkout URL for secure payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { priceId, email } = body

    // Validate price ID
    const validPriceIds = Object.values(STRIPE_PRICES)
    if (!priceId || !validPriceIds.includes(priceId)) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      )
    }

    // Get base URL
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

    // Create Stripe Checkout Session
    const session = await createCheckoutSession({
      priceId,
      customerEmail: email,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        source: 'website',
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
