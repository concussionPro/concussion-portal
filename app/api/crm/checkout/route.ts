import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createCrmCheckoutSession } from '@/lib/stripe'
import { CONFIG } from '@/lib/config'
import { VALID_LOCATIONS } from '@/lib/stripe'

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
  email: z.string().trim().toLowerCase().email().max(254),
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

  // A nominated city is required for every tier that touches the shared
  // practical day, AND for online (owner: "make sure they nominate a city when
  // they buy online"). Only the pure-online path could in theory skip it, but
  // we require it there too so EP city-demand is captured from the first sale.
  if (!location) {
    return NextResponse.json({ error: 'Please nominate your workshop city.' }, { status: 400 })
  }

  const base = CONFIG.SEO.SITE_URL || 'https://portal.concussion-education-australia.com'
  const successUrl = `${base}/ep-course/dashboard?purchase=success&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${base}/concussion-rehab-mastery?purchase=cancelled`

  try {
    const session = await createCrmCheckoutSession({ tier, location, customerEmail: email, successUrl, cancelUrl, utm, attribution })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[crm-checkout] session create failed:', err)
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 })
  }
}
