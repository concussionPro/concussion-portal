/**
 * Stripe Configuration & Utilities
 *
 * One-time payment checkout for concussion courses:
 *   - Online Only: $497 AUD
 *   - Full Course (online + in-person): $1,190 AUD (early bird) / $1,400 AUD (regular)
 *   - International Online: $299 USD (online-only, no workshop)
 *
 * Uses Stripe Checkout in 'payment' mode (no subscriptions).
 * Environment variables required:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 */

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
})

/**
 * Course pricing (cents)
 */
export const COURSE_PRICING = {
  // AUD pricing
  ONLINE_ONLY: 49700,           // $497 AUD
  FULL_COURSE_EARLY: 119000,    // $1,190 AUD (early bird)
  FULL_COURSE_REGULAR: 140000,  // $1,400 AUD (regular)
  // USD pricing (international)
  INTERNATIONAL_ONLINE: 29900,  // $299 USD
} as const

/**
 * Course type -> access level mapping
 */
export const COURSE_ACCESS_MAP: Record<string, 'online-only' | 'full-course'> = {
  'online-only': 'online-only',
  'full-course': 'full-course',
  'international-online': 'online-only',
}

/**
 * Valid workshop locations
 */
export const VALID_LOCATIONS = ['sydney', 'melbourne', 'byron-bay'] as const
export type WorkshopLocation = typeof VALID_LOCATIONS[number]

/**
 * Valid course types (including international)
 */
export const VALID_COURSE_TYPES = ['online-only', 'full-course', 'international-online'] as const
export type CourseType = typeof VALID_COURSE_TYPES[number]

/**
 * Create a Stripe Checkout Session for course purchase
 */
export async function createCourseCheckoutSession({
  courseType,
  location,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  courseType: CourseType
  location?: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
}) {
  const isEarlyBird = isEarlyBirdActive()
  let unitAmount: number
  let currency: string
  let productName: string
  let productDescription: string

  if (courseType === 'international-online') {
    unitAmount = COURSE_PRICING.INTERNATIONAL_ONLINE
    currency = 'usd'
    productName = 'ConcussionPro — Online Course (International)'
    productDescription = '8 online modules (8 CPD hours) · Lifetime access · Clinical Toolkit · Reference Repository · Digital certificate · AHPRA aligned, endorsed by Osteopathy Australia'
  } else if (courseType === 'online-only') {
    unitAmount = COURSE_PRICING.ONLINE_ONLY
    currency = 'aud'
    productName = 'ConcussionPro — Online Course'
    productDescription = '8 online modules (8 CPD hours) · Lifetime access · Clinical Toolkit · Reference Repository · Digital certificate'
  } else {
    unitAmount = isEarlyBird ? COURSE_PRICING.FULL_COURSE_EARLY : COURSE_PRICING.FULL_COURSE_REGULAR
    currency = 'aud'
    const locationLabel = location ? formatLocation(location) : 'TBD'
    productName = `ConcussionPro — Complete Course (${locationLabel})`
    productDescription = `8 online modules + full-day in-person workshop (${locationLabel}) · 14 CPD hours · AHPRA aligned · All materials included`
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: {
            name: productName,
            description: productDescription,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: customerEmail || undefined,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      courseType,
      location: location || '',
      accessLevel: COURSE_ACCESS_MAP[courseType],
      isEarlyBird: isEarlyBird ? 'true' : 'false',
      currency,
      source: 'portal',
      timestamp: new Date().toISOString(),
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    phone_number_collection: { enabled: true },
    custom_text: {
      submit: {
        message: courseType === 'full-course'
          ? `Your workshop location: ${formatLocation(location || '')}. You'll receive a login link by email after purchase.`
          : courseType === 'international-online'
          ? "International online access. You'll receive a login link by email after purchase to start learning immediately."
          : "You'll receive a login link by email after purchase to start learning immediately.",
      },
    },
  })

  return session
}

/**
 * Check if early bird pricing is still active
 * Deadline: Feb 1, 2026 23:59:59 AEDT (UTC+11)
 */
function isEarlyBirdActive(): boolean {
  const deadline = new Date('2026-02-01T12:59:59Z')
  return new Date() < deadline
}

/**
 * Format location slug to display name
 */
function formatLocation(slug: string): string {
  const map: Record<string, string> = {
    'sydney': 'Sydney',
    'melbourne': 'Melbourne',
    'byron-bay': 'Byron Bay',
  }
  return map[slug] || slug || 'TBD'
}

export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session
}

export async function retrieveCheckoutSession(sessionId: string) {
  return await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'customer'],
  })
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
) {
  return stripe.webhooks.constructEvent(payload, signature, secret)
}
