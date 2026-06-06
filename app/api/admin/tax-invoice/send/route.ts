/**
 * Admin: re-issue a tax invoice via email for a past Stripe payment.
 *
 * Generates the same compliant PDF as the GET sibling, attaches it to a
 * polite "as requested" email, and sends to the customer's payment email.
 *
 * POST /api/admin/tax-invoice/send
 *   body: { session?: string; email?: string; message?: string }
 *     session  — direct Stripe checkout session id (preferred)
 *     email    — looks up the most recent paid session for this email in
 *                the last 90 days; 409 if multiple
 *     message  — optional override for the email body intro
 *
 * Returns: { ok, sentTo, invoiceNumber, sessionId, totalCents }
 *
 * Use cases: customer requests an invoice after the auto-attach window
 * has passed (e.g. they archived the original welcome email and need a
 * fresh copy for their accounts team).
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { getStripe } from '@/lib/stripe'
import { generateTaxInvoicePdf, invoiceNumberFromSession } from '@/lib/tax-invoice'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'

export const runtime = 'nodejs'

interface SessionLite {
  id: string
  email: string
  name: string
  amount: number
  currency: string
  created: number
}

async function listPaidByEmail(stripe: ReturnType<typeof getStripe>, email: string): Promise<SessionLite[]> {
  const out: SessionLite[] = []
  const cutoffSec = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60
  for await (const s of stripe.checkout.sessions.list({ created: { gte: cutoffSec }, limit: 100 })) {
    if (s.status !== 'complete') continue
    if (s.payment_status !== 'paid') continue
    const e = (s.customer_details?.email || s.customer_email || '').toLowerCase()
    if (e !== email.toLowerCase()) continue
    out.push({
      id: s.id,
      email: e,
      name: s.customer_details?.name || '',
      amount: s.amount_total || 0,
      currency: (s.currency || 'aud').toUpperCase(),
      created: (s.created || 0) * 1000,
    })
  }
  return out
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { session?: string; email?: string; message?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.session && !body.email) {
    return NextResponse.json({ error: 'Provide { session: "cs_..." } or { email: "foo@bar" }' }, { status: 400 })
  }

  const stripe = getStripe()
  let resolvedSessionId = body.session ?? null

  if (!resolvedSessionId && body.email) {
    const candidates = await listPaidByEmail(stripe, body.email)
    if (candidates.length === 0) {
      return NextResponse.json({ error: `No paid Stripe sessions found for ${body.email} in the last 90 days.` }, { status: 404 })
    }
    if (candidates.length > 1) {
      return NextResponse.json({
        error: `Multiple paid sessions for ${body.email} — pass { session: "<id>" } to pick one.`,
        candidates: candidates.map((c) => ({
          session: c.id,
          when: new Date(c.created).toISOString(),
          amount: `${c.currency} $${(c.amount / 100).toFixed(2)}`,
        })),
      }, { status: 409 })
    }
    resolvedSessionId = candidates[0].id
  }

  let session
  try {
    session = await stripe.checkout.sessions.retrieve(resolvedSessionId!)
  } catch (err) {
    return NextResponse.json({ error: `Stripe session not found: ${(err as Error).message}` }, { status: 404 })
  }
  if (session.status !== 'complete') {
    return NextResponse.json({ error: 'Session is not complete (not paid).' }, { status: 400 })
  }

  const customerName = session.customer_details?.name || ''
  const customerEmail = session.customer_details?.email || session.customer_email || ''
  if (!customerEmail) {
    return NextResponse.json({ error: 'Stripe session has no customer email — cannot send.' }, { status: 400 })
  }
  const amountCents = session.amount_total || 0
  const currency = (session.currency || 'aud').toUpperCase()
  const productType = session.metadata?.productType
  const courseType = session.metadata?.courseType || ''
  const location = session.metadata?.location || ''
  const paidAt = new Date((session.created || 0) * 1000)

  const description = productType === 'reference-book'
    ? 'Concussion Clinical Mastery — Reference Text + Clinical Toolkit 2026 (256-page digital PDF, lifetime access)'
    : `ConcussionPro — ${courseType || 'Online Course'}${location ? ` (workshop: ${location})` : ''}`

  const issueDate = new Date()
  const invNumber = invoiceNumberFromSession(session.id, paidAt)
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
    paidAt,
    paymentReference: session.id,
  })

  const firstName = (customerName.split(/\s+/)[0] || '').trim() || 'there'
  const amountFmt = `${currency} $${(amountCents / 100).toFixed(2)}`
  const purchaseDateFmt = paidAt.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const intro = body.message
    ? `<p style="margin: 0 0 14px; font-size: 15px; line-height: 1.55; color: #1a2332;">${escapeHtml(body.message)}</p>`
    : `<p style="margin: 0 0 14px; font-size: 15px; line-height: 1.55; color: #1a2332;">Hi ${escapeHtml(firstName)},</p>
       <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.55; color: #1a2332;">As requested — your tax invoice for the purchase made on ${purchaseDateFmt} is attached.</p>`

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0; padding:0; background:#eef2f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#0f172a;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px 12px;">
    <div style="background: #ffffff; border-radius: 18px; padding: 28px 26px; border: 1px solid #e2e8f0;">
      ${intro}
      <table style="width:100%; border-collapse: collapse; font-size: 13.5px; color: #1a2332; margin: 14px 0 18px;">
        <tr><td style="padding: 6px 0; color:#64748b;">Invoice number</td><td style="padding: 6px 0; font-weight: 700; text-align: right;">${escapeHtml(invNumber)}</td></tr>
        <tr><td style="padding: 6px 0; color:#64748b;">Item</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${escapeHtml(description)}</td></tr>
        <tr><td style="padding: 6px 0; color:#64748b;">Amount</td><td style="padding: 6px 0; font-weight: 700; text-align: right;">${escapeHtml(amountFmt)}</td></tr>
        <tr><td style="padding: 6px 0; color:#64748b;">Paid</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(purchaseDateFmt)}</td></tr>
      </table>
      <p style="margin: 0 0 14px; font-size: 14px; line-height: 1.55; color: #475569;">Let me know if anything needs adjusting on the invoice — happy to re-issue with different billing details.</p>
      <p style="margin: 18px 0 4px; font-size: 14px; color: #1a2332;"><strong>Zac Lewis, Osteopath</strong></p>
      <p style="margin: 0; font-size: 13px; color: #64748b;">Founder, Concussion Education Australia</p>
    </div>
  </div>
</body></html>`

  const subject = `Tax invoice ${invNumber} — Concussion Education Australia`
  const ok = await sendEmail({
    to: customerEmail,
    subject,
    html,
    tags: [
      { name: 'type', value: 'tax-invoice-reissue' },
      { name: 'invoice', value: invNumber },
    ],
    attachments: [{ filename: `${invNumber}.pdf`, content: pdf }],
  })

  if (!ok) {
    return NextResponse.json({ error: 'Email send failed (Resend returned false).', invoiceNumber: invNumber, sessionId: session.id }, { status: 500 })
  }

  // Internal admin ping so Zac has a record
  try {
    await sendEmail({
      to: CONFIG.CONTACT_EMAIL,
      subject: `[admin] Tax invoice ${invNumber} re-sent to ${customerEmail}`,
      html: `<p>Re-issued tax invoice for <strong>${escapeHtml(customerName || customerEmail)}</strong>.</p>
        <ul>
          <li>Invoice: <code>${escapeHtml(invNumber)}</code></li>
          <li>Email: ${escapeHtml(customerEmail)}</li>
          <li>Stripe session: <code>${escapeHtml(session.id)}</code></li>
          <li>Amount: ${escapeHtml(amountFmt)} · paid ${escapeHtml(purchaseDateFmt)}</li>
        </ul>`,
      tags: [{ name: 'type', value: 'admin-invoice-resend-notify' }],
    })
  } catch {
    // best-effort — don't fail the main response
  }

  return NextResponse.json({
    ok: true,
    sentTo: customerEmail,
    invoiceNumber: invNumber,
    sessionId: session.id,
    totalCents: amountCents,
  })
}
