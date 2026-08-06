import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { COURSES, getEffectiveStatus, getEffectivePrice } from '@/lib/ai-course/provider-catalogue'
import { CONFIG } from '@/lib/config'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'

const schema = z.object({
  courseSlug: z.string().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  promoCode: z.string().trim().max(60).optional(),
})

/**
 * POST /api/courses/checkout
 *
 * Creates a Stripe Checkout session for a single short-course purchase
 * (e.g. AI in Clinical Practice at A$197, Vagus Nerve at A$97).
 *
 * Returns { url } — the client redirects the browser there.
 *
 * Webhook at /api/webhooks/stripe records the completed purchase to
 * the course_purchases table on the checkout.session.completed event.
 */
export async function POST(request: NextRequest) {
  // Rate limit, same as /api/create-checkout and the international CRM route:
  // this endpoint mints a real Stripe Checkout Session on an unauthenticated
  // POST, so without one a script can spray sessions at the account.
  const rl = await rateLimit({ key: `short-course-checkout:${getClientIp(request)}`, limit: 10, windowSec: 60 })
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
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { courseSlug, email, promoCode } = parsed.data

  const course = COURSES.find((c) => c.id === courseSlug)
  if (!course || getEffectiveStatus(course) !== 'live') {
    return NextResponse.json({ error: 'Course not found or not available for purchase' }, { status: 404 })
  }
  // Catalogue entries that are display-only here (CCM) must not be sold as a
  // short course — that would charge the buyer and fulfil nothing.
  if (!course.purchasableViaCheckout) {
    return NextResponse.json(
      { error: 'Concussion Clinical Mastery is enrolled via the pricing page — head to /pricing to choose the online or complete course.' },
      { status: 400 }
    )
  }
  if (course.priceAUD === null) {
    return NextResponse.json({ error: 'Course is not configured for direct purchase' }, { status: 400 })
  }
  // Resolve current price (launch-week early-bird vs full) at request time —
  // not at module-load time. This is what handles the A$99 → A$197 reversion
  // automatically on earlyBirdEndsAt without a cron.
  const { price: effectivePrice, isEarlyBird } = getEffectivePrice(course)
  if (effectivePrice === null) {
    return NextResponse.json({ error: 'Course price not configured' }, { status: 400 })
  }

  const successBase = CONFIG.SEO.SITE_URL || 'https://portal.concussion-education-australia.com'
  const successUrl = `${successBase}${course.route}?purchase=success&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${successBase}/courses?purchase=cancelled&course=${courseSlug}`

  // Auto-apply a promo code if one was intentionally passed. NO manual-entry
  // field, ever: Stripe's field admits every active code in the account and
  // cannot be scoped to a product (this line item is ad-hoc `price_data`), so
  // opening it hands the buyer SCAT6 — the standing, never-expiring $50
  // CCM-online-only completion coupon — against an A$82 short course. The old
  // "only when the passed code wasn't found" fallback still opened it: pass
  // ?promo=anything-invalid and the field appears. Same rule as lib/stripe.ts,
  // where the eligible surface is online-only and nothing here qualifies.
  // ...and the SAME rule must bind the PARAMETER path, not just the manual
  // field (2026-08-06 server-surface audit). The comment above said "nothing
  // here qualifies", but only `allow_promotion_codes` was closed — the
  // `promoCode` body field was still looked up and applied unconditionally, so
  // `POST {courseSlug, email, promoCode:'SCAT6'}` took A$50 off any short
  // course. SCAT6 is the CCM-online completion reward, is published in
  // customer emails (lib/email-sequences.ts), never expires, and cannot be
  // product-scoped in Stripe because every line item here is ad-hoc
  // `price_data`. Refuse it explicitly; a genuinely targeted short-course code
  // still auto-applies.
  const ineligibleCode = promoCode?.trim().toUpperCase() === CONFIG.COURSE.PROMO_CODE

  let discounts: { promotion_code: string }[] | undefined
  if (promoCode && !ineligibleCode) {
    try {
      const promoCodes = await stripe.promotionCodes.list({
        code: promoCode.toUpperCase(),
        active: true,
        limit: 1,
      })
      if (promoCodes.data.length > 0) {
        discounts = [{ promotion_code: promoCodes.data[0].id }]
      }
    } catch {
      /* Stripe lookup failed — sell at list price rather than open the field. */
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    line_items: [
      {
        price_data: {
          currency: 'aud',
          unit_amount: effectivePrice * 100,
          product_data: {
            name: course.title,
            description: course.description,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      productType: 'short-course',
      courseSlug,
      email,
      isEarlyBird: String(isEarlyBird),
      priceAUD: String(effectivePrice),
    },
    ...(discounts ? { discounts } : {}),
  })

  return NextResponse.json({ url: session.url })
}
