import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { hasClinicalAccess } from '@/lib/sst-trainer/access'
import { getSstClinicByEmail } from '@/lib/sst-trainer/clinic-registry'
import { createSstSubscriptionCheckoutSession, sstPlanPriceId, type SstPlan } from '@/lib/stripe'
import { CheckoutUnavailableError } from '@/lib/stripe'

/**
 * POST /api/sst/subscribe { plan: 'starter'|'clinic'|'pro' }
 * Starts a Stripe subscription Checkout for the signed-in clinic. On success
 * the webhook flips the clinic to 'active' (lifts the 3-patient trial cap).
 */
// Enterprise is QUOTE ONLY — it has no Stripe price and must never be
// checked out self-serve. Omitting it here is the enforcement.
const PLANS: SstPlan[] = ['starter', 'clinic', 'pro']

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  const session = token ? verifySessionToken(token) : null
  if (!session || !(await hasClinicalAccess({ email: session.email, accessLevel: session.accessLevel }))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const plan = body?.plan as SstPlan
  if (!PLANS.includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }
  if (!sstPlanPriceId(plan)) {
    return NextResponse.json({ error: 'That plan is not available yet.' }, { status: 503 })
  }
  const clinic = await getSstClinicByEmail(session.email.toLowerCase())
  if (!clinic) {
    return NextResponse.json({ error: 'Create your clinic code first.' }, { status: 400 })
  }
  // Billing is OWNER-only — the member fallback resolves seated practitioners
  // to the clinic, but they must not bind subscriptions (2026-08-05 sweep #5).
  if (clinic.email.toLowerCase() !== session.email.toLowerCase()) {
    return NextResponse.json({ error: 'Only the clinic owner can manage billing.' }, { status: 403 })
  }
  // Already subscribed → a second checkout would mint a second Stripe
  // customer + subscription and orphan the first (2026-08-05 sweep #1).
  // Plan changes go through the billing portal instead.
  if (clinic.plan === 'active') {
    return NextResponse.json(
      {
        error: 'already-subscribed',
        message: 'Your clinic already has an active plan. Change or cancel it from Manage billing in your workspace.',
      },
      { status: 409 },
    )
  }
  const origin = req.nextUrl.origin
  try {
    const checkout = await createSstSubscriptionCheckoutSession({
      plan,
      clinicCode: clinic.code,
      customerEmail: session.email,
      successUrl: `${origin}/clinical-testing?subscribed=1`,
      cancelUrl: `${origin}/clinical-testing/subscribe`,
    })
    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    if (err instanceof CheckoutUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 })
    }
    console.error('[sst-subscribe] checkout failed:', err)
    return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 })
  }
}
