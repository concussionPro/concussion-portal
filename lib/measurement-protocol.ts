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
 */

const GA4_MEASUREMENT_ID = 'G-LRDRZBWJ2E'

export async function trackServerPurchase(
  transactionId: string,
  value: number,
  currency: string,
  email?: string,
) {
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
              item_name: 'ConcussionPro Course',
              quantity: 1,
              price: value,
            },
          ],
          // Enhanced conversions: send plain-text email — GA4 MP hashes it server-side
          ...(email ? { user_data: { email_address: email.trim().toLowerCase() } } : {}),
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
