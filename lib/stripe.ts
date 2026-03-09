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
  ONLINE_ONLY: 49700,           // $497 AUD
  FULL_COURSE_EARLY: 119000,    // $1,190 AUD (early bird)
  FULL_COURSE_REGULAR: 140000,  // $1,400 AUD (regular)
} as const

/**
 * Course type -> access level mapping
 */
export const COURSE_ACCESS_MAP: Record<string, 'online-only' | 'full-course'> = {
  'online-only': 'online-only',
  'full-course': 'full-course',
}

/**
 * Valid workshop locations
 */
export const VALID_LOCATIONS = ['sydney', 'melbourne', 'byron-bay'] as const
export type WorkshopLocation = typeof VALID_LOCATIONS[number]

/**
 * Valid course types (including international)
 */
export const VALID_COURSE_TYPES = ['online-only', 'full-course'] as const
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
  const isEarlyBird = await isEarlyBirdActiveForLocation(location)
  let unitAmount: number
  let currency: string
  let productName: string
  let productDescription: string

  if (courseType === 'online-only') {
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

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card', 'afterpay_clearpay'],
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
          : "You'll receive a login link by email after purchase to start learning immediately.",
      },
    },
  })

  return session
}

/**
 * Check if early bird pricing is active for a location.
 * Ends when EITHER condition is met:
 *   1. Within 7 days of course date
 *   2. 50% of seats sold (6/12)
 * Falls back to static deadline for non-location purchases.
 */
async function isEarlyBirdActiveForLocation(location?: string): Promise<boolean> {
  const now = new Date()

  // Find location config
  const locationConfig = location
    ? Object.values(CONFIG.LOCATIONS).find(loc => loc.slug === location)
    : null

  if (!locationConfig || locationConfig.status !== 'confirmed' || !locationConfig.dateObj) {
    return now < CONFIG.EARLY_BIRD_DEADLINE
  }

  // Check date: 7 days before course
  const dateDeadline = new Date(
    locationConfig.dateObj.getTime() - CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE * 24 * 60 * 60 * 1000
  )
  dateDeadline.setHours(23, 59, 59, 999)
  if (now >= dateDeadline) return false

  // Check seats: 50% sold
  const { getEnrollmentCount } = await import('@/lib/users')
  const enrolled = await getEnrollmentCount(locationConfig.slug)
  if (enrolled >= CONFIG.WORKSHOP.EARLY_BIRD_SEAT_THRESHOLD) return false

  return true
}

/** @deprecated Use isEarlyBirdActiveForLocation instead */
function isEarlyBirdActive(): boolean {
  return new Date() < CONFIG.EARLY_BIRD_DEADLINE
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
