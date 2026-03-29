/**
 * Stripe Configuration & Utilities
 *
 * One-time payment checkout for concussion courses:
 *   - Online Only: $497 AUD
 *   - Full Course (online + in-person): $1,190 AUD (early bird) / $1,400 AUD (regular)
 *
 * Uses Stripe Checkout in 'payment' mode (no subscriptions).
 * Environment variables required:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 */

import Stripe from 'stripe'
import { CONFIG } from '@/lib/config'

// Lazy init: Stripe is only needed at request time, not during build page collection
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (_stripe) return _stripe
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
  }
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
  })
  return _stripe
}

/** @deprecated Use getStripe() instead — kept for backwards compat */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop]
  },
})

/**
 * Course pricing (cents)
 */
export const COURSE_PRICING = {
  ONLINE_ONLY: CONFIG.COURSE.PRICE_ONLINE * 100,
  FULL_COURSE_EARLY: CONFIG.COURSE.PRICE_EARLY_BIRD * 100,
  FULL_COURSE_REGULAR: CONFIG.COURSE.PRICE_REGULAR * 100,
  INTERNATIONAL_ONLINE: CONFIG.COURSE.PRICE_INTERNATIONAL * 100,
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
  preferredCity,
  customerEmail,
  successUrl,
  cancelUrl,
  promoCode,
  utm,
}: {
  courseType: CourseType
  location?: string
  preferredCity?: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  promoCode?: string
  utm?: Record<string, string>
}) {
  const isEarlyBird = await isEarlyBirdActiveForLocation(location)
  let unitAmount: number
  let currency: string
  let productName: string
  let productDescription: string

  if (courseType === 'international-online') {
    unitAmount = COURSE_PRICING.INTERNATIONAL_ONLINE
    currency = 'usd'
    productName = 'ConcussionPro Online Course — International'
    productDescription = '8 online modules (8 CE credits) · Lifetime access · Clinical Toolkit · Reference Repository · Certificate of completion'
  } else if (courseType === 'online-only') {
    unitAmount = COURSE_PRICING.ONLINE_ONLY
    currency = 'aud'
    productName = 'ConcussionPro — Online Course'
    productDescription = '8 online modules (8 CPD points) · Lifetime access · Clinical Toolkit · Reference Repository · Digital certificate'
  } else {
    unitAmount = isEarlyBird ? COURSE_PRICING.FULL_COURSE_EARLY : COURSE_PRICING.FULL_COURSE_REGULAR
    currency = 'aud'
    const locationLabel = location ? formatLocation(location) : 'TBD'
    productName = `ConcussionPro — Complete Course (${locationLabel})`
    productDescription = `8 online modules + full-day in-person workshop (${locationLabel}) · 14 CPD points · AHPRA aligned · All materials included`
  }

  // If a promo code was provided, look it up in Stripe to auto-apply
  let discounts: { promotion_code: string }[] | undefined
  let allowPromotionCodes: boolean | undefined
  if (promoCode) {
    try {
      const promoCodes = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 })
      if (promoCodes.data.length > 0) {
        discounts = [{ promotion_code: promoCodes.data[0].id }]
      } else {
        // Promo code not found — fall back to manual entry field
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
    payment_method_types: currency === 'aud' ? ['card', 'afterpay_clearpay', 'klarna'] : ['card'],
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
      preferredCity: preferredCity || '',
      accessLevel: COURSE_ACCESS_MAP[courseType],
      isEarlyBird: isEarlyBird ? 'true' : 'false',
      currency,
      source: 'portal',
      timestamp: new Date().toISOString(),
      ...(utm?.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm?.utm_medium ? { utm_medium: utm.utm_medium } : {}),
      ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
      ...(utm?.gclid ? { gclid: utm.gclid } : {}),
    },
    ...(discounts ? { discounts } : { allow_promotion_codes: allowPromotionCodes }),
    billing_address_collection: 'required',
    phone_number_collection: { enabled: true },
    custom_text: {
      submit: {
        message: courseType === 'full-course'
          ? getCheckoutSubmitMessage(location)
          : "You'll receive a login link by email after purchase to start learning immediately.",
      },
    },
  })

  return session
}

/**
 * Check if early bird pricing is active for a location.
 *
 * - Collecting cities: always early bird (incentivize early registrants)
 * - Confirmed cities: ends when EITHER condition is met:
 *     1. Within 7 days of course date
 *     2. 50% of seats sold (6/12)
 */
async function isEarlyBirdActiveForLocation(location?: string): Promise<boolean> {
  // Hard deadline — applies to ALL locations regardless of status
  const hardDeadline = new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T23:59:59')
  if (new Date() > hardDeadline) return false

  // Find location config
  const locationConfig = location
    ? Object.values(CONFIG.LOCATIONS).find(loc => loc.slug === location)
    : null

  // Collecting or unknown location → early bird (within hard deadline)
  if (!locationConfig || locationConfig.status === 'collecting') {
    return true
  }

  // Confirmed with a date → apply date-proximity + seat-count logic
  if (locationConfig.status === 'confirmed' && locationConfig.dateObj) {
    const now = new Date()
    const dateDeadline = new Date(
      locationConfig.dateObj.getTime() - CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE * 24 * 60 * 60 * 1000
    )
    dateDeadline.setHours(23, 59, 59, 999)
    if (now >= dateDeadline) return false

    const { getEnrollmentCount } = await import('@/lib/users')
    const enrolled = await getEnrollmentCount(locationConfig.slug)
    if (enrolled >= CONFIG.WORKSHOP.EARLY_BIRD_SEAT_THRESHOLD) return false

    return true
  }

  // Completed → no early bird
  return false
}

/**
 * Get submit message for full-course checkout based on city status
 */
function getCheckoutSubmitMessage(location?: string): string {
  const locationConfig = location
    ? Object.values(CONFIG.LOCATIONS).find(loc => loc.slug === location)
    : null

  const cityName = formatLocation(location || '')

  if (locationConfig?.status === 'confirmed' && locationConfig.dateObj) {
    return `Your workshop: ${cityName}, ${locationConfig.date}. You'll receive a login link by email after purchase.`
  }

  return `Your workshop location: ${cityName}. Your date will be confirmed once ${CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD} clinicians are registered. You'll get at least ${CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks' notice.`
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
