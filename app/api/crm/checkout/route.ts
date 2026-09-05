import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createCrmCheckoutSession } from '@/lib/stripe'
import { CONFIG } from '@/lib/config'
import { VALID_LOCATIONS } from '@/lib/stripe'
import { userOwnsCrm } from '@/lib/crm-course'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'

/**
 * POST /api/crm/checkout — Concussion Rehab Mastery (EP stream) purchase.
 *
 * HARD-GATED on CONFIG.FEATURES.ESSA_ACCREDITED: while endorsement is pending
 * there is NO live CRM sale (the landing shows interest-capture instead). Flip
 * the flag on real approval and this route goes live with the rest of the copy.
 *
 * City nomination is REQUIRED at online checkout (owner directive) so the buyer
 * feeds the shared CCM/CRM Ready-to-Train demand; the webhook records it and
 * populates analytics.
 */
const schema = z.object({
  tier: z.enum(['online', 'complete', 'upgrade']),
  // Soft-required for online/complete/upgrade (same rescue doctrine as CCM
  // /api/create-checkout): without customer_email, checkout.session.expired
  // has nobody to email. Validated after parse via resolveCheckoutCustomerEmail.
  email: z.string().trim().toLowerCase().email().max(254).optional(),
  location: z.enum(VALID_LOCATIONS).optional(),
  utm: z.record(z.string(), z.string()).optional(),
  attribution: z.record(z.string(), z.string()).optional(),
})

export async function POST(request: NextRequest) {
  // In the barrel until ESSA lands — never mint a live CRM checkout before then.
  if (!CONFIG.FEATURES.ESSA_ACCREDITED) {
    return NextResponse.json(
      { error: 'Concussion Rehab Mastery enrolment opens on ESSA endorsement — register your interest and we’ll notify you.' },
      { status: 403 },
    )
  }


  // Rate limit, same as /api/create-checkout and the international CRM route:
  // this endpoint mints a real Stripe Checkout Session on an unauthenticated
  // POST, so without one a script can spray sessions at the account.
  const rl = await rateLimit({ key: `crm-checkout:${getClientIp(request)}`, limit: 10, windowSec: 60 })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many checkout attempts. Please wait a minute.' }, { status: 429 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const { tier, email, location, utm, attribution } = parsed.data

  // A nominated city is required for the tiers that actually BUY the shared
  // practical day. It is no longer required for pure online.
  //
  // The original directive was to nominate on online purchases too, so EP
  // city-demand was captured from the first sale. Measured 2026-08-06, that
  // demand data cost every sale: 7 enrol clicks on the CRM page in 28 days and
  // ZERO checkout_start — a 100% drop at the pre-checkout form, which asked an
  // online-only buyer to commit to a practical-day city. Nomination now happens
  // after payment (success page + welcome email), so it is captured without
  // standing between a decided buyer and Stripe.
  if (!location && tier !== 'online') {
    return NextResponse.json({ error: 'Please nominate your workshop city.' }, { status: 400 })
  }

  // Soft email gate — stamp customer_email so abandoned-checkout rescue can
  // reach the buyer (same doctrine as CCM create-checkout). Upgrade also uses
  // the address to verify an existing CRM Online purchase.
  let customerEmail: string | undefined = email
  if (isCrmCheckoutEmailRequired(tier)) {
    const resolved = resolveCheckoutCustomerEmail(undefined, email)
    if (!resolved.ok) {
      return NextResponse.json(
        {
          error:
            tier === 'upgrade'
              ? 'Enter the email address you enrolled with so we can find your CRM Online purchase.'
              : resolved.error,
        },
        { status: 400 },
      )
    }
    customerEmail = resolved.email
  }

  if (tier === 'upgrade') {
    if (!(await userOwnsCrm(customerEmail!))) {
      return NextResponse.json(
        { error: 'The practical-day upgrade is for existing CRM Online owners. New to CRM? Choose CRM Complete — it includes the online course and the practical day.' },
        { status: 400 },
      )
    }
  }

  const base = CONFIG.SEO.SITE_URL || 'https://portal.concussion-education-australia.com'
  // The SHARED, Stripe-validated confirmation page — the same one CCM uses.
  // It works with NO session cookie (it validates session_id server-side) and
  // its client mints the login session. Landing a cold buyer on
  // /ep-course/dashboard instead meant the session gate fired before the
  // webhook had run, and they were shown the unauthenticated upgrade screen —
  // i.e. pitched a course to someone who had just paid for it (2026-08-05).
  const successUrl = `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${base}/concussion-rehab-mastery?purchase=cancelled`

  try {
    const session = await createCrmCheckoutSession({ tier, location, customerEmail, successUrl, cancelUrl, utm, attribution })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[crm-checkout] session create failed:', err)
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 })
  }
}
