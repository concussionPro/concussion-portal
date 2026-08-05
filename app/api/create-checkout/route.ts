import { NextRequest, NextResponse } from 'next/server'
import { createCourseCheckoutSession, CheckoutUnavailableError, VALID_LOCATIONS, VALID_COURSE_TYPES } from '@/lib/stripe'
import type { CourseType } from '@/lib/stripe'
import { verifySessionToken } from '@/lib/jwt-session'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'
import { createCheckoutSchema } from '@/lib/schemas'
import { isBookOwner } from '@/lib/users'
import { isDemoEmail } from '@/lib/demo-session'
import { detectCountry } from '@/lib/geo'
import { CONFIG } from '@/lib/config'

// Bundle owner discount applied automatically to course purchases.
// Sales page promises "$100 off the course" for Reference+Toolkit owners.
const BUNDLE_OWNER_DISCOUNT_AUD = 100

/**
 * POST /api/create-checkout
 *
 * Creates a Stripe Checkout session for course purchases.
 *
 * Body params:
 *   courseType: 'online-only' | 'full-course' | 'workshop-upgrade'
 *   location?: 'sydney' | 'melbourne' | 'byron-bay' (required for full-course and workshop-upgrade)
 *   email?: string (optional, pre-fills checkout — ignored for workshop-upgrade, uses session email)
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
    const { courseType, location, email, preferredCity, promoCode, utm, attribution, clinicianCount, clinicName } = parsed.data

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
    // wiring is visible; refuse the sale until fulfilment exists. (Extra seats
    // ARE sold correctly as a second line item on the clinic-hub-pack base.)
    if (courseType === 'clinic-hub-extra-seat' || courseType === 'clinic-workshop-upgrade') {
      return NextResponse.json(
        { error: 'This add-on is not yet available. Contact zac@concussion-education-australia.com to add seats or workshop places to your Hub Pack.' },
        { status: 400 }
      )
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

    // Detect bundle-owner discount eligibility. Applies to online-only and
    // full-course — NOT workshop-upgrade (already discounted) or
    // international-online (different currency / market).
    let bundleDiscountAud = 0
    if (courseType === 'online-only' || courseType === 'full-course') {
      if (sessionEmail) {
        if (await isBookOwner(sessionEmail)) {
          bundleDiscountAud = BUNDLE_OWNER_DISCOUNT_AUD
        }
      } else if (email) {
        // Unauthenticated buyer supplying an email — honour the discount if
        // the email matches an existing book-owner record. Prevents the
        // awkward case where a bundle owner forgets to log in before buying.
        if (await isBookOwner(email)) {
          bundleDiscountAud = BUNDLE_OWNER_DISCOUNT_AUD
        }
      }
    }

    // Use server-side env var only — origin header is spoofable
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

    // Determine cancel URL based on course type
    let cancelUrl: string
    if (courseType === 'workshop-upgrade') {
      cancelUrl = `${baseUrl}/upgrade?canceled=true`
    } else if (courseType === 'international-online') {
      cancelUrl = `${baseUrl}/pricing-international?canceled=true`
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
      location: (courseType === 'full-course' || courseType === 'workshop-upgrade')
        ? location
        : undefined,
      preferredCity: courseType === 'online-only' ? preferredCity : undefined,
      customerEmail: sessionEmail || email,
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
