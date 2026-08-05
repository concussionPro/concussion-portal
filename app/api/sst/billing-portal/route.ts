import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { hasClinicalAccess } from '@/lib/sst-trainer/access'
import { getSstClinicByEmail, getSstClinicStripeCustomer } from '@/lib/sst-trainer/clinic-registry'
import { createPortalSession } from '@/lib/stripe'

/** POST /api/sst/billing-portal — open the Stripe customer portal for the
 *  signed-in clinic to manage or cancel its subscription. */
export async function POST(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  const session = token ? verifySessionToken(token) : null
  if (!session || !(await hasClinicalAccess({ email: session.email, accessLevel: session.accessLevel }))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const clinic = await getSstClinicByEmail(session.email.toLowerCase())
  // `code` is a stable machine-readable reason so the workspace can render
  // truthful copy for each case instead of a dead button (crawl #4).
  if (!clinic) return NextResponse.json({ error: 'No clinic found.', code: 'no-clinic' }, { status: 400 })
  // Owner-only — seated members must not see the owner's payment details or
  // cancel the clinic's subscription (2026-08-05 sweep #5).
  if (clinic.email.toLowerCase() !== session.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'Only the clinic owner can manage billing.', code: 'not-owner' },
      { status: 403 },
    )
  }
  const customerId = await getSstClinicStripeCustomer(clinic.code)
  // No Stripe customer on an active plan = comped access (the alumni cohort);
  // on a trial it simply means nothing has been bought yet.
  if (!customerId) {
    return NextResponse.json(
      { error: 'No active subscription to manage.', code: 'no-customer' },
      { status: 400 },
    )
  }
  try {
    const portal = await createPortalSession({ customerId, returnUrl: `${req.nextUrl.origin}/clinical-testing` })
    return NextResponse.json({ url: portal.url })
  } catch (err) {
    console.error('[sst-billing-portal] failed:', err)
    return NextResponse.json({ error: 'Could not open billing portal.' }, { status: 500 })
  }
}
