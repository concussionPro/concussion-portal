import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/resend-client'

/**
 * POST /api/checkout-link-email — email a buyer their own Stripe checkout link.
 *
 * WHY THIS EXISTS (2026-09-03). A clinician inside St John of God's hospital
 * network created ELEVEN checkout sessions in three minutes because the
 * checkout.stripe.com redirect never rendered for them — hospital egress
 * filtering. The rescue panel now offers "email me the link": they open it on
 * their phone from personal email, off the hospital network, and complete.
 * Side effect that matters: the buyer becomes identifiable, so if they still
 * don't complete, the expired-session recovery sequence knows who to write to.
 *
 * ABUSE CONTROL — this must never become an open relay:
 *   - the only permitted link target is a checkout.stripe.com URL (strictly
 *     validated), so the worst possible abuse is mailing someone a legitimate
 *     CEA checkout page;
 *   - body size capped, one URL, one recipient, no custom text.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body.email !== 'string' || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const email = body.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }
    let url: URL
    try {
      url = new URL(body.url)
    } catch {
      return NextResponse.json({ error: 'Invalid link' }, { status: 400 })
    }
    if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com' || body.url.length > 2048) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 400 })
    }

    const ok = await sendEmail({
      to: email,
      subject: 'Your secure checkout link — Concussion Education Australia',
      html: `
        <p>Here's the secure Stripe checkout you requested:</p>
        <p><a href="${url.href}">Open secure checkout</a></p>
        <p>This link works from any device — if your work network blocks payment
        pages, open it on your phone. It stays valid for about an hour; if it has
        expired, just start checkout again from the pricing page.</p>
        <p>Any questions, reply to this email.</p>
        <p>Zac<br/>Concussion Education Australia</p>
      `,
      text: `Here's the secure Stripe checkout you requested:\n\n${url.href}\n\nThis link works from any device — if your work network blocks payment pages, open it on your phone. It stays valid for about an hour; if it has expired, just start checkout again from the pricing page.\n\nAny questions, reply to this email.\n\nZac\nConcussion Education Australia`,
    })
    if (!ok) return NextResponse.json({ error: 'Could not send — please try again' }, { status: 502 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Could not send — please try again' }, { status: 500 })
  }
}
