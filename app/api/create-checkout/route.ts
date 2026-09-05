import { NextRequest, NextResponse } from 'next/server'
import { createCourseCheckoutSession, CheckoutUnavailableError, VALID_LOCATIONS, VALID_COURSE_TYPES } from '@/lib/stripe'
import type { CourseType } from '@/lib/stripe'
import { verifySessionToken } from '@/lib/jwt-session'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'
import { createCheckoutSchema } from '@/lib/schemas'
import { isBookOwner } from '@/lib/users'
import { isDemoEmail } from '@/lib/demo-session'
import { detectCountry, readMarketOverride, shouldForceAudOnlineSku } from '@/lib/geo'
import { CONFIG } from '@/lib/config'
import { hubAddonContact } from '@/lib/hub-addon-contact'
import {
  isCheckoutEmailRequired,
  resolveCheckoutCustomerEmail,
} from '@/lib/checkout-email'

// Bundle owner discount applied automatically to course purchases.
// Single source (CONFIG) — the /pricing cards subtract the SAME number, so the
// price a bundle owner is shown is always the price they are charged.
const BUNDLE_OWNER_DISCOUNT_AUD = CONFIG.COURSE.BUNDLE_OWNER_DISCOUNT_AUD

/**
 * POST /api/create-checkout
 *
 * Creates a Stripe Checkout session for course purchases.
 *
 * Body params:
 *   courseType: 'online-only' | 'full-course' | 'workshop-upgrade' | 'secure-seat' | 'international-online' | 'clinic-hub-pack' | …
 *   location?: workshop city slug (required for full-course, workshop-upgrade, secure-seat)
 *   email?: string — REQUIRED for anonymous CCM seat types (online-only / full-course /
 *     secure-seat / international-online / clinic-hub-pack) when not logged in, so
 *     abandon rescue can email the enrolment link. Soft client field + server enforce.
 *     Ignored for workshop-upgrade (uses session email). Prefills Stripe customer_email.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit({ key: `checkout:${ip}`, limit: 10, windowSec: 60 })
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many checkout attempts. Please wait a minute.' }, { status: 429 })
    }

    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }
    const parsed = createCheckoutSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    let { courseType, location, email, preferredCity, promoCode, utm, attribution, clinicianCount, clinicName } = parsed.data

    // AU market lock: remap international-online → online-only ONLY when the
    // visitor is truly on the AU market (cea_market=au / AU geo). Online is sold
    // worldwide — do NOT force AUD onto intl / NZ / unknown geo. The A$497→US$
    // presentment bug is fixed by adaptive_pricing off on AUD sessions in
    // lib/stripe.ts, not by remapping every overseas checkout.
    const market = readMarketOverride(request.cookies)
    const visitorCountry = detectCountry(request.headers)
    if (shouldForceAudOnlineSku(market, visitorCountry) && courseType === 'international-online') {
      courseType = 'online-only'
    }

    // Defense in depth: schema covers enum already, but keep the guard so a schema
    // drift doesn't accidentally open up new course types without a code review.
    if (!VALID_COURSE_TYPES.includes(courseType)) {
      return NextResponse.json(
        { error: 'Invalid course type.' },
        { status: 400 }
      )
    }

    // Hub Pack add-ons have NO webhook fulfilment yet — nothing bumps the hub's
    // seat cap or registers the workshop attendee on checkout.session.completed,
    // so a charge here would take money and deliver nothing. Schemas stay so the
    // wiring is visible; return a contact CTA (mailto + Cal) until fulfilment
    // exists. (Extra seats ARE sold correctly as a second line item on the
    // clinic-hub-pack base purchase.)
    if (courseType === 'clinic-hub-extra-seat' || courseType === 'clinic-workshop-upgrade') {
      return NextResponse.json(hubAddonContact(courseType), { status: 409 })
    }

    // Workshop upgrade: requires authenticated online-only user + valid location
    let sessionEmail: string | undefined
    if (courseType === 'workshop-upgrade') {
      const sessionCookie = request.cookies.get('session')?.value
      if (!sessionCookie) {
        return NextResponse.json(
          { error: 'You must be logged in to upgrade.' },
          { status: 401 }
        )
      }
      const session = verifySessionToken(sessionCookie)
      if (!session) {
        return NextResponse.json(
          { error: 'Invalid session. Please log in again.' },
          { status: 401 }
        )
      }
      if (session.accessLevel !== 'online-only') {
        return NextResponse.json(
          { error: 'Upgrade is only available for online-only course holders.' },
          { status: 403 }
        )
      }
      if (!location || !VALID_LOCATIONS.includes(location)) {
        return NextResponse.json(
          { error: 'Please select a workshop location.' },
          { status: 400 }
        )
      }
      // Use session email to prevent upgrading a different account
      sessionEmail = session.email
    }

    // Pre-fill the checkout email whenever the visitor is identifiable
    // (logged-in user or email-gated lead with a session cookie). Without it,
    // an abandoned session expires with customer_email null and the
    // checkout.session.expired recovery sequence has nobody to email — most
    // expired sessions in Stripe show exactly that.
    if (courseType !== 'workshop-upgrade' && !sessionEmail) {
      const sessionCookie = request.cookies.get('session')?.value
      if (sessionCookie) {
        const session = verifySessionToken(sessionCookie)
        // Demo viewers (synthetic *.local identity) check out as anonymous
        // buyers — Stripe collects their real email. Never prefill the
        // placeholder address.
        if (session?.email && !isDemoEmail(session.email)) {
          // Prefer the session email over any passed-in email so discounts
          // can't be applied to a different account
          sessionEmail = session.email
        }
      }
    }

    // Require a real email before minting a Stripe session for CCM (and any
    // shared create-checkout path including clinic-hub-pack). Without
    // customer_email, checkout.session.expired rescue has nobody to email —
    // most abandoned sessions in Stripe show exactly that null.
    let customerEmail: string | undefined = sessionEmail || email
    if (isCheckoutEmailRequired(courseType)) {
      const resolved = resolveCheckoutCustomerEmail(sessionEmail, email)
      if (!resolved.ok) {
        return NextResponse.json({ error: resolved.error }, { status: 400 })
      }
      customerEmail = resolved.email
    }

    // Detect bundle-owner discount eligibility. Applies to online-only and
    // full-course — NOT workshop-upgrade (already discounted) or
    // international-online (different currency / market).
    let bundleDiscountAud = 0
    if (courseType === 'online-only' || courseType === 'full-course') {
      // The lookup is an OPTIONAL PRICE ENRICHMENT, so it must never be able
      // to take the checkout down with it. Measured 2026-08-06 with a bogus
      // POSTGRES_URL: isBookOwner() threw, the outer catch turned it into
      // `500 {"error":"Failed to create checkout session. Please try again."}`,
      // and NOBODY COULD BUY ANYTHING while Stripe was perfectly healthy —
      // a total revenue outage caused by a discount check that applies to a
      // handful of buyers. Degrade to "no discount" instead: an over-charged
      // bundle owner is one refundable support ticket; a dead /pricing page is
      // every sale for the duration of the incident. isBookOwner() also runs
      // ensureColumns() (ALTER TABLE users …), so this catch additionally
      // covers a lazy migration failing under lock contention.
      const buyerEmail = customerEmail
      if (buyerEmail) {
        try {
          if (await isBookOwner(buyerEmail)) {
            bundleDiscountAud = BUNDLE_OWNER_DISCOUNT_AUD
          }
        } catch (err) {
          console.error(
            '[create-checkout] bundle-owner lookup failed — proceeding at full price ' +
              '(a bundle owner may be over-charged; refund manually if reported):',
            err,
          )
        }
      }
    }

    // Use server-side env var only — origin header is spoofable
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

    // Determine cancel URL based on course type
    let cancelUrl: string
    if (courseType === 'workshop-upgrade') {
      cancelUrl = `${baseUrl}/upgrade?canceled=true`
    } else if (courseType === 'secure-seat') {
      cancelUrl = `${baseUrl}/pricing?canceled=true`
    } else if (courseType === 'international-online') {
      cancelUrl = `${baseUrl}/pricing-international?canceled=true`
    } else if (courseType === 'clinic-hub-pack') {
      // The Hub Pack is sold ONLY on the prospect portal (/p/<slug>#pricing) —
      // /pricing shows individual seats and never mentions it. Sending a
      // hesitating hub buyer to /pricing was a one-way exit: they land on a
      // page with no A$1,497 tier, no seat picker and no route back to their
      // own portal (the slug is not guessable from there). Bounce them back to
      // the card they were on. utm_campaign carries the slug on every
      // HubPackBuyCard POST; fall back to /pricing if it is absent or unsafe.
      const hubSlug = typeof utm?.utm_campaign === 'string' ? utm.utm_campaign : ''
      cancelUrl = /^[a-z0-9][a-z0-9-]{0,79}$/.test(hubSlug)
        ? `${baseUrl}/p/${hubSlug}?canceled=true#pricing`
        : `${baseUrl}/pricing?canceled=true`
    } else {
      cancelUrl = `${baseUrl}/pricing?canceled=true`
    }

    // International pricing currency is derived from the visitor country
    // (cf-ipcountry) SERVER-SIDE — never from client input — so a buyer cannot
    // pick a cheaper currency than their geo. Only affects international-online.
    const country = courseType === 'international-online' ? detectCountry(request.headers) : undefined

    // SOUTH AFRICA HARD COMPLIANCE GATE: HPCSA rules (since 1 Nov 2024) forbid a
    // SA practitioner enrolling in a CPD activity before it is accredited — the
    // fee is non-refundable and there is no retrospective remedy. Block ZA buyers
    // from the CRM/international checkout until the CEU number issues
    // (CONFIG.FEATURES.HPCSA_ACCREDITED). Fail closed. See /hpcsa register-interest.
    if (
      courseType === 'international-online' &&
      country === 'ZA' &&
      !CONFIG.FEATURES.HPCSA_ACCREDITED
    ) {
      return NextResponse.json(
        {
          error:
            'Not yet available in South Africa. This course is pending HPCSA CEU accreditation — HPCSA rules prevent enrolment before accreditation is granted. Register your interest and we will notify you the day it opens.',
          registerInterest: '/hpcsa',
        },
        { status: 403 }
      )
    }

    // Create Stripe Checkout Session
    const checkoutSession = await createCourseCheckoutSession({
      courseType: courseType as CourseType,
      // Pass the nominated city for every in-person-bearing type (the schema
      // now requires one). clinic-workshop-upgrade is 400-blocked above until
      // its webhook fulfilment exists — re-add it here when that unblocks.
      location: (courseType === 'full-course' || courseType === 'workshop-upgrade' || courseType === 'secure-seat')
        ? location
        : undefined,
      preferredCity: courseType === 'online-only' ? preferredCity : undefined,
      customerEmail,
      country,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl,
      promoCode: typeof promoCode === 'string' ? promoCode : undefined,
      utm: utm && typeof utm === 'object' ? utm : undefined,
      attribution: attribution && typeof attribution === 'object' ? attribution : undefined,
      bundleDiscountAud,
      clinicianCount: courseType === 'clinic-hub-pack' ? clinicianCount : undefined,
      clinicName: courseType === 'clinic-hub-pack' ? clinicName : undefined,
    })

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error) {
    // Business-rule rejections (workshop already ran / sold out) carry a
    // buyer-readable message — surface it instead of a generic 500.
    if (error instanceof CheckoutUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('Checkout session creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    )
  }
}
