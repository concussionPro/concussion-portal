import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import {
  createSstSubscriptionCheckoutSession,
  sstSubscriptionsConfigured,
  CheckoutUnavailableError,
} from '@/lib/stripe'

/**
 * POST /api/sst/subscribe  { plan: 'monthly' | 'annual' }
 *
 * Starts a Stripe Checkout (subscription mode) for the in-dashboard SST app.
 * Requires a logged-in user. Inert until the Stripe price IDs are set in env
 * (sstSubscriptionsConfigured() === false → 503), so it cannot affect anyone
 * pre-launch. App-store users (free, clinic-code) never hit this route.
 */
export async function POST(request: NextRequest) {
  try {
    if (!sstSubscriptionsConfigured()) {
      return NextResponse.json(
        { error: 'SST subscriptions are not available yet.' },
        { status: 503 }
      )
    }

    const sessionToken = request.cookies.get('session')?.value
    const sessionData = sessionToken ? verifySessionToken(sessionToken) : null
    if (!sessionData) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const plan = body?.plan
    if (plan !== 'monthly' && plan !== 'annual') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const origin = request.nextUrl.origin
    const session = await createSstSubscriptionCheckoutSession({
      plan,
      customerEmail: sessionData.email,
      successUrl: `${origin}/sst-trainer?subscribed=1&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/dashboard?sst_cancelled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (error instanceof CheckoutUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('SST subscribe error:', error)
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 })
  }
}
