/**
 * Stripe Configuration & Utilities
 *
 * Server-side Stripe instance for secure payment processing
 */

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

/**
 * Stripe Price IDs for Products
 * Get these from Stripe Dashboard after creating products
 */
export const STRIPE_PRICES = {
  // Individual Professional
  INDIVIDUAL_ANNUAL: process.env.STRIPE_PRICE_INDIVIDUAL_ANNUAL || '',
  INDIVIDUAL_MONTHLY: process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY || '',

  // Premium Professional
  PREMIUM_ANNUAL: process.env.STRIPE_PRICE_PREMIUM_ANNUAL || '',
  PREMIUM_MONTHLY: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || '',

  // Clinic/Team License
  TEAM_ANNUAL: process.env.STRIPE_PRICE_TEAM_ANNUAL || '',

  // SCAT Mastery Short Course
  SCAT_MASTERY: process.env.STRIPE_PRICE_SCAT_MASTERY || '',
}

/**
 * Product Metadata - Maps Stripe products to access levels
 */
export const PRODUCT_ACCESS_LEVELS = {
  [STRIPE_PRICES.INDIVIDUAL_ANNUAL]: 'online-only',
  [STRIPE_PRICES.INDIVIDUAL_MONTHLY]: 'online-only',
  [STRIPE_PRICES.PREMIUM_ANNUAL]: 'online-only', // Premium features handled separately
  [STRIPE_PRICES.PREMIUM_MONTHLY]: 'online-only',
  [STRIPE_PRICES.TEAM_ANNUAL]: 'online-only', // Team features handled separately
  [STRIPE_PRICES.SCAT_MASTERY]: 'preview', // Short course only
} as const

/**
 * Create a Stripe Checkout Session
 */
export async function createCheckoutSession({
  priceId,
  customerEmail,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  priceId: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}) {
  const session = await stripe.checkout.sessions.create({
    mode: priceId === STRIPE_PRICES.SCAT_MASTERY ? 'payment' : 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    automatic_tax: { enabled: true },
  })

  return session
}

/**
 * Create a Stripe Customer Portal Session
 * (For users to manage subscription, payment methods, invoices)
 */
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

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId)
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId)
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
) {
  return stripe.webhooks.constructEvent(payload, signature, secret)
}
