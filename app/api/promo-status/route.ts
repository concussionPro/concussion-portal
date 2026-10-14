import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'

/**
 * GET /api/promo-status?code=OA2026
 *
 * Reports whether a Stripe promotion code is redeemable RIGHT NOW, and how
 * much it takes off. One job: let a page show a discounted price only while
 * that price is what the buyer will actually be charged.
 *
 * WHY THIS EXISTS. The OA conference offer is "$100 off, until the early bird
 * closes on 24 Oct". The expiry is set on the Stripe promotion code, not in
 * our config, so Stripe is the single source for whether it is live — the same
 * object the charge is computed from (lib/stripe.ts looks the code up with
 * `promotionCodes.list({ active: true })` before attaching it as a discount).
 * Hardcoding $1,090 in the page would mean that at 00:01 on 25 October, or any
 * time the coupon is paused or exhausted, the page advertises a price the
 * checkout refuses to honour. That is the display-vs-charge drift the pricing
 * doctrine exists to prevent (see workshopPriceFor / upgradePriceFor: display
 * can never drift from what the buyer is charged).
 *
 * So: the page asks, and reverts to full price by itself when the answer is no.
 * No cron, no second place to remember to turn it off.
 *
 * FAILS CLOSED. Stripe unreachable, key missing, code unknown, expired,
 * exhausted or inactive all return { active: false } — the page then shows the
 * undiscounted price, which is always safe to charge. It never reports a
 * discount it has not read off a live, redeemable code.
 *
 * Public and unauthenticated: it reveals only whether a code the buyer was
 * handed on a conference slide is still good, which they would discover by
 * typing it in anyway. Rate-limited so it cannot be used to enumerate codes.
 */

export const dynamic = 'force-dynamic'

type PromoStatus = {
  active: boolean
  /** Whole AUD off the line item, only when active and an AUD amount_off. */
  amountOffAud?: number
}

const INACTIVE: PromoStatus = { active: false }

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = await rateLimit({ key: `promo-status:${ip}`, limit: 30, windowSec: 60 })
  if (!rl.ok) {
    // Fail closed, not loud: the caller treats any non-active answer as
    // "no discount", so a throttled visitor sees full price rather than an error.
    return NextResponse.json(INACTIVE)
  }

  const code = (request.nextUrl.searchParams.get('code') || '').trim().toUpperCase()
  if (!code || code.length > 50 || !/^[A-Z0-9_-]+$/.test(code)) {
    return NextResponse.json(INACTIVE)
  }

  try {
    const stripe = getStripe()
    // `promotion.coupon` is only an id unless expanded, and the amount_off we
    // render lives on the coupon — so expand it rather than make a second call.
    const found = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
      expand: ['data.promotion.coupon'],
    })
    const promo = found.data[0]
    if (!promo) return NextResponse.json(INACTIVE)

    // `active: true` already excludes a code past its expires_at or over its
    // max_redemptions, but check both explicitly: the flag is Stripe's own
    // derived state and we would rather under-report a discount than over-report.
    const nowSec = Math.floor(Date.now() / 1000)
    if (promo.expires_at && promo.expires_at <= nowSec) return NextResponse.json(INACTIVE)
    if (
      typeof promo.max_redemptions === 'number' &&
      promo.times_redeemed >= promo.max_redemptions
    ) {
      return NextResponse.json(INACTIVE)
    }

    // Stripe only reports active: true when the coupon is also valid, but the
    // expanded object is what carries the amount — and it is a bare id string
    // if the expand was dropped. Either way, no object means no number to show.
    const coupon = promo.promotion?.coupon
    if (!coupon || typeof coupon === 'string' || !coupon.valid) {
      return NextResponse.json(INACTIVE)
    }

    // Only a fixed AUD amount_off can be rendered as a price. A percent_off or
    // a foreign-currency coupon is still redeemable at checkout, but this route
    // will not hand a page a number it would have to re-derive — the page keeps
    // showing full price and Stripe applies the discount at the payment step.
    const amountOffAud =
      coupon.amount_off && (coupon.currency ?? 'aud').toLowerCase() === 'aud'
        ? Math.round(coupon.amount_off / 100)
        : undefined

    return NextResponse.json({ active: true, ...(amountOffAud ? { amountOffAud } : {}) })
  } catch {
    return NextResponse.json(INACTIVE)
  }
}
