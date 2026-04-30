/**
 * Generate a sample tax invoice locally and write to ~/Desktop so you
 * can review the layout before any goes to a real customer.
 *
 * Defaults to Brandyn (most recent paying customer, A$447 online course
 * on 2026-04-22). Pass --email or --session to target a different one.
 *
 * Run:  npx tsx --env-file=.env.local scripts/generate-sample-invoice.ts
 *       npx tsx --env-file=.env.local scripts/generate-sample-invoice.ts --email contact@peninsulaconcussionclinic.com.au
 */
import 'dotenv/config'
import Stripe from 'stripe'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { generateTaxInvoicePdf, invoiceNumberFromSession } from '../lib/tax-invoice'

const args = process.argv.slice(2)
function arg(name: string): string | undefined {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not set')
  const stripe = new Stripe(stripeKey)

  const explicitSession = arg('session')
  const emailFilter = arg('email') || 'bdchiropractic@hotmail.com' // most recent paid

  let session: Stripe.Checkout.Session | null = null

  if (explicitSession) {
    session = await stripe.checkout.sessions.retrieve(explicitSession)
  } else {
    const cutoffSec = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60
    for await (const s of stripe.checkout.sessions.list({ created: { gte: cutoffSec }, limit: 100 })) {
      if (s.status !== 'complete') continue
      const e = (s.customer_details?.email || s.customer_email || '').toLowerCase()
      if (e === emailFilter.toLowerCase()) {
        session = s
        break
      }
    }
  }

  if (!session) throw new Error(`No paid Stripe session found for ${explicitSession || emailFilter}`)

  const customerName = arg('name') || session.customer_details?.name || '(no name)'
  const customerEmail = session.customer_details?.email || session.customer_email || ''
  const amountCents = session.amount_total || 0
  const currency = (session.currency || 'aud').toUpperCase()
  const courseType = session.metadata?.courseType || ''
  const location = session.metadata?.location || ''
  const productType = session.metadata?.productType

  const description = productType === 'reference-book'
    ? 'Concussion Clinical Mastery — Reference Text + Clinical Toolkit 2026 (256-page digital PDF, lifetime access)'
    : `ConcussionPro — ${courseType || 'Online Course'}${location ? ` (workshop: ${location})` : ''}`

  const issueDate = new Date()
  const invNumber = invoiceNumberFromSession(session.id, new Date((session.created || 0) * 1000))

  const pdf = generateTaxInvoicePdf({
    invoiceNumber: invNumber,
    issueDate,
    buyer: { name: customerName, email: customerEmail },
    lineItems: [{
      description,
      quantity: 1,
      unitPriceCents: amountCents,
      totalCents: amountCents,
    }],
    totalCents: amountCents,
    currency,
    paidAt: new Date((session.created || 0) * 1000),
    paymentReference: session.id,
  })

  const outPath = join(homedir(), 'Desktop', `${invNumber}-sample.pdf`)
  writeFileSync(outPath, pdf)
  console.log(`Wrote ${outPath}`)
  console.log(`  customer: ${customerName} <${customerEmail}>`)
  console.log(`  amount:   ${currency} $${(amountCents / 100).toFixed(2)}`)
  console.log(`  desc:     ${description}`)
  console.log(`  session:  ${session.id}`)
  if (!process.env.BUSINESS_GST_REGISTERED) {
    console.log()
    console.log('ℹ️  BUSINESS_GST_REGISTERED not set — invoice shows "No GST has been charged".')
    console.log('   Set BUSINESS_GST_REGISTERED=true in Vercel env if registered for GST.')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
