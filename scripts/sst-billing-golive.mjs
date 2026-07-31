/**
 * SST billing go-live — one-shot, idempotent. Run from repo root:
 *   node scripts/sst-billing-golive.mjs
 *
 * Does two things against LIVE Stripe:
 *  1. Ensures an annual price (A$490/yr, "save 2 months") exists on the
 *     SST Single product (A$49/mo price already exists).
 *  2. Adds customer.subscription.updated + .deleted to the main webhook
 *     endpoint — without these a cancelled subscription is never detected
 *     and the clinic keeps full access after churning.
 *
 * Prints the three `vercel env add` commands to finish with.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

const k = process.env.STRIPE_SECRET_KEY
if (!k) { console.error('STRIPE_SECRET_KEY missing'); process.exit(1) }
const H = { Authorization: 'Bearer ' + k, 'Content-Type': 'application/x-www-form-urlencoded' }
const SST_SINGLE = 'prod_UphW0GMeUKz3q3'
const MONTHLY_PRICE = 'price_1Tq27gEEdMQX6vRJppLFRL0x'

// 1) annual price — reuse if one already exists (idempotent re-runs)
const existing = await fetch(`https://api.stripe.com/v1/prices?product=${SST_SINGLE}&limit=10&active=true`, { headers: H }).then(r => r.json())
let annual = existing.data.find(p => p.recurring?.interval === 'year')
if (annual) {
  console.log('Annual price already exists:', annual.id, annual.unit_amount / 100, 'AUD/year')
} else {
  annual = await fetch('https://api.stripe.com/v1/prices', {
    method: 'POST', headers: H,
    body: `product=${SST_SINGLE}&unit_amount=49000&currency=aud&recurring[interval]=year&nickname=${encodeURIComponent('SST Single Annual')}`,
  }).then(r => r.json())
  if (annual.error) { console.error('price error:', annual.error.message); process.exit(1) }
  console.log('Annual price CREATED:', annual.id, annual.unit_amount / 100, 'AUD/year')
}

// 2) webhook endpoint events
const hooks = await fetch('https://api.stripe.com/v1/webhook_endpoints?limit=10', { headers: H }).then(r => r.json())
const ep = hooks.data.find(e => e.url === 'https://portal.concussion-education-australia.com/api/webhooks/stripe')
if (!ep) { console.error('main webhook endpoint not found'); process.exit(1) }
const wanted = ['customer.subscription.updated', 'customer.subscription.deleted']
const missing = wanted.filter(e => !ep.enabled_events.includes(e))
if (!missing.length) {
  console.log('Webhook already subscribed to subscription lifecycle events.')
} else {
  const events = [...ep.enabled_events, ...missing]
  const body = events.map((e, i) => `enabled_events[${i}]=${encodeURIComponent(e)}`).join('&')
  const up = await fetch('https://api.stripe.com/v1/webhook_endpoints/' + ep.id, { method: 'POST', headers: H, body }).then(r => r.json())
  if (up.error) { console.error('webhook error:', up.error.message); process.exit(1) }
  console.log('Webhook events now:', up.enabled_events.join(', '))
}

console.log(`
── Finish with these three (each pipes the value in, no prompts): ──
printf '${MONTHLY_PRICE}' | npx -y vercel env add STRIPE_SST_MONTHLY_PRICE_ID production
printf '${annual.id}' | npx -y vercel env add STRIPE_SST_ANNUAL_PRICE_ID production
printf 'true' | npx -y vercel env add NEXT_PUBLIC_SST_SUBSCRIPTIONS_LIVE production
`)
