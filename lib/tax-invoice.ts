/**
 * Australian tax invoice generator.
 *
 * Renders a compliant tax-invoice PDF (ATO requirements for invoices
 * over A$1,000: seller name + ABN, buyer name, invoice date, item
 * description, GST amount if registered, total).
 *
 * Business details come from env vars so they can be set in Vercel
 * without a code change:
 *   BUSINESS_NAME             default: 'Concussion Education Australia'
 *   BUSINESS_ABN              REQUIRED in production — falls back to a
 *                             marked placeholder so the invoice generates
 *                             but it's obviously incomplete
 *   BUSINESS_GST_REGISTERED   'true' if the business is GST-registered.
 *                             When true, prices are treated as GST-inclusive
 *                             and a GST line is shown.
 *   BUSINESS_ADDRESS          default: 'Melbourne, VIC, Australia'
 *   BUSINESS_EMAIL            default: 'zac@concussion-education-australia.com'
 *   BUSINESS_WEBSITE          default: 'portal.concussion-education-australia.com'
 *
 * Returns a Buffer with the PDF bytes.
 */

import { jsPDF } from 'jspdf'

interface InvoiceLineItem {
  description: string
  quantity?: number
  unitPriceCents: number
  totalCents: number
}

export interface InvoiceInput {
  invoiceNumber: string         // e.g. 'INV-2026-0001' or stripe session id slug
  issueDate: Date
  buyer: {
    name: string
    email: string
    address?: string
  }
  lineItems: InvoiceLineItem[]
  totalCents: number
  currency: string              // 'AUD' / 'USD'
  paidAt?: Date
  paymentReference?: string     // stripe session id
}

const ENV_DEFAULTS = {
  name: 'Concussion Education Australia',
  abn: '[ABN — set BUSINESS_ABN env var]',
  gstRegistered: false,
  address: 'Melbourne, VIC, Australia',
  email: 'zac@concussion-education-australia.com',
  website: 'portal.concussion-education-australia.com',
}

function getBusinessDetails() {
  return {
    name: process.env.BUSINESS_NAME || ENV_DEFAULTS.name,
    abn: process.env.BUSINESS_ABN || ENV_DEFAULTS.abn,
    gstRegistered: process.env.BUSINESS_GST_REGISTERED === 'true',
    address: process.env.BUSINESS_ADDRESS || ENV_DEFAULTS.address,
    email: process.env.BUSINESS_EMAIL || ENV_DEFAULTS.email,
    website: process.env.BUSINESS_WEBSITE || ENV_DEFAULTS.website,
  }
}

function formatCents(cents: number, currency: string): string {
  return `${currency.toUpperCase()} $${(cents / 100).toFixed(2)}`
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })
}

/** Generate a tax-invoice PDF as a Buffer. */
export function generateTaxInvoicePdf(input: InvoiceInput): Buffer {
  const biz = getBusinessDetails()
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const PAGE_W = 595
  const MARGIN_X = 50
  const COL_RIGHT = PAGE_W - MARGIN_X

  // ── Header bar ────────────────────────────────────────────────
  doc.setFillColor(13, 148, 136) // teal accent
  doc.rect(0, 0, PAGE_W, 6, 'F')

  // ── Title ──────────────────────────────────────────────────────
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Tax Invoice', MARGIN_X, 60)

  // ── Seller (top right) ─────────────────────────────────────────
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(biz.name, COL_RIGHT, 50, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`ABN: ${biz.abn}`, COL_RIGHT, 65, { align: 'right' })
  doc.text(biz.address, COL_RIGHT, 78, { align: 'right' })
  doc.text(biz.email, COL_RIGHT, 91, { align: 'right' })
  doc.text(biz.website, COL_RIGHT, 104, { align: 'right' })

  // ── Invoice meta block ─────────────────────────────────────────
  let y = 140
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE NUMBER', MARGIN_X, y)
  doc.text('ISSUE DATE', MARGIN_X + 180, y)
  doc.text('BILL TO', MARGIN_X + 320, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  y += 16
  doc.text(input.invoiceNumber, MARGIN_X, y)
  doc.text(formatDate(input.issueDate), MARGIN_X + 180, y)
  doc.text(input.buyer.name || '—', MARGIN_X + 320, y)
  y += 14
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(input.buyer.email, MARGIN_X + 320, y)
  if (input.buyer.address) {
    y += 12
    doc.text(input.buyer.address, MARGIN_X + 320, y)
  }

  // ── Line items table ───────────────────────────────────────────
  y = 230
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(MARGIN_X, y, COL_RIGHT, y)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105)
  y += 18
  doc.text('DESCRIPTION', MARGIN_X, y)
  doc.text('QTY', MARGIN_X + 320, y, { align: 'right' })
  doc.text('AMOUNT', COL_RIGHT, y, { align: 'right' })
  y += 8
  doc.line(MARGIN_X, y, COL_RIGHT, y)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(11)

  for (const item of input.lineItems) {
    y += 22
    // Word-wrap long descriptions
    const lines = doc.splitTextToSize(item.description, 280) as string[]
    doc.text(lines, MARGIN_X, y)
    doc.text(String(item.quantity ?? 1), MARGIN_X + 320, y, { align: 'right' })
    doc.text(formatCents(item.totalCents, input.currency), COL_RIGHT, y, { align: 'right' })
    if (lines.length > 1) y += (lines.length - 1) * 12
  }

  y += 16
  doc.line(MARGIN_X, y, COL_RIGHT, y)

  // ── Totals (GST + total) ───────────────────────────────────────
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  y += 22

  if (biz.gstRegistered) {
    // Prices are GST-inclusive — break out GST = total / 11
    const gstCents = Math.round(input.totalCents / 11)
    const subtotalCents = input.totalCents - gstCents
    doc.text('Subtotal', MARGIN_X + 320, y, { align: 'right' })
    doc.text(formatCents(subtotalCents, input.currency), COL_RIGHT, y, { align: 'right' })
    y += 16
    doc.text('GST (10%)', MARGIN_X + 320, y, { align: 'right' })
    doc.text(formatCents(gstCents, input.currency), COL_RIGHT, y, { align: 'right' })
    y += 16
  } else {
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text('No GST has been charged.', MARGIN_X, y)
    y += 4
    doc.setFontSize(10)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text('Total', MARGIN_X + 320, y, { align: 'right' })
  doc.text(formatCents(input.totalCents, input.currency), COL_RIGHT, y, { align: 'right' })

  // ── Paid / payment ref ─────────────────────────────────────────
  if (input.paidAt) {
    y += 28
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(13, 148, 136)
    doc.text(`PAID — ${formatDate(input.paidAt)}`, COL_RIGHT, y, { align: 'right' })
    if (input.paymentReference) {
      y += 14
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(`Payment reference: ${input.paymentReference}`, COL_RIGHT, y, { align: 'right' })
    }
  }

  // ── Footer ─────────────────────────────────────────────────────
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `${biz.name} · ABN ${biz.abn} · ${biz.email}`,
    PAGE_W / 2,
    810,
    { align: 'center' },
  )
  doc.text(
    'AHPRA-aligned CPD course · Endorsed by Osteopathy Australia',
    PAGE_W / 2,
    822,
    { align: 'center' },
  )

  // jsPDF returns base64 by default — convert to Buffer
  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}

/** Generate an invoice number from a Stripe session id (deterministic). */
export function invoiceNumberFromSession(stripeSessionId: string, issuedAt: Date): string {
  // Format: INV-YYYY-<short hash>
  const year = issuedAt.getFullYear()
  // Stripe session ids look like 'cs_test_a1B2c3D4...' — take last 8 alnum chars
  const tail = stripeSessionId.replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase()
  return `INV-${year}-${tail}`
}
