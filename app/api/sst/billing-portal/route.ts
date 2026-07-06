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
  if (!clinic) return NextResponse.json({ error: 'No clinic found.' }, { status: 400 })
  const customerId = await getSstClinicStripeCustomer(clinic.code)
  if (!customerId) return NextResponse.json({ error: 'No active subscription to manage.' }, { status: 400 })
  try {
    const portal = await createPortalSession({ customerId, returnUrl: `${req.nextUrl.origin}/clinical-testing` })
    return NextResponse.json({ url: portal.url })
  } catch (err) {
    console.error('[sst-billing-portal] failed:', err)
    return NextResponse.json({ error: 'Could not open billing portal.' }, { status: 500 })
  }
}
