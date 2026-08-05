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
import { intlPriceForCountry } from '@/lib/international-pricing'
import { hubSeatsForDeclaredCount } from '@/lib/course-hub'

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

/**
 * @deprecated Use getStripe() instead — kept for backwards compat.
 *
 * Forwards every property access to the lazily-constructed client. The indexed
 * read is genuinely dynamic (the key is whatever the caller asked for), so it
 * is typed through `Record<string | symbol, unknown>` rather than `any` — the
 * Proxy's own `Stripe` type still gives call sites full type safety.
 */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
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
  // Per-clinician seat beyond the 5 included in Hub Pack base (see CONFIG —
  // A$497; the old "$250" here was stale).
  CLINIC_HUB_EXTRA_SEAT: CONFIG.COURSE.PRICE_CLINIC_HUB_EXTRA_SEAT * 100,
  // Per-clinician workshop upgrade for Hub Pack buyers (see CONFIG — A$600).
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
  // Clinic Hub Pack — the buyer gets full-course ACCESS (the whole online
  // suite, so they can verify what their team gets). It does NOT buy a
  // practical-day seat: the pack sells ONLINE seats, the in-person day is the
  // separate A$600/clinician add-on. Both hub provisioning paths therefore
  // stamp users.hub_pack_seat_at, and everything that means "owns the day"
  // goes through holdsPracticalDaySeat() in lib/practical-day-seat.ts rather
  // than reading this level. Seats are auto-provisioned via /api/hub/redeem
  // (the "manually post-checkout" note here was stale).
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
  attribution,
  bundleDiscountAud = 0,
  clinicianCount,
  clinicName,
  country,
}: {
  courseType: CourseType
  location?: string
  preferredCity?: string
  /** Visitor country (ISO-3166 alpha-2), derived server-side from cf-ipcountry.
   *  Only used for `international-online` to pick the local charge currency. */
  country?: string | null
  /** Hub Pack only: buyer-declared clinician headcount → the key's seat cap. */
  clinicianCount?: number
  clinicName?: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  promoCode?: string
  utm?: Record<string, string>
  /** Client attribution (session id, first referrer, first UTM) → the webhook
   *  stamps it onto the purchase event so the sale links to its browsing session. */
  attribution?: Record<string, string>
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
    // Local-currency pricing, resolved from the visitor country (server-derived
    // from cf-ipcountry — never client input). Single source of truth in
    // lib/international-pricing.ts so display and charge always match.
    const intl = intlPriceForCountry(country)
    unitAmount = intl.unitAmount
    currency = intl.currency
    productName = 'Clinical Concussion Course — International'
    // HONESTY GATE: "CE credits" is a US accreditation currency and CEA holds no
    // US accreditation (the ACSM Approved-Provider application is PARKED as of
    // 2026-08). State HOURS, which is verifiable, never CREDITS. Same discipline
    // as CONFIG.FEATURES.ESSA_ACCREDITED.
    // 8 hours only — overseas buyers cannot attend the workshop, so never the
    // combined CONFIG.COURSE.TOTAL_CPD_POINTS.
    productDescription = '8 online modules (8 hours of learning) · Lifetime access · Clinical Toolkit · Reference Repository · Certificate of completion'
  } else if (courseType === 'workshop-upgrade') {
    unitAmount = isEarlyBird ? COURSE_PRICING.WORKSHOP_UPGRADE_EARLY : COURSE_PRICING.WORKSHOP_UPGRADE_REGULAR
    currency = 'aud'
    const locationLabel = location ? formatLocation(location) : 'TBD'
    productName = `Concussion Education Australia — Workshop Upgrade (${locationLabel})`
    productDescription = `Full-day in-person workshop (${locationLabel}) · ${CONFIG.COURSE.IN_PERSON_CPD_POINTS} additional CPD hours (${CONFIG.COURSE.TOTAL_CPD_POINTS} total) · AHPRA aligned · All materials included`
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
    // ONLINE seat (COURSE_ACCESS_MAP → 'online-only') = ONLINE_CPD_POINTS only.
    // This said "16 CPD hours" — the online+in-person total — on the Stripe
    // checkout page and the customer's receipt, for a seat that carries no
    // in-person day.
    productDescription = `Adds 1 online seat for a clinician beyond the ${CONFIG.COURSE.CLINIC_HUB_SEATS_INCLUDED} included in the Hub Pack base · ${CONFIG.COURSE.TOTAL_MODULES} modules · ${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours · OA endorsed · Lifetime access`
  } else if (courseType === 'clinic-workshop-upgrade') {
    unitAmount = COURSE_PRICING.CLINIC_WORKSHOP_UPGRADE
    currency = 'aud'
    const locationLabel = location ? formatLocation(location) : 'TBD'
    productName = `Concussion Hub Pack — Workshop Upgrade (${locationLabel})`
    productDescription = `Adds in-person workshop attendance for 1 nominated clinician (${locationLabel}) · ${CONFIG.COURSE.IN_PERSON_CPD_POINTS} additional CPD hours · Hands-on credentials · Clinic Hub Pack add-on`
  } else {
    unitAmount = isEarlyBird ? COURSE_PRICING.FULL_COURSE_EARLY : COURSE_PRICING.FULL_COURSE_REGULAR
    currency = 'aud'
    const locationLabel = location ? formatLocation(location) : 'TBD'
    productName = `Concussion Education Australia — Complete Course (${locationLabel})`
    productDescription = workshopScheduled
      ? `8 online modules + full-day in-person workshop (${locationLabel}) · 16 CPD hours · AHPRA aligned · All materials included`
      : `8 online modules (start today) + full-day in-person workshop (${locationLabel} — date launches as your city fills, min ${CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks' notice) · 16 CPD hours · AHPRA aligned`
  }

  // Hub Pack base price already includes 5 seats — never let a promo code stack
  // on the marginal seat/upgrade add-ons either.
  //
  // SCAT6 is the $50 free-course completion reward and is valid on the ONLINE
  // course only. Blocking it below while still setting allow_promotion_codes:true
  // meant the buyer just typed SCAT6 into Stripe's manual field and got it on the
  // full course anyway — the "enforced here" comment was not true in practice.
  const scat6OnIneligibleCourse =
    promoCode?.toUpperCase() === CONFIG.COURSE.PROMO_CODE && courseType !== 'online-only'

  // Stripe's manual promo field is OPEN TO EVERY ACTIVE CODE IN THE ACCOUNT —
  // it cannot be scoped to a product, because every line item here is an
  // ad-hoc `price_data` product with no dashboard Price behind it. So handing
  // a Complete Course / Hub Pack / international buyer that field is the same
  // as publishing SCAT6 ($50, ONLINE-ONLY by policy) against those products:
  // they just type it in. Blocking the code when it arrives as a PARAMETER
  // (scat6OnIneligibleCourse, below) never closed that door, because the
  // default path passes no promoCode at all. Offer the field only where a code
  // is genuinely redeemable; a targeted promo still auto-applies through the
  // `promoCode` parameter on any course type.
  const promoFieldEligible = courseType === 'online-only'

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
  } else if (scat6OnIneligibleCourse) {
    // Close the manual-entry bypass: refusing to auto-apply SCAT6 is pointless
    // if we then hand the buyer an open promo field to type it into.
    allowPromotionCodes = false
  } else if (promoCode) {
    try {
      const promoCodes = await stripe.promotionCodes.list({ code: promoCode.toUpperCase(), active: true, limit: 1 })
      if (promoCodes.data.length > 0) {
        discounts = [{ promotion_code: promoCodes.data[0].id }]
      } else {
        // Promo code not found — fall back to manual entry field
        allowPromotionCodes = promoFieldEligible
      }
    } catch {
      allowPromotionCodes = promoFieldEligible
    }
  } else {
    allowPromotionCodes = promoFieldEligible
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
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
  ]

  // Hub Pack seat pricing (documented model): the base covers 5 clinician
  // seats; the declared headcount above that bills at A$497/clinician. The
  // webhook sets the key's seat cap from the SAME declared count (clamped to
  // 12), so the cap the buyer gets is always the cap they paid for.
  // HubPackBuyCard shows the identical computed total — display = charge.
  if (courseType === 'clinic-hub-pack') {
    const declaredSeats = hubSeatsForDeclaredCount(clinicianCount)
    const extraSeats = declaredSeats - CONFIG.COURSE.CLINIC_HUB_SEATS_INCLUDED
    if (extraSeats > 0) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          unit_amount: COURSE_PRICING.CLINIC_HUB_EXTRA_SEAT,
          product_data: {
            name: 'Additional clinician seat — Clinic Hub Pack',
            description: `Online seat beyond the ${CONFIG.COURSE.CLINIC_HUB_SEATS_INCLUDED} included in the base pack · ${CONFIG.COURSE.TOTAL_MODULES} modules · ${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours · Lifetime access`,
          },
        },
        quantity: extraSeats,
      })
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour (gives BNPL users time)
    // Let Stripe auto-detect optimal payment methods per device/location/currency.
    // Shows Apple Pay, Google Pay, Link, cards, Afterpay, Klarna as appropriate.
    // Requires: (1) payment methods enabled in Stripe Dashboard, (2) Apple Pay
    // domain verification file at /.well-known/apple-developer-merchantid-domain-association
    line_items: lineItems,
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
      ...(clinicianCount ? { clinicianCount: String(clinicianCount) } : {}),
      ...(clinicName ? { clinicName: clinicName.slice(0, 120) } : {}),
      ...(utm?.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm?.utm_medium ? { utm_medium: utm.utm_medium } : {}),
      ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
      ...(utm?.gclid ? { gclid: utm.gclid } : {}),
      // Attribution → the webhook stamps these onto the purchase_complete event
      // so the sale links to its browsing session (session id joins page views)
      // and carries the first referrer / first UTM. (Stripe metadata: ≤500 chars.)
      ...(attribution?.sessionId ? { attr_session: attribution.sessionId.slice(0, 200) } : {}),
      ...(attribution?.firstReferrer ? { attr_first_ref: attribution.firstReferrer.slice(0, 480) } : {}),
      ...(attribution?.referrer ? { attr_ref: attribution.referrer.slice(0, 480) } : {}),
      ...(attribution?.firstUtm ? { attr_first_utm: attribution.firstUtm.slice(0, 480) } : {}),
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
 * Create a Stripe Checkout Session for a CRM (Concussion Rehab Mastery)
 * purchase — the exercise-physiology stream. IDENTICAL to CCM except the
 * content + its own entitlement: one-time `payment` mode, dynamic price_data
 * (no dashboard Price needed), CRM-specific product + invoice text, and a
 * NOMINATED workshop city carried in metadata. Fulfilment (course_purchases
 * entitlement, CRM invoice, /ep-course welcome) lives in handleCrmPurchase.
 *
 * Callers MUST gate on CONFIG.FEATURES.ESSA_ACCREDITED — this function does not
 * (kept pure); the /api/crm/checkout route refuses when the flag is off.
 */
export async function createCrmCheckoutSession({
  tier,
  location,
  customerEmail,
  successUrl,
  cancelUrl,
  utm,
  attribution,
}: {
  tier: import('@/lib/crm-course').CrmTier
  /** Nominated workshop city (required for online — feeds shared Ready-to-Train). */
  location?: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  utm?: Record<string, string>
  attribution?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
  const { crmPriceCents, crmProductName, crmInvoiceDescription, crmIsEarlyBird } = await import('@/lib/crm-course')
  const unitAmount = crmPriceCents(tier, location)
  const isEarlyBird = crmIsEarlyBird(location)
  const productType = tier === 'upgrade' ? 'crm-upgrade' : 'crm-course'

  return getStripe().checkout.sessions.create({
    mode: 'payment',
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    line_items: [
      {
        price_data: {
          currency: 'aud',
          unit_amount: unitAmount,
          product_data: {
            name: crmProductName(tier, location),
            // Shown on the Stripe page; the tax invoice uses crmInvoiceDescription too.
            description: crmInvoiceDescription(tier, location),
          },
        },
        quantity: 1,
      },
    ],
    customer_email: customerEmail || undefined,
    after_expiration: { recovery: { enabled: true } },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      productType,
      // 'crm' stream marker so analytics + refunds never confuse it with CCM.
      stream: 'crm',
      tier,
      location: location || '',
      isEarlyBird: isEarlyBird ? 'true' : 'false',
      currency: 'aud',
      source: 'portal',
      timestamp: new Date().toISOString(),
      ...(utm?.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm?.utm_medium ? { utm_medium: utm.utm_medium } : {}),
      ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
      ...(attribution?.sessionId ? { attr_session: attribution.sessionId.slice(0, 200) } : {}),
      ...(attribution?.firstReferrer ? { attr_first_ref: attribution.firstReferrer.slice(0, 480) } : {}),
      ...(attribution?.referrer ? { attr_ref: attribution.referrer.slice(0, 480) } : {}),
      ...(attribution?.firstUtm ? { attr_first_utm: attribution.firstUtm.slice(0, 480) } : {}),
    },
    payment_intent_data: {
      metadata: { email: customerEmail || '', productType, stream: 'crm', tier },
    },
    billing_address_collection: 'required',
    phone_number_collection: { enabled: true },
    custom_text: {
      submit: {
        message: tier === 'online'
          ? "You'll receive a login link by email to start the CRM course immediately."
          : `Your nominated workshop city: ${location || 'TBD'}. Your date launches as your city fills — at least ${CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks' notice, early-bird rate locked in.`,
      },
    },
  })
}

/**
 * Create a Stripe Checkout Session for an INTERNATIONAL CRM (Concussion Rehab
 * Mastery) purchase — online-only, geo-priced, one-time `payment` mode. Overseas
 * EPs cannot attend the AU practical day, so there is NO city/location and NO
 * practical entitlement: the buyer gets the online CRM course (one-time /
 * lifetime) + the bundled clinical platform (SST Trainer + Baseline), which is
 * FREE for year 1 then bills MONTHLY at the real single-clinician SST price
 * (A$49/mo) via a real sst-trainer subscription the webhook attaches.
 *
 * Currency + amount come from lib/international-pricing.ts (intlPriceForCountry),
 * the SAME single source the /pricing-international display uses, so display and
 * charge always match. `country` MUST be server-derived (cf-ipcountry) by the
 * caller — never client input.
 *
 * customer_creation:'always' + setup_future_usage:'off_session' ensure a Stripe
 * customer AND a saved payment method exist so the webhook can attach the
 * bundled-then-monthly SST subscription and charge it from year 2.
 *
 * Callers MUST gate on CONFIG.FEATURES.CRM_INTERNATIONAL_LIVE — this function is
 * kept pure; the /api/crm/checkout-international route refuses when the flag is off.
 */
export async function createCrmInternationalCheckoutSession({
  country,
  customerEmail,
  successUrl,
  cancelUrl,
  utm,
  attribution,
}: {
  /** Visitor country (ISO-3166 alpha-2), derived server-side from cf-ipcountry. */
  country?: string | null
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  utm?: Record<string, string>
  attribution?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
  const intl = intlPriceForCountry(country)

  return getStripe().checkout.sessions.create({
    mode: 'payment',
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    // Always create a customer + save the card off-session so the annual renewal
    // subscription can be attached and charged from year 2.
    customer_creation: 'always',
    line_items: [
      {
        price_data: {
          currency: intl.currency,
          unit_amount: intl.unitAmount,
          product_data: {
            name: 'Concussion Rehab Mastery — International',
            description:
              '8 online modules (8 hours of learning) · Lifetime course access · Clinical platform included for year 1 (SST Trainer + Baseline & Serial Testing) · Clinical Toolkit · Certificate of completion',
          },
        },
        quantity: 1,
      },
    ],
    customer_email: customerEmail || undefined,
    after_expiration: { recovery: { enabled: true } },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      productType: 'crm-course',
      // 'crm' stream marker — analytics + refunds never confuse it with CCM.
      stream: 'crm',
      // Online tier only — no in-person day sold overseas.
      tier: 'online',
      // The flag the webhook reads to fire bundle-provisioning + the renewal sub.
      international: 'true',
      // NO location — international buyers can't attend the AU workshop.
      currency: intl.currency,
      source: 'portal',
      timestamp: new Date().toISOString(),
      ...(utm?.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm?.utm_medium ? { utm_medium: utm.utm_medium } : {}),
      ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
      ...(attribution?.sessionId ? { attr_session: attribution.sessionId.slice(0, 200) } : {}),
      ...(attribution?.firstReferrer ? { attr_first_ref: attribution.firstReferrer.slice(0, 480) } : {}),
      ...(attribution?.referrer ? { attr_ref: attribution.referrer.slice(0, 480) } : {}),
      ...(attribution?.firstUtm ? { attr_first_utm: attribution.firstUtm.slice(0, 480) } : {}),
    },
    payment_intent_data: {
      // Save the card to the customer so the year-2 renewal can charge it.
      setup_future_usage: 'off_session',
      metadata: {
        email: customerEmail || '',
        productType: 'crm-course',
        stream: 'crm',
        tier: 'online',
        international: 'true',
      },
    },
    billing_address_collection: 'required',
    phone_number_collection: { enabled: true },
    custom_text: {
      submit: {
        message:
          "You'll get a login link by email to start the CRM course immediately, plus your clinic code for the SST Trainer + Baseline platform (first year included).",
      },
    },
  })
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
/**
 * The three Clinical Testing tiers (owner 2026-07-06) → env Stripe price IDs.
 * Amounts live in the Stripe Dashboard prices, never in code, so the plan
 * can change without a deploy. A missing ID makes that tier unavailable.
 *   single     A$49/mo  · 1 clinician
 *   clinic     A$99/mo  · up to 5 clinicians
 *   enterprise A$149/mo · up to 15 clinicians
 */
export type SstPlan = 'single' | 'clinic' | 'enterprise'

// 2026-08-05 caseload pricing: only priceId is consumed. Display copy lives
// on the subscribe page; enforced caps live in clinic-registry
// TIER_ACTIVE_PATIENT_CAP (5/10/unlimited active patients / 30d).
export const SST_PLANS: Record<SstPlan, { label: string; priceId: string | undefined }> = {
  single: { label: 'Starter', priceId: process.env.STRIPE_SST_SINGLE_PRICE_ID },
  clinic: { label: 'Clinic', priceId: process.env.STRIPE_SST_CLINIC_PRICE_ID },
  enterprise: { label: 'Unlimited', priceId: process.env.STRIPE_SST_ENTERPRISE_PRICE_ID },
}

/**
 * A Stripe Price id, or undefined if the configured value isn't one.
 *
 * SHAPE-CHECKED, not just presence-checked. A live secret key was once pasted
 * into STRIPE_SST_SINGLE_PRICE_ID; a presence check passes that, and the value
 * then travels into `subscriptions.create({ items: [{ price }] })`, where
 * Stripe rejects it with "No such price: 'sk_live_…'" — an error message
 * containing the secret, which was being console.error'd AND emailed to the
 * owner. Treating a malformed value as absent stops it ever reaching Stripe.
 */
export function sstPlanPriceId(plan: SstPlan): string | undefined {
  const id = SST_PLANS[plan]?.priceId
  if (!id) return undefined
  if (!isStripePriceId(id)) {
    console.error(
      `[stripe] STRIPE_SST_${plan.toUpperCase()}_PRICE_ID is not a Stripe Price id ` +
        `(expected "price_…", got "${redactStripeSecrets(id.slice(0, 12))}…"). Treating as unset.`,
    )
    return undefined
  }
  return id
}

/** Stripe Price ids are `price_` + an alphanumeric handle. */
export function isStripePriceId(value: string): boolean {
  return /^price_[A-Za-z0-9]+$/.test(value.trim())
}

/**
 * Strip anything that looks like a Stripe credential out of text before it is
 * logged or emailed. Stripe echoes an invalid id back inside its error message,
 * so a misconfigured env var can otherwise put a live key in a log line.
 */
export function redactStripeSecrets(text: string): string {
  return text.replace(/\b(sk|rk|pk)_(live|test)_[A-Za-z0-9]+/g, '$1_$2_[REDACTED]')
}

export function sstSubscriptionsConfigured(): boolean {
  return Object.values(SST_PLANS).some((p) => Boolean(p.priceId))
}

/**
 * Create a Stripe Checkout Session for an SST Trainer subscription.
 * mode: 'subscription' — isolated from the one-time course checkout above.
 */
export async function createSstSubscriptionCheckoutSession({
  plan,
  clinicCode,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  plan: SstPlan
  clinicCode: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  const price = sstPlanPriceId(plan)
  if (!price) {
    throw new CheckoutUnavailableError('That plan is not available yet.')
  }
  return getStripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    customer_email: customerEmail || undefined,
    success_url: successUrl,
    cancel_url: cancelUrl,
    // NO manual promo field — same reasoning as createCourseCheckoutSession.
    // The field admits every active code in the account, and SCAT6 is a
    // standing $50 code with no expiry. On a $49/mo subscription that is a free
    // month (or more, depending on the coupon's duration) for anyone who has
    // ever received the free-course completion email. A deliberate subscription
    // discount belongs on a coupon attached in the Stripe dashboard.
    billing_address_collection: 'auto',
    // clinicCode is the join key the webhook uses to flip the clinic to
    // 'active' and lift the 3-patient trial cap.
    metadata: {
      product: 'sst-trainer',
      plan,
      clinicCode,
      source: 'portal-dashboard',
      timestamp: new Date().toISOString(),
    },
    subscription_data: {
      metadata: { product: 'sst-trainer', plan, clinicCode, email: customerEmail || '' },
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
