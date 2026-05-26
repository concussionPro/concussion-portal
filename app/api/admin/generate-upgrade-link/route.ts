import { NextRequest, NextResponse } from 'next/server'
import { createCourseCheckoutSession, type CourseType } from '@/lib/stripe'
import { findUserByEmail } from '@/lib/users'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * POST /api/admin/generate-upgrade-link
 * Body: { email: string, location: 'melbourne' | 'sydney' | 'byron-bay' | 'adelaide' | 'wa' }
 *
 * Generates a single-use Stripe checkout URL for a known online-only
 * user to upgrade to the full course at a specific workshop city.
 * Admin pastes the URL into a personal email — recipient clicks, pays,
 * the Stripe webhook bumps their account to full-course + assigns the
 * workshop location.
 *
 * Bypasses the auth-gated /upgrade flow which would otherwise force
 * the user to log in first.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { email?: string; location?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const email = body.email?.trim().toLowerCase()
  const location = body.location?.trim().toLowerCase()
  if (!email || !location) {
    return NextResponse.json({ error: 'email and location required' }, { status: 400 })
  }

  const user = await findUserByEmail(email)
  if (!user) {
    return NextResponse.json({ error: 'user not found — they need an online-only purchase first' }, { status: 404 })
  }
  if (user.accessLevel !== 'online-only') {
    return NextResponse.json({
      error: `user.accessLevel is '${user.accessLevel}' — upgrade flow only valid for online-only buyers. Fix via /api/admin/update-user-access first if needed.`
    }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

  try {
    const session = await createCourseCheckoutSession({
      courseType: 'workshop-upgrade' as CourseType,
      location,
      customerEmail: user.email,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/upgrade?canceled=true`,
    })
    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      buyer: { email: user.email, name: user.name, accessLevel: user.accessLevel },
      location,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Checkout session creation failed' }, { status: 500 })
  }
}
