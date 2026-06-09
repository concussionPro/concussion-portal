/**
 * Admin: generate (or re-generate) a tax invoice PDF for a past Stripe
 * payment. Used both for ad-hoc customer invoice requests and as the
 * generator that the auto-attach-on-purchase flow shares.
 *
 * GET /api/admin/tax-invoice?session=cs_xxx
 *   → PDF download for the matching Stripe Checkout session
 *
 * GET /api/admin/tax-invoice?email=foo@bar.com
 *   → If exactly one paid Stripe session matches this email in the last
 *     90 days, returns the PDF. Otherwise returns the candidate list as
 *     JSON so the operator can pick by session id.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { getStripe } from '@/lib/stripe'
import { generateTaxInvoicePdf, invoiceNumberFromSession } from '@/lib/tax-invoice'

export const runtime = 'nodejs'

interface SessionLite {
  id: string
  email: string
  name: string
  amount: number
  currency: string
  created: number
  paid: boolean
  description: string
}

async function findCheckoutSession(stripe: ReturnType<typeof getStripe>, sessionId: string) {
  const s = await stripe.checkout.sessions.retrieve(sessionId)
  return s
}

async function listPaidByEmail(stripe: ReturnType<typeof getStripe>, email: string): Promise<SessionLite[]> {
  const out: SessionLite[] = []
  const cutoffSec = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60
  for await (const s of stripe.checkout.sessions.list({ created: { gte: cutoffSec }, limit: 100 })) {
    if (s.status !== 'complete') continue
    const e = (s.customer_details?.email || s.customer_email || '').toLowerCase()
    if (e !== email.toLowerCase()) continue
    out.push({
      id: s.id,
      email: e,
      name: s.customer_details?.name || '',
      amount: s.amount_total || 0,
      currency: (s.currency || 'aud').toUpperCase(),
      created: (s.created || 0) * 1000,
      paid: s.payment_status === 'paid',
      description: s.metadata?.courseType
        ? String(s.metadata.courseType) + (s.metadata?.location ? ` — ${s.metadata.location}` : '')
        : (s.metadata?.productType === 'reference-book'
            ? 'Reference Text + Clinical Toolkit'
            : 'Concussion Education Australia purchase'),
    })
  }
  return out
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session')
  const emailQ = url.searchParams.get('email')

  if (!sessionId && !emailQ) {
    return NextResponse.json({ error: 'Provide ?session=cs_... or ?email=foo@bar.com' }, { status: 400 })
  }

  const stripe = getStripe()
  let resolvedSessionId = sessionId

  if (!resolvedSessionId && emailQ) {
    const candidates = await listPaidByEmail(stripe, emailQ)
    if (candidates.length === 0) {
      return NextResponse.json({ error: `No paid Stripe sessions found for ${emailQ} in the last 90 days.` }, { status: 404 })
    }
    if (candidates.length > 1) {
      return NextResponse.json({
        error: `Multiple paid sessions for ${emailQ} — pass ?session=<id> to pick one.`,
        candidates: candidates.map((c) => ({
          session: c.id,
          when: new Date(c.created).toISOString(),
          amount: `${c.currency} $${(c.amount / 100).toFixed(2)}`,
          description: c.description,
        })),
      }, { status: 409 })
    }
    resolvedSessionId = candidates[0].id
  }

  let session
  try {
    session = await findCheckoutSession(stripe, resolvedSessionId!)
  } catch (err) {
    return NextResponse.json({ error: `Stripe session not found: ${(err as Error).message}` }, { status: 404 })
  }
  if (session.status !== 'complete') {
    return NextResponse.json({ error: 'Session is not complete (not paid).' }, { status: 400 })
  }

  const customerName = session.customer_details?.name || ''
  const customerEmail = session.customer_details?.email || session.customer_email || ''
  const amountCents = session.amount_total || 0
  const currency = (session.currency || 'aud').toUpperCase()
  const productType = session.metadata?.productType
  const courseType = session.metadata?.courseType || ''
  const location = session.metadata?.location || ''

  const description = productType === 'reference-book'
    ? 'Concussion Clinical Mastery — Reference Text + Clinical Toolkit 2026 (256-page digital PDF, lifetime access)'
    : `Concussion Education Australia — ${courseType || 'Online Course'}${location ? ` (workshop: ${location})` : ''}`

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

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invNumber}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
