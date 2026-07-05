/**
 * Clinical Reference Text — product config + Stripe checkout.
 * A$97 one-time (RETIRED as a sellable 2026-07-05; legacy fulfilment only) digital purchase. Delivered via access-gated download route.
 */

import { getStripe } from '@/lib/stripe'

export const BOOK_CONFIG = {
  slug: 'reference-plus-toolkit-2026',
  title: 'Concussion Clinical Mastery — Reference Text + Clinical Toolkit 2026',
  shortTitle: 'Clinical Reference + Toolkit',
  priceAud: 97,
  priceIntlUsd: 67,
  pageCount: 256,
  filename: 'CCM_Complete_Reference_2026.pdf',
  description:
    '256-page clinical reference PLUS the 2026 Clinical Toolkit — cheat sheet, myth-buster, patient handout, PCS + referral flowcharts, RehabFlow, RTP/RTL/RTW ladder, return-to-school plan, employer letter template, email template pack. Aligned with Amsterdam 2023 Consensus and AIS/SMA 2024 Position Statement.',
}

export async function createBookCheckoutSession({
  customerEmail,
  successUrl,
  cancelUrl,
  currency = 'aud',
  utm,
}: {
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  currency?: 'aud' | 'usd'
  utm?: Record<string, string>
}) {
  const stripe = getStripe()
  const unitAmount = (currency === 'usd' ? BOOK_CONFIG.priceIntlUsd : BOOK_CONFIG.priceAud) * 100

  return stripe.checkout.sessions.create({
    mode: 'payment',
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: {
            name: BOOK_CONFIG.title,
            description:
              'Digital PDF · 256 pages · Instant access · Lifetime download · AHPRA-aligned · Endorsed by Osteopathy Australia',
          },
        },
        quantity: 1,
      },
    ],
    customer_email: customerEmail || undefined,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      productType: 'reference-book',
      slug: BOOK_CONFIG.slug,
      currency,
      source: 'portal',
      timestamp: new Date().toISOString(),
      ...(utm?.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm?.utm_medium ? { utm_medium: utm.utm_medium } : {}),
      ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
    },
    payment_intent_data: {
      metadata: {
        email: customerEmail || '',
        productType: 'reference-book',
      },
    },
    billing_address_collection: 'auto',
    allow_promotion_codes: true,
    custom_text: {
      submit: {
        message:
          "You'll receive instant download access after payment, plus a login link for your Concussion Education Australia account where the PDF lives for lifetime access.",
      },
    },
  })
}
