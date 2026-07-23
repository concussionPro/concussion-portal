import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createCrmInternationalCheckoutSession } from '@/lib/stripe'
import { CONFIG } from '@/lib/config'
import { detectCountry } from '@/lib/geo'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'

/**
 * POST /api/crm/checkout-international — International CRM (Concussion Rehab
 * Mastery) purchase: online-only, geo-priced, one-time payment.
 *
 * HARD-GATED on CONFIG.FEATURES.CRM_INTERNATIONAL_LIVE. While it's false there is
 * NO live international sale (the landing shows founding-cohort interest capture
 * instead). This route is NOT ESSA-gated and NOT city-gated — overseas EPs can't
 * attend the AU workshop, so there is no nomination.
 *
 * Country (for the local charge currency) is derived SERVER-SIDE from
 * cf-ipcountry — never from client input — so a buyer cannot select a cheaper
 * currency than their geo. Same derivation the /pricing-international display
 * uses, so display and charge always match.
 */
const schema = z.object({
  // Optional — Stripe collects the email on the checkout page when absent. When
  // supplied it pre-fills checkout (and makes abandoned-cart recovery possible).
  email: z.string().trim().toLowerCase().email().max(254).optional(),
  utm: z.record(z.string(), z.string()).optional(),
  attribution: z.record(z.string(), z.string()).optional(),
})

export async function POST(request: NextRequest) {
  // In the barrel until the owner flips the flag — never mint a live
  // international CRM checkout before then.
  if (!CONFIG.FEATURES.CRM_INTERNATIONAL_LIVE) {
    return NextResponse.json(
      { error: 'International enrolment opens soon — register your interest and we’ll notify you the moment it does.' },
      { status: 403 },
    )
  }

  const ip = getClientIp(request)
  const rl = await rateLimit({ key: `crm-intl-checkout:${ip}`, limit: 10, windowSec: 60 })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many checkout attempts. Please wait a minute.' }, { status: 429 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const { email, utm, attribution } = parsed.data

  // Country derived from the request headers (cf-ipcountry) — never trusted from
  // the client. Drives the local charge currency.
  const country = detectCountry(request.headers)

  // SOUTH AFRICA HARD COMPLIANCE GATE: HPCSA rules (since 1 Nov 2024) forbid a
  // SA practitioner enrolling in a CPD activity before it is accredited — the fee
  // is non-refundable with no retrospective remedy. Block ZA buyers until the CEU
  // number issues (CONFIG.FEATURES.HPCSA_ACCREDITED). Fail closed — same gate as
  // /api/create-checkout for the CCM international course.
  if (country === 'ZA' && !CONFIG.FEATURES.HPCSA_ACCREDITED) {
    return NextResponse.json(
      {
        error:
          'Not yet available in South Africa. This course is pending HPCSA CEU accreditation — HPCSA rules prevent enrolment before accreditation is granted. Register your interest and we will notify you the day it opens.',
        registerInterest: '/hpcsa',
      },
      { status: 403 },
    )
  }

  const base = CONFIG.SEO.SITE_URL || 'https://portal.concussion-education-australia.com'
  const successUrl = `${base}/ep-course/dashboard?purchase=success&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${base}/pricing-international?purchase=cancelled`

  try {
    const session = await createCrmInternationalCheckoutSession({
      country,
      customerEmail: email,
      successUrl,
      cancelUrl,
      utm,
      attribution,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[crm-intl-checkout] session create failed:', err)
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 })
  }
}
