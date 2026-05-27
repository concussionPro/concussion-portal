import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { COURSES, getEffectiveStatus, getEffectivePrice } from '@/lib/ai-course/provider-catalogue'
import { CONFIG } from '@/lib/config'

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

  // Auto-apply promo code if present
  let discounts: { promotion_code: string }[] | undefined
  let allowPromotionCodes: boolean | undefined
  if (promoCode) {
    try {
      const promoCodes = await stripe.promotionCodes.list({
        code: promoCode.toUpperCase(),
        active: true,
        limit: 1,
      })
      if (promoCodes.data.length > 0) {
        discounts = [{ promotion_code: promoCodes.data[0].id }]
      } else {
        allowPromotionCodes = true
      }
    } catch {
      allowPromotionCodes = true
    }
  } else {
    allowPromotionCodes = true
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
    ...(allowPromotionCodes !== undefined ? { allow_promotion_codes: allowPromotionCodes } : {}),
  })

  return NextResponse.json({ url: session.url })
}
