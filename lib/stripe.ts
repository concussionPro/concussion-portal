/**
 * Stripe Configuration & Utilities
 *
 * One-time payment checkout for concussion courses:
 *   - Online Only: $497 AUD
 *   - Full Course (online + in-person): $1,400 sticker; $1,190 early-bird
 *     whenever the buyer's city has no live scheduled round or the round is
 *     more than EARLY_BIRD_DAYS_BEFORE days out (nomination model, 2026-07-02)
 *
 * Uses Stripe Checkout in 'payment' mode (no subscriptions).
 * Environment variables required:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 */

import Stripe from 'stripe'
import { CONFIG, isEarlyBirdForLocation } from '@/lib/config'

// Lazy init: Stripe is only needed at request time, not during build page collection
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (_stripe) return _stripe
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
  }
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-02-25.clover',
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
  WORKSHOP_UPGRADE_EARLY: (CONFIG.COURSE.PRICE_EARLY_BIRD - CONFIG.COURSE.PRICE_ONLINE) * 100,
  WORKSHOP_UPGRADE_REGULAR: (CONFIG.COURSE.PRICE_REGULAR - CONFIG.COURSE.PRICE_ONLINE) * 100,
  // Clinic Hub Pack — 5 online seats + branded docs + admin pack ($1,500).
  // Targeted at clinic owners via cold B2B outreach.
  CLINIC_HUB_PACK: CONFIG.COURSE.PRICE_CLINIC_HUB_PACK * 100,
  // Per-clinician seat beyond the 5 included in Hub Pack base ($250).
  CLINIC_HUB_EXTRA_SEAT: CONFIG.COURSE.PRICE_CLINIC_HUB_EXTRA_SEAT * 100,
  // Per-clinician workshop upgrade for Hub Pack buyers ($500).
  CLINIC_WORKSHOP_UPGRADE: CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE * 100,
} as const

/**
 * Course type -> access level mapping
 */
export const COURSE_ACCESS_MAP: Record<string, 'online-only' | 'full-course'> = {
  'online-only': 'online-only',
  'full-course': 'full-course',
  'international-online': 'online-only',
  'workshop-upgrade': 'full-course',
  // Clinic Hub Pack — purchaser gets full-course access (so they can verify
  // content). Additional seats are provisioned manually post-checkout via
  // redemption codes. Workshop upgrades are tracked separately as add-ons.
  'clinic-hub-pack': 'full-course',
  'clinic-hub-extra-seat': 'online-only',
  'clinic-workshop-upgrade': 'full-course',
}

/**
 * Valid workshop locations
 */
export const VALID_LOCATIONS = ['sydney', 'melbourne', 'byron-bay', 'adelaide', 'wa'] as const
export type WorkshopLocation = typeof VALID_LOCATIONS[number]

/**
 * Valid course types (including international)
 */
export const VALID_COURSE_TYPES = [
  'online-only',
  'full-course',
  'international-online',
  'workshop-upgrade',
  'clinic-hub-pack',
  'clinic-hub-extra-seat',
  'clinic-workshop-upgrade',
] as const
export type CourseType = typeof VALID_COURSE_TYPES[number]

/**
 * Thrown when a checkout session can't be created for a legitimate business
 * reason (workshop already ran, workshop sold out). The API route surfaces
 * `message` to the buyer with a 4xx instead of a generic 500.
 */
export class CheckoutUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CheckoutUnavailableError'
  }
}

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
  bundleDiscountAud = 0,
}: {
  courseType: CourseType
  location?: string
  preferredCity?: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  promoCode?: string
  utm?: Record<string, string>
  /** AUD dollars (not cents) of discount to apply for Reference+Toolkit bundle owners. */
  bundleDiscountAud?: number
}) {
  // Workshop-seat purchases follow the NOMINATION model (owner decision
  // 2026-07-02): the full course / workshop upgrade is buyable at ANY time
  // for ANY city. If the city has no live scheduled date (collecting,
  // completed, closed, or a confirmed date that has passed), the purchase is
  // a NOMINATION for the city's next round — the buyer feeds Ready-to-Train
  // and a date launches when the city hits the confirmation threshold.
  // The ONLY refusal is a sold-out live round (honesty: they'd expect that
  // exact date).
  let workshopScheduled = false // a confirmed, future-dated round exists for `location`
  if (courseType === 'full-course' || courseType === 'workshop-upgrade') {
    const workshopConfig = location
      ? Object.values(CONFIG.LOCATIONS).find(loc => loc.slug === location)
      : null
    workshopScheduled =
      workshopConfig?.status === 'confirmed' &&
      !!workshopConfig.dateObj &&
      workshopConfig.dateObj.getTime() > Date.now()
    if (workshopScheduled && workshopConfig) {
      const { getEnrollmentCount } = await import('@/lib/users')
      const enrolled = await getEnrollmentCount(workshopConfig.slug)
      if (enrolled >= CONFIG.WORKSHOP.CAPACITY_PER_COURSE) {
        // Live round is full — sell the seat as a NEXT-round nomination
        // (early-bird pricing) instead of refusing the sale outright.
        workshopScheduled = false
      }
    }
  }

  // Early bird ($1,190): active for any purchase that is not a seat at a
  // live, scheduled, in-window round. A sold-out live round downgraded to a
  // next-round nomination above is also early-bird.
  const isEarlyBird = !workshopScheduled || isEarlyBirdForLocation(location)
  let unitAmount: number
  let currency: string
  let productName: string
  let productDescription: string

  if (courseType === 'international-online') {
    unitAmount = COURSE_PRICING.INTERNATIONAL_ONLINE
    currency = 'usd'
    productName = 'Clinical Concussion Course — International'
    productDescription = '8 online modules (8 CE credits) · Lifetime access · Clinical Toolkit · Reference Repository · Certificate of completion'
  } else if (courseType === 'workshop-upgrade') {
    unitAmount = isEarlyBird ? COURSE_PRICING.WORKSHOP_UPGRADE_EARLY : COURSE_PRICING.WORKSHOP_UPGRADE_REGULAR
    currency = 'aud'
    const locationLabel = location ? formatLocation(location) : 'TBD'
    productName = `Concussion Education Australia — Workshop Upgrade (${locationLabel})`
    productDescription = `Full-day in-person workshop (${locationLabel}) · 6 additional CPD hours (14 total) · AHPRA aligned · All materials included`
  } else if (courseType === 'online-only') {
    unitAmount = COURSE_PRICING.ONLINE_ONLY
    currency = 'aud'
    productName = 'Concussion Education Australia — Online Course'
    productDescription = '8 online modules (8 CPD hours) · Lifetime access · Clinical Toolkit · Reference Repository · Digital certificate'
  } else if (courseType === 'clinic-hub-pack') {
    unitAmount = COURSE_PRICING.CLINIC_HUB_PACK
    currency = 'aud'
    productName = 'Concussion Hub Pack — Clinic Tier'
    productDescription = `Up to ${CONFIG.COURSE.CLINIC_HUB_SEATS_INCLUDED} clinician online seats · LIFETIME access · Branded clinical docs (GP letters, NDIS framework, school sport intake, RTP tracking, capability one-pager) · Admin/billing pack · 90-day launch playbook · 30-min strategy call · Extra seats beyond ${CONFIG.COURSE.CLINIC_HUB_SEATS_INCLUDED}: A$${CONFIG.COURSE.PRICE_CLINIC_HUB_EXTRA_SEAT}/clinician · In-person workshop upgrade A$${CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE}/clinician`
  } else if (courseType === 'clinic-hub-extra-seat') {
    unitAmount = COURSE_PRICING.CLINIC_HUB_EXTRA_SEAT
    currency = 'aud'
    productName = 'Concussion Hub Pack — Extra Online Seat'
    productDescription = `Adds 1 online seat for a clinician beyond the ${CONFIG.COURSE.CLINIC_HUB_SEATS_INCLUDED} included in the Hub Pack base · 8 modules · 14 CPD hours · OA endorsed · Lifetime access`
  } else if (courseType === 'clinic-workshop-upgrade') {
    unitAmount = COURSE_PRICING.CLINIC_WORKSHOP_UPGRADE
    currency = 'aud'
    const locationLabel = location ? formatLocation(location) : 'TBD'
    productName = `Concussion Hub Pack — Workshop Upgrade (${locationLabel})`
    productDescription = `Adds in-person workshop attendance for 1 nominated clinician (${locationLabel}) · 6 additional CPD hours · Hands-on credentials · Clinic Hub Pack add-on`
  } else {
    unitAmount = isEarlyBird ? COURSE_PRICING.FULL_COURSE_EARLY : COURSE_PRICING.FULL_COURSE_REGULAR
    currency = 'aud'
    const locationLabel = location ? formatLocation(location) : 'TBD'
    productName = `Concussion Education Australia — Complete Course (${locationLabel})`
    productDescription = workshopScheduled
      ? `8 online modules + full-day in-person workshop (${locationLabel}) · 14 CPD hours · AHPRA aligned · All materials included`
      : `8 online modules (start today) + full-day in-person workshop (${locationLabel} — date launches as your city fills, min ${CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks' notice) · 14 CPD hours · AHPRA aligned`
  }

  // Apply bundle-owner discount to AUD course purchases (online-only / full-course).
  // Stored as metadata so the webhook can reconcile and the finance record is clear.
  let bundleDiscountApplied = 0
  if (
    bundleDiscountAud > 0 &&
    (courseType === 'online-only' || courseType === 'full-course') &&
    currency === 'aud'
  ) {
    const discountCents = bundleDiscountAud * 100
    // Never let the discount drive the price below $100 (keep finance sane + matches the $100 floor on the $97 book)
    const floor = 100 * 100
    bundleDiscountApplied = Math.min(discountCents, Math.max(0, unitAmount - floor))
    unitAmount = unitAmount - bundleDiscountApplied
    productDescription = `${productDescription} · A$${bundleDiscountApplied / 100} Reference+Toolkit bundle credit applied`
  }

  // If a promo code was provided, look it up in Stripe to auto-apply
  // Workshop upgrades: no promo codes (already discounted)
  let discounts: { promotion_code: string }[] | undefined
  let allowPromotionCodes: boolean | undefined
  if (courseType === 'workshop-upgrade') {
    // Already discounted — no promo codes allowed
  } else if (bundleDiscountApplied > 0) {
    // Bundle credit already applied to the line item — don't let a promo
    // code stack a second discount on top of it.
    allowPromotionCodes = false
  } else if (promoCode && !(promoCode.toUpperCase() === 'SCAT6' && courseType !== 'online-only')) {
    // SCAT6 ($50 completion reward) is ONLY valid on the online course —
    // enforced here, never left to Stripe dashboard coupon config.
    try {
      const promoCodes = await stripe.promotionCodes.list({ code: promoCode.toUpperCase(), active: true, limit: 1 })
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
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour (gives BNPL users time)
    // Let Stripe auto-detect optimal payment methods per device/location/currency.
    // Shows Apple Pay, Google Pay, Link, cards, Afterpay, Klarna as appropriate.
    // Requires: (1) payment methods enabled in Stripe Dashboard, (2) Apple Pay
    // domain verification file at /.well-known/apple-developer-merchantid-domain-association
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
    // Stripe-hosted cart recovery: expired sessions carry a recovery URL that
    // re-opens the same checkout (same price/discounts) for 30 days. The
    // checkout.session.expired handler puts it in the recovery emails.
    after_expiration: {
      recovery: { enabled: true },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      courseType,
      location: location || '',
      // 'false' = next-round nomination (no live scheduled date at purchase
      // time) — feeds the Ready-to-Train pipeline in admin.
      workshopScheduled: workshopScheduled ? 'true' : 'false',
      preferredCity: preferredCity || '',
      accessLevel: COURSE_ACCESS_MAP[courseType],
      isEarlyBird: isEarlyBird ? 'true' : 'false',
      currency,
      source: 'portal',
      timestamp: new Date().toISOString(),
      bundleDiscountAppliedCents: String(bundleDiscountApplied),
      ...(utm?.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm?.utm_medium ? { utm_medium: utm.utm_medium } : {}),
      ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
      ...(utm?.gclid ? { gclid: utm.gclid } : {}),
    },
    // Pass email to PaymentIntent so payment_failed handler can send recovery emails
    payment_intent_data: {
      metadata: {
        email: customerEmail || '',
        courseType,
      },
    },
    ...(discounts ? { discounts } : { allow_promotion_codes: allowPromotionCodes }),
    billing_address_collection: 'required',
    phone_number_collection: { enabled: true },
    custom_text: {
      submit: {
        message: courseType === 'full-course' || courseType === 'workshop-upgrade'
          ? getCheckoutSubmitMessage(location)
          : "You'll receive a login link by email after purchase to start learning immediately.",
      },
    },
  })

  return session
}

/**
 * Get submit message for full-course checkout based on city status
 */
function getCheckoutSubmitMessage(location?: string): string {
  const locationConfig = location
    ? Object.values(CONFIG.LOCATIONS).find(loc => loc.slug === location)
    : null

  const cityName = formatLocation(location || '')

  const hasLiveDate =
    locationConfig?.status === 'confirmed' &&
    locationConfig.dateObj &&
    locationConfig.dateObj.getTime() > Date.now()
  if (hasLiveDate && locationConfig) {
    return `Your workshop: ${cityName}, ${locationConfig.date}. You'll receive a login link by email after purchase.`
  }

  return `Your nominated workshop city: ${cityName}. Your date launches when enough clinicians in your city enrol — you'll get at least ${CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks' notice, and your early-bird rate is locked in.`
}

/**
 * Format location slug to display name
 */
function formatLocation(slug: string): string {
  const map: Record<string, string> = {
    'sydney': 'Sydney',
    'melbourne': 'Melbourne',
    'byron-bay': 'Byron Bay',
    'adelaide': 'Adelaide',
    'wa': 'Perth (WA)',
  }
  return map[slug] || slug || 'TBD'
}

/**
 * SST Trainer subscription plans → Stripe price IDs (recurring).
 *
 * These are RECURRING prices created in the Stripe Dashboard (manual step).
 * Set the IDs in env. If either is missing the subscribe route reports the
 * tier as unavailable, so this stays inert until you launch it.
 */
export const SST_SUBSCRIPTION_PRICES: Record<'monthly' | 'annual', string | undefined> = {
  monthly: process.env.STRIPE_SST_MONTHLY_PRICE_ID,
  annual: process.env.STRIPE_SST_ANNUAL_PRICE_ID,
}

export function sstSubscriptionsConfigured(): boolean {
  return Boolean(SST_SUBSCRIPTION_PRICES.monthly && SST_SUBSCRIPTION_PRICES.annual)
}

/**
 * Create a Stripe Checkout Session for an SST Trainer subscription.
 * mode: 'subscription' — isolated from the one-time course checkout above.
 */
export async function createSstSubscriptionCheckoutSession({
  plan,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  plan: 'monthly' | 'annual'
  customerEmail?: string
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  const price = SST_SUBSCRIPTION_PRICES[plan]
  if (!price) {
    throw new CheckoutUnavailableError('SST subscriptions are not available yet.')
  }
  return getStripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    customer_email: customerEmail || undefined,
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    metadata: {
      product: 'sst-trainer',
      plan,
      source: 'portal-dashboard',
      timestamp: new Date().toISOString(),
    },
    subscription_data: {
      metadata: { product: 'sst-trainer', plan, email: customerEmail || '' },
    },
  })
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
