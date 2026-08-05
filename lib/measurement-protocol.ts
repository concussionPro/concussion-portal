/**
 * Google Ads server-side conversion tracking via GA4 Measurement Protocol.
 *
 * Fires from the Stripe webhook where there is no browser context.
 * GA4 forwards the purchase event to linked Google Ads conversions.
 *
 * Setup:
 *   1. GA4 Admin → Data Streams → your web stream → Measurement Protocol API secrets → Create
 *   2. Add the secret to your environment as GA4_API_SECRET
 *   3. In Google Ads, import the GA4 "purchase" event as a conversion action
 *
 * Property: ConcussionPro Portal (G-LRDRZBWJ2E)
 * Stream ID: 13917185031
 *
 * GATED on GOOGLE_ADS_ENABLED — the channel is retired, see lib/google-ads.ts.
 */

import { GOOGLE_ADS_ENABLED, GA4_MEASUREMENT_ID } from './google-ads'

export async function trackServerPurchase(
  transactionId: string,
  value: number,
  currency: string,
  email?: string,
) {
  // Google Ads is a RETIRED channel (lib/google-ads.ts). This function exists
  // only to feed an Ads conversion import, and it ships the buyer's hashed
  // address to Google from the Stripe webhook — so it stays off until spend
  // resumes. The sale itself is recorded in Postgres by the caller
  // (purchase_complete in analytics_events); nothing Zac reads depends on this.
  if (!GOOGLE_ADS_ENABLED) return

  const apiSecret = process.env.GA4_API_SECRET
  if (!apiSecret) {
    console.warn('[Measurement Protocol] GA4_API_SECRET not set — skipping server-side purchase tracking')
    return
  }

  const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${apiSecret}`

  // Use a deterministic client_id derived from transactionId for dedup.
  // GA4 deduplicates events with the same client_id + transaction_id — a
  // Date.now() suffix would make every webhook retry a fresh client_id and
  // break dedup, double-counting purchases.
  const clientId = `server_${transactionId.replace('cs_', '').slice(0, 20)}`

  // Hash before the address ever leaves this process. Node's webcrypto is used
  // rather than `crypto.createHash` so this behaves identically if the caller
  // is ever moved to the edge runtime.
  const hashedEmail = email?.trim()
    ? Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(email.trim().toLowerCase()),
          ),
        ),
      )
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    : null

  const body = {
    client_id: clientId,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: transactionId,
          value,
          currency,
          items: [
            {
              // Customer-facing brand. "ConcussionPro" is the internal folder
              // name only and must not appear in anything we send outward.
              item_name: 'Concussion Education Australia Course',
              quantity: 1,
              price: value,
            },
          ],
          // Enhanced conversions, SHA-256 hashed.
          //
          // This previously sent the buyer's PLAIN-TEXT email address to Google
          // from the Stripe webhook. GA4 does hash on receipt, but the address
          // still left our systems in the clear, to a processor the privacy
          // policy did not name, on a channel that has been retired. The
          // browser-side conversion helpers already hash before sending
          // (sha256_email_address); this now matches them, so Google receives a
          // digest it can match against and never the address itself.
          ...(hashedEmail ? { user_data: { sha256_email_address: hashedEmail } } : {}),
        },
      },
    ],
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (response.ok || response.status === 204) {
      console.log(`[Measurement Protocol] Purchase event sent: ${transactionId} — $${value} ${currency}`)
    } else {
      console.error(`[Measurement Protocol] Failed: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('[Measurement Protocol] Error sending purchase event:', error)
  }
}
