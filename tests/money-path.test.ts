import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * MONEY PATH — what a buyer is actually charged, and what that charge entitles
 * them to.
 *
 * Every assertion here is behavioural: it drives the real checkout builders and
 * inspects the exact params that would go to Stripe. Each block names the defect
 * it locks shut (2026-08-05 money-path crawl).
 */

process.env.STRIPE_SECRET_KEY = 'sk_test_moneypath'
process.env.STRIPE_SST_SINGLE_PRICE_ID = 'price_singleTest'

type CreatedSession = {
  mode: string
  line_items: Array<{ price_data?: { unit_amount?: number; currency?: string }; price?: string; quantity?: number }>
  allow_promotion_codes?: boolean
  discounts?: unknown
  metadata?: Record<string, string>
  success_url?: string
  cancel_url?: string
}

const created: CreatedSession[] = []
/** Promotion codes the fake Stripe account "has". Empty = lookup misses. */
let knownPromotionCodes: string[] = []

// A confirmed, future-dated round (Melbourne Nov 7 2026) makes checkout call
// getEnrollmentCount for the sold-out check — a real DB query. Mock it to an
// open room; capacity behaviour has its own coverage.
vi.mock('@/lib/users', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/users')>()),
  getEnrollmentCount: vi.fn(async () => 0),
}))

vi.mock('stripe', () => {
  class FakeStripe {
    checkout = {
      sessions: {
        create: async (params: CreatedSession) => {
          created.push(params)
          return { id: 'cs_test_moneypath', url: 'https://checkout.stripe.test/session' }
        },
      },
    }
    promotionCodes = {
      list: async ({ code }: { code: string }) =>
        knownPromotionCodes.includes(code) ? { data: [{ id: `promo_${code}` }] } : { data: [] },
    }
  }
  return { default: FakeStripe }
})

const last = () => created[created.length - 1]

beforeEach(() => {
  created.length = 0
  knownPromotionCodes = []
})

const urls = {
  successUrl: 'https://portal.test/checkout/success?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: 'https://portal.test/pricing?canceled=true',
}

describe('Stripe promo field is only opened where a code is redeemable', () => {
  /**
   * SCAT6 ($50) is the free-course completion reward and is ONLINE-ONLY by
   * policy. Stripe's manual promo field cannot be scoped to a product (every
   * line item is an ad-hoc price_data), so opening it on the Complete Course /
   * Hub Pack / international checkout let the buyer simply type SCAT6 in. The
   * pre-existing guard only fired when SCAT6 arrived as a PARAMETER, which the
   * default buy path never sends.
   */
  it('opens the field for the online course (SCAT6 is valid there)', async () => {
    const { createCourseCheckoutSession } = await import('@/lib/stripe')
    await createCourseCheckoutSession({ courseType: 'online-only', ...urls })
    expect(last().allow_promotion_codes).toBe(true)
  })

  it.each(['full-course', 'clinic-hub-pack', 'international-online'] as const)(
    'never opens the field for %s',
    async (courseType) => {
      const { createCourseCheckoutSession } = await import('@/lib/stripe')
      await createCourseCheckoutSession({
        courseType,
        ...(courseType === 'full-course' ? { location: 'sydney' } : {}),
        ...urls,
      })
      expect(last().allow_promotion_codes).toBeFalsy()
      expect(last().discounts).toBeUndefined()
    },
  )

  it('does not open the field when an UNKNOWN code is passed on an ineligible course', async () => {
    const { createCourseCheckoutSession } = await import('@/lib/stripe')
    await createCourseCheckoutSession({
      courseType: 'full-course',
      location: 'sydney',
      promoCode: 'NOTAREALCODE',
      ...urls,
    })
    expect(last().allow_promotion_codes).toBeFalsy()
  })

  it('still auto-applies a genuine targeted promo on any course type', async () => {
    knownPromotionCodes = ['PARTNER10']
    const { createCourseCheckoutSession } = await import('@/lib/stripe')
    await createCourseCheckoutSession({
      courseType: 'full-course',
      location: 'sydney',
      promoCode: 'partner10',
      ...urls,
    })
    expect(last().discounts).toEqual([{ promotion_code: 'promo_PARTNER10' }])
  })

  it('never opens the field on a workshop upgrade (already discounted)', async () => {
    const { createCourseCheckoutSession } = await import('@/lib/stripe')
    await createCourseCheckoutSession({ courseType: 'workshop-upgrade', location: 'melbourne', ...urls })
    expect(last().allow_promotion_codes).toBeFalsy()
  })
})

describe('charged amount == the amount the page derives from CONFIG', () => {
  it.each(['sydney', 'melbourne', 'byron-bay', 'adelaide', 'wa'] as const)(
    'Complete Course in %s charges workshopPriceFor()',
    async (location) => {
      const { createCourseCheckoutSession } = await import('@/lib/stripe')
      const { workshopPriceFor } = await import('@/lib/config')
      await createCourseCheckoutSession({ courseType: 'full-course', location, ...urls })
      expect(last().line_items[0].price_data?.unit_amount).toBe(workshopPriceFor(location) * 100)
      expect(last().line_items[0].price_data?.currency).toBe('aud')
    },
  )

  it.each(['sydney', 'melbourne', 'byron-bay', 'adelaide', 'wa'] as const)(
    'workshop upgrade in %s charges upgradePriceFor()',
    async (location) => {
      const { createCourseCheckoutSession } = await import('@/lib/stripe')
      const { upgradePriceFor } = await import('@/lib/config')
      await createCourseCheckoutSession({ courseType: 'workshop-upgrade', location, ...urls })
      expect(last().line_items[0].price_data?.unit_amount).toBe(upgradePriceFor(location) * 100)
    },
  )

  it('online course charges PRICE_ONLINE', async () => {
    const { createCourseCheckoutSession } = await import('@/lib/stripe')
    const { CONFIG } = await import('@/lib/config')
    await createCourseCheckoutSession({ courseType: 'online-only', ...urls })
    expect(last().line_items[0].price_data?.unit_amount).toBe(CONFIG.COURSE.PRICE_ONLINE * 100)
  })

  it('keeps adaptive_pricing off so AUD and fixed intl currencies are not rewritten', async () => {
    const { createCourseCheckoutSession } = await import('@/lib/stripe')
    await createCourseCheckoutSession({ courseType: 'online-only', ...urls })
    expect(last().adaptive_pricing).toEqual({ enabled: false })
    expect(last().line_items[0].price_data?.currency).toBe('aud')
    await createCourseCheckoutSession({ courseType: 'international-online', country: 'GB', ...urls })
    expect(last().adaptive_pricing).toEqual({ enabled: false })
    expect(last().line_items[0].price_data?.currency).toBe('gbp')
  })

  it('international charges the local-currency price the page displays', async () => {
    const { createCourseCheckoutSession } = await import('@/lib/stripe')
    const { intlPriceForCountry } = await import('@/lib/international-pricing')
    for (const country of ['GB', 'NZ', 'CA', 'DE', 'US', null]) {
      await createCourseCheckoutSession({ courseType: 'international-online', country, ...urls })
      const intl = intlPriceForCountry(country)
      expect(last().line_items[0].price_data?.unit_amount).toBe(intl.unitAmount)
      expect(last().line_items[0].price_data?.currency).toBe(intl.currency)
    }
  })

  it('applies the bundle-owner credit at the CONFIG amount, with a $100 floor', async () => {
    const { createCourseCheckoutSession } = await import('@/lib/stripe')
    const { CONFIG } = await import('@/lib/config')
    await createCourseCheckoutSession({
      courseType: 'online-only',
      bundleDiscountAud: CONFIG.COURSE.BUNDLE_OWNER_DISCOUNT_AUD,
      ...urls,
    })
    expect(last().line_items[0].price_data?.unit_amount).toBe(
      (CONFIG.COURSE.PRICE_ONLINE - CONFIG.COURSE.BUNDLE_OWNER_DISCOUNT_AUD) * 100,
    )
    expect(last().metadata?.bundleDiscountAppliedCents).toBe(
      String(CONFIG.COURSE.BUNDLE_OWNER_DISCOUNT_AUD * 100),
    )
    // A bundle credit must not stack with a typed-in promo code.
    expect(last().allow_promotion_codes).toBe(false)
  })
})

describe('Hub Pack: seats charged for == seats provisioned', () => {
  /**
   * The base price covers CLINIC_HUB_SEATS_INCLUDED clinicians whatever the
   * picker says. Pricing and provisioning computed the headcount independently,
   * so a buyer who dialled the picker below the base still paid the full base
   * and received a key capped at the smaller number.
   */
  it('never provisions fewer seats than the base price bought', async () => {
    const { hubSeatsForDeclaredCount } = await import('@/lib/course-hub')
    const { CONFIG } = await import('@/lib/config')
    for (const declared of [undefined, null, 0, 1, 3, 5]) {
      expect(hubSeatsForDeclaredCount(declared)).toBe(CONFIG.COURSE.CLINIC_HUB_SEATS_INCLUDED)
    }
  })

  it('provisions the declared headcount above the base, clamped to the max', async () => {
    const { hubSeatsForDeclaredCount, HUB_MAX_CLINICIANS } = await import('@/lib/course-hub')
    expect(hubSeatsForDeclaredCount(8)).toBe(8)
    expect(hubSeatsForDeclaredCount(HUB_MAX_CLINICIANS)).toBe(HUB_MAX_CLINICIANS)
    expect(hubSeatsForDeclaredCount(500)).toBe(HUB_MAX_CLINICIANS)
  })

  it('bills exactly the seats above the base, and the total matches the card', async () => {
    const { createCourseCheckoutSession } = await import('@/lib/stripe')
    const { CONFIG } = await import('@/lib/config')
    const { hubSeatsForDeclaredCount } = await import('@/lib/course-hub')

    for (const declared of [3, 5, 8, 12]) {
      await createCourseCheckoutSession({ courseType: 'clinic-hub-pack', clinicianCount: declared, ...urls })
      const seats = hubSeatsForDeclaredCount(declared)
      const extra = seats - CONFIG.COURSE.CLINIC_HUB_SEATS_INCLUDED
      const items = last().line_items
      expect(items[0].price_data?.unit_amount).toBe(CONFIG.COURSE.PRICE_CLINIC_HUB_PACK * 100)
      expect(items.length).toBe(extra > 0 ? 2 : 1)
      const chargedCents = items.reduce(
        (sum, i) => sum + (i.price_data?.unit_amount ?? 0) * (i.quantity ?? 1),
        0,
      )
      // Identical arithmetic to HubPackBuyCard's displayed total.
      const displayedAud =
        CONFIG.COURSE.PRICE_CLINIC_HUB_PACK + extra * CONFIG.COURSE.PRICE_CLINIC_HUB_EXTRA_SEAT
      expect(chargedCents).toBe(displayedAud * 100)
    }
  })
})

describe('SST subscription checkout', () => {
  it('carries the clinicCode the webhook needs on BOTH the session and the subscription', async () => {
    const { createSstSubscriptionCheckoutSession } = await import('@/lib/stripe')
    await createSstSubscriptionCheckoutSession({
      plan: 'starter',
      clinicCode: 'ABC123',
      customerEmail: 'owner@clinic.test',
      successUrl: 'https://portal.test/clinical-testing?subscribed=1',
      cancelUrl: 'https://portal.test/clinical-testing/subscribe',
    })
    const s = last() as CreatedSession & { subscription_data?: { metadata?: Record<string, string> } }
    expect(s.mode).toBe('subscription')
    expect(s.metadata?.product).toBe('sst-trainer')
    expect(s.metadata?.clinicCode).toBe('ABC123')
    // customer.subscription.updated/deleted only ever see the SUBSCRIPTION's
    // metadata — without it, a cancellation could never find the clinic.
    expect(s.subscription_data?.metadata?.product).toBe('sst-trainer')
    expect(s.subscription_data?.metadata?.clinicCode).toBe('ABC123')
  })

  it('refuses to mint a checkout for a tier with no configured Stripe price', async () => {
    const { createSstSubscriptionCheckoutSession, CheckoutUnavailableError } = await import('@/lib/stripe')
    delete process.env.STRIPE_SST_CLINIC_PRICE_ID
    await expect(
      createSstSubscriptionCheckoutSession({
        plan: 'clinic',
        clinicCode: 'ABC123',
        successUrl: 'https://portal.test/x',
        cancelUrl: 'https://portal.test/y',
      }),
    ).rejects.toBeInstanceOf(CheckoutUnavailableError)
  })

  it('treats a malformed price env var as unset rather than sending it to Stripe', async () => {
    const { sstPlanPriceId, isStripePriceId, redactStripeSecrets } = await import('@/lib/stripe')
    expect(isStripePriceId('price_singleTest')).toBe(true)
    expect(isStripePriceId('sk_live_abc123')).toBe(false)
    expect(sstPlanPriceId('starter')).toBe('price_singleTest')
    expect(redactStripeSecrets('No such price: sk_live_abc123')).toBe('No such price: sk_live_[REDACTED]')
  })
})

describe('displayed caseload allowance == the allowance the admission gate enforces', () => {
  it('SST_TIERS caps match TIER_MONTHLY_PATIENT_CAP for every plan', async () => {
    const { SST_TIERS, SST_TRIAL_PATIENT_CAP } = await import('@/lib/config')
    const { TIER_MONTHLY_PATIENT_CAP, TRIAL_PATIENT_CAP } = await import('@/lib/sst-trainer/clinic-registry')
    for (const tier of SST_TIERS) {
      expect(TIER_MONTHLY_PATIENT_CAP[tier.plan]).toBe(tier.monthlyPatientCap)
    }
    // Every enforced key must be a tier we sell, OR a documented LEGACY tier
    // string still present in sst_clinics.tier. A key that is neither is a
    // typo that would resolve to `undefined` → unlimited.
    const LEGACY_TIERS = ['single']
    for (const key of Object.keys(TIER_MONTHLY_PATIENT_CAP)) {
      expect(SST_TIERS.some((t) => t.plan === key) || LEGACY_TIERS.includes(key)).toBe(true)
    }
    // A legacy tier must never resolve to unlimited — that would hand a paid
    // clinic the enterprise allowance for free. 'single' was the tier every
    // pre-2026-08-08 enrolment was provisioned at, so it maps to the rung an
    // enrolment includes.
    const { SST_INCLUDED_TIER } = await import('@/lib/config')
    for (const key of LEGACY_TIERS) {
      expect(TIER_MONTHLY_PATIENT_CAP[key]).toBe(SST_INCLUDED_TIER.monthlyPatientCap)
    }
    expect(TRIAL_PATIENT_CAP).toBe(SST_TRIAL_PATIENT_CAP)
  })
})

describe('every product a checkout can create has webhook fulfilment', () => {
  /**
   * A checkout with no matching webhook branch takes the money and delivers
   * nothing. The two Hub Pack add-ons have no fulfilment, so BOTH entry points
   * that could reach them must refuse the sale outright.
   */
  const UNFULFILLED = ['clinic-hub-extra-seat', 'clinic-workshop-upgrade']

  it('the unfulfilled add-ons are refused (contact CTA, not Stripe) by /api/create-checkout and /pay/[code]', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    for (const file of ['app/api/create-checkout/route.ts', 'app/pay/[code]/route.ts']) {
      const src = readFileSync(join(process.cwd(), file), 'utf8')
      for (const type of UNFULFILLED) {
        expect(src.includes(`courseType === '${type}'`)).toBe(true)
      }
      // Must offer mailto/Cal — never take money without fulfilment.
      expect(src.includes('hubAddonContact')).toBe(true)
    }
  })

  it('/pay/[code] validates its stored course_type before pricing anything', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const src = readFileSync(join(process.cwd(), 'app/pay/[code]/route.ts'), 'utf8')
    // An unrecognised value used to fall through to the Complete Course price.
    expect(src.includes('VALID_COURSE_TYPES.includes(courseType)')).toBe(true)
  })
})

/**
 * REGRESSION (2026-08-05 adversarial round). The promo-field fix closed the
 * leak on createCourseCheckoutSession ONLY. Three other checkout builders set
 * `allow_promotion_codes` on their own, and Stripe's manual field admits every
 * active code in the account — it cannot be scoped to a product when the line
 * item is ad-hoc `price_data`. SCAT6 is a standing $50 code that never expires
 * and is mailed to every free-course completer, so each of these was a live
 * $50 discount on a product it was never valid for.
 */
describe('no OTHER checkout builder opens the manual promo field', () => {
  it('the A$97 reference bundle does not (was A$97 → A$47 with SCAT6)', async () => {
    const { createBookCheckoutSession } = await import('@/lib/book')
    await createBookCheckoutSession({ ...urls })
    expect(last().allow_promotion_codes).toBeUndefined()
  })

  it('the SST subscription does not (was a free month on a $49/mo plan)', async () => {
    const { createSstSubscriptionCheckoutSession } = await import('@/lib/stripe')
    await createSstSubscriptionCheckoutSession({ plan: 'starter', clinicCode: 'ABC123', ...urls })
    expect(last().mode).toBe('subscription')
    expect(last().allow_promotion_codes).toBeUndefined()
  })

  it('a short course does not — not even when an INVALID promo is passed', async () => {
    const { POST } = await import('@/app/api/courses/checkout/route')
    const { NextRequest } = await import('next/server')
    const call = (body: Record<string, unknown>) =>
      POST(
        new NextRequest('https://portal.test/api/courses/checkout', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }),
      )

    const { COURSES, getEffectiveStatus, getEffectivePrice } = await import(
      '@/lib/ai-course/provider-catalogue'
    )
    const sellable = COURSES.find(
      (c) =>
        c.purchasableViaCheckout &&
        getEffectiveStatus(c) === 'live' &&
        getEffectivePrice(c).price !== null,
    )
    if (!sellable) throw new Error('no sellable short course in the catalogue — test is vacuous')

    // The old fallback: an unrecognised code opened the field, and the buyer
    // then typed SCAT6 into it.
    knownPromotionCodes = []
    await call({ courseSlug: sellable.id, email: 'buyer@clinic.com', promoCode: 'NOTAREALCODE' })
    expect(last().allow_promotion_codes).toBeUndefined()
    expect(last().discounts).toBeUndefined()

    // A REAL targeted code still auto-applies — the deliberate path is intact.
    knownPromotionCodes = ['LAUNCH20']
    await call({ courseSlug: sellable.id, email: 'buyer@clinic.com', promoCode: 'LAUNCH20' })
    expect(last().discounts).toEqual([{ promotion_code: 'promo_LAUNCH20' }])
    expect(last().allow_promotion_codes).toBeUndefined()
  })

  // The manual FIELD was closed, but the `promoCode` PARAMETER was still
  // looked up and applied unconditionally — so posting the published,
  // never-expiring CCM-online completion coupon took A$50 off any short
  // course. SCAT6 is online-only by policy and cannot be product-scoped in
  // Stripe (ad-hoc price_data), so the route must refuse it by name.
  it('a short course refuses SCAT6 passed as a PARAMETER, not just in the field', async () => {
    const { POST } = await import('@/app/api/courses/checkout/route')
    const { NextRequest } = await import('next/server')
    const { CONFIG } = await import('@/lib/config')
    const { COURSES, getEffectiveStatus, getEffectivePrice } = await import(
      '@/lib/ai-course/provider-catalogue'
    )
    const sellable = COURSES.find(
      (c) =>
        c.purchasableViaCheckout &&
        getEffectiveStatus(c) === 'live' &&
        getEffectivePrice(c).price !== null,
    )
    if (!sellable) throw new Error('no sellable short course in the catalogue — test is vacuous')

    // SCAT6 is active in the Stripe account — the lookup WOULD find it.
    knownPromotionCodes = [CONFIG.COURSE.PROMO_CODE]
    await POST(
      new NextRequest('https://portal.test/api/courses/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          courseSlug: sellable.id,
          email: 'buyer@clinic.com',
          promoCode: CONFIG.COURSE.PROMO_CODE,
        }),
      }),
    )
    expect(last().discounts).toBeUndefined()
    expect(last().allow_promotion_codes).toBeUndefined()

    // ...and lower-case / padded spellings are the same code.
    await POST(
      new NextRequest('https://portal.test/api/courses/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          courseSlug: sellable.id,
          email: 'buyer@clinic.com',
          promoCode: `  ${CONFIG.COURSE.PROMO_CODE.toLowerCase()} `,
        }),
      }),
    )
    expect(last().discounts).toBeUndefined()
  })
})

describe('the workshop upgrade is always the early-bird difference', () => {
  it('display and charge agree, and neither depends on the city or the date', async () => {
    const { upgradePriceFor, CONFIG } = await import('@/lib/config')
    const expected = CONFIG.COURSE.PRICE_EARLY_BIRD - CONFIG.COURSE.PRICE_ONLINE
    // Every city, live date or not, early bird open or closed.
    for (const slug of ['melbourne', 'sydney', 'byron-bay', 'adelaide', 'wa', null, undefined]) {
      expect(upgradePriceFor(slug)).toBe(expected)
    }
    const { COURSE_PRICING } = await import('@/lib/stripe')
    // The amount the server actually charges must equal the amount shown.
    expect(COURSE_PRICING.WORKSHOP_UPGRADE_EARLY).toBe(expected * 100)
  })

  it('a DIRECT complete-course purchase can still cost the regular price', async () => {
    const { CONFIG } = await import('@/lib/config')
    // $1,400 has to stay a price that is genuinely charged somewhere, or
    // presenting $1,190 as an early bird is a discount off a fiction (ACL).
    expect(CONFIG.COURSE.PRICE_REGULAR).toBeGreaterThan(CONFIG.COURSE.PRICE_EARLY_BIRD)
  })
})
