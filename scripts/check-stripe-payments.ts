/**
 * One-off: list completed Stripe checkout sessions + payment intents for the
 * last 7 days so we can reconcile against the webhook-written user count
 * and the /checkout/success pageviews.
 *
 * Run:  npx tsx scripts/check-stripe-payments.ts
 */

import 'dotenv/config'
import Stripe from 'stripe'

const KEY = process.env.STRIPE_SECRET_KEY
if (!KEY) throw new Error('STRIPE_SECRET_KEY not set')

const stripe = new Stripe(KEY)

async function main() {
  const nowSec = Math.floor(Date.now() / 1000)
  const windowHours = Number(process.env.WINDOW_HOURS || 168) // default 7d
  const weekAgoSec = nowSec - windowHours * 60 * 60
  console.log(`Window: last ${windowHours}h`)

  // ── Checkout Sessions ────────────────────────────────────────────
  const sessions: Stripe.Checkout.Session[] = []
  for await (const s of stripe.checkout.sessions.list({
    created: { gte: weekAgoSec },
    limit: 100,
  })) {
    sessions.push(s)
  }

  const complete = sessions.filter((s) => s.status === 'complete')
  const open = sessions.filter((s) => s.status === 'open')
  const expired = sessions.filter((s) => s.status === 'expired')

  console.log('\n═══ Checkout Sessions (last 7 days) ═══')
  console.log(`Total created: ${sessions.length}`)
  console.log(`  complete:    ${complete.length}`)
  console.log(`  open:        ${open.length}`)
  console.log(`  expired:     ${expired.length}`)

  if (complete.length > 0) {
    console.log('\n--- Completed sessions ---')
    for (const s of complete) {
      const createdAt = new Date(s.created * 1000).toISOString()
      const amt = s.amount_total ? (s.amount_total / 100).toFixed(2) : '?'
      const cur = (s.currency || '').toUpperCase()
      const email = s.customer_details?.email || s.customer_email || '(no email)'
      const paid = s.payment_status
      const meta = s.metadata?.productType || s.metadata?.courseType || 'unknown'
      console.log(`  ${createdAt}  ${cur} $${amt.padStart(7)}  ${paid.padEnd(10)} ${meta.padEnd(20)} ${email}`)
    }
  }

  // ── Payment Intents ──────────────────────────────────────────────
  const intents: Stripe.PaymentIntent[] = []
  for await (const pi of stripe.paymentIntents.list({
    created: { gte: weekAgoSec },
    limit: 100,
  })) {
    intents.push(pi)
  }

  const succeeded = intents.filter((p) => p.status === 'succeeded')
  const failed = intents.filter((p) => ['canceled', 'requires_payment_method'].includes(p.status))

  console.log('\n═══ Payment Intents (last 7 days) ═══')
  console.log(`Total: ${intents.length}`)
  console.log(`  succeeded:  ${succeeded.length}`)
  console.log(`  incomplete/failed: ${failed.length}`)

  if (succeeded.length > 0) {
    console.log('\n--- Succeeded payment intents ---')
    for (const p of succeeded) {
      const createdAt = new Date(p.created * 1000).toISOString()
      const amt = (p.amount / 100).toFixed(2)
      const cur = p.currency.toUpperCase()
      const email = (p.metadata?.email as string) || '(no meta email)'
      const type = (p.metadata?.productType as string) || 'unknown'
      console.log(`  ${createdAt}  ${cur} $${amt.padStart(7)}  ${type.padEnd(20)} ${email}`)
    }
  }

  // ── Summary ──────────────────────────────────────────────────────
  console.log('\n═══ Reconciliation ═══')
  console.log(`Stripe-completed sessions this week: ${complete.length}`)
  console.log(`Stripe-succeeded payment intents:    ${succeeded.length}`)
  console.log(`(compare to 2 webhook-written users + 18 /checkout/success views)\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
