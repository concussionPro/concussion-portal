/**
 * Invoice delivery — the receipt must SURVIVE corporate mail filtering.
 *
 * Post-mortem (Sonya Moore, 2026-08-13): her CCM purchase welcome email was
 * generated WITH the tax-invoice PDF and Resend delivered it (wire-verified:
 * the same payload shape delivers an intact application/pdf part), yet the
 * buyer had no receipt. Two failure modes survive a technically-working
 * attach-to-welcome pipeline:
 *   1. Corporate Exchange (Defender Safe Attachments) delivers the body
 *      immediately and strips/rescans the PDF — sometimes it never returns.
 *   2. The receipt hides behind a welcome subject ("You're in — your course
 *      is ready") that matches nothing a buyer searches for days later.
 *
 * So every paid purchase now gets, IN ADDITION to the welcome attachment:
 *   - a dedicated receipt email, subject "Tax invoice INV-… — Concussion
 *     Education Australia" (searchable, forwardable to an employer), and
 *   - an attachment-proof HTTPS download link (HMAC-signed, no login needed),
 *     so even an attachment-stripping mail gateway can't lose the document.
 *
 * PDF generation failures must never be silent again: alertInvoiceFailure()
 * emails the admin an ACTION-REQUIRED with the session id, which the admin
 * re-issue endpoint (/api/admin/tax-invoice?session=…) can always fulfil.
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

function signingSecret(): string {
  // Reuse the magic-link secret — same trust domain (links minted by us,
  // consumed by the customer's mail client). Fail closed if unset.
  const s = process.env.MAGIC_LINK_SECRET || process.env.SESSION_SECRET
  if (!s) throw new Error('MAGIC_LINK_SECRET/SESSION_SECRET not configured — cannot mint invoice links')
  return s
}

/** HMAC over the Stripe session id. The session id itself is high-entropy,
 *  so sid+sig is unguessable; no expiry — a tax invoice must stay
 *  retrievable at tax time, months after purchase. */
export function invoiceLinkSig(sessionId: string): string {
  return createHmac('sha256', signingSecret()).update(`tax-invoice:${sessionId}`).digest('hex').slice(0, 32)
}

export function verifyInvoiceLinkSig(sessionId: string, sig: string): boolean {
  try {
    const expected = Buffer.from(invoiceLinkSig(sessionId), 'utf8')
    const got = Buffer.from(sig, 'utf8')
    return expected.length === got.length && timingSafeEqual(expected, got)
  } catch {
    return false
  }
}

export function invoiceDownloadUrl(sessionId: string): string {
  return `${BASE_URL}/api/tax-invoice?s=${encodeURIComponent(sessionId)}&sig=${invoiceLinkSig(sessionId)}`
}

/**
 * Dedicated receipt email. Best-effort by contract: callers treat a false
 * return as "alert the admin", never as "fail the purchase".
 */
export async function sendTaxInvoiceEmail(opts: {
  email: string
  name: string
  sessionId: string
  invoiceNumber: string
  amountCents: number
  currency: string
  description: string
  pdf?: Buffer
}): Promise<boolean> {
  const firstName = escapeHtml((opts.name || 'there').split(' ')[0])
  const amount = `${escapeHtml(opts.currency.toUpperCase())} $${(opts.amountCents / 100).toFixed(2)}`
  const dl = invoiceDownloadUrl(opts.sessionId)
  const abn = process.env.BUSINESS_ABN || '74 688 155 508'

  return sendEmail({
    to: opts.email,
    subject: `Tax invoice ${opts.invoiceNumber} — Concussion Education Australia`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1e293b;">
        <div style="height: 4px; background: linear-gradient(90deg, #0d9488, #0ea5e9); border-radius: 2px; margin-bottom: 24px;"></div>
        <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f172a;">Your tax invoice, ${firstName}</h2>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin: 16px 0; font-size: 14px;">
          <strong>${escapeHtml(opts.invoiceNumber)}</strong><br>
          ${escapeHtml(opts.description)}<br>
          Amount paid: <strong>${amount}</strong><br>
          ABN ${escapeHtml(abn)} · Payment ref: <code style="font-size: 11px;">${escapeHtml(opts.sessionId)}</code>
        </div>
        ${opts.pdf ? '<p style="font-size: 14px;">The PDF is attached to this email.</p>' : ''}
        <p style="font-size: 14px;">Some workplace mail systems remove attachments — you can always download your invoice directly:</p>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${dl}" style="display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Download tax invoice (PDF)</a>
        </p>
        <p style="font-size: 13px; color: #475569;">Forward this email straight to your employer or accountant for reimbursement. Any questions, just hit reply.</p>
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">Zac Lewis<br>Concussion Education Australia</div>
      </div>
    `,
    tags: [{ name: 'type', value: 'tax-invoice' }],
    ...(opts.pdf ? { attachments: [{ filename: `${opts.invoiceNumber}.pdf`, content: opts.pdf }] } : {}),
  })
}

/**
 * A paying customer's invoice failed to generate or send. This was a silent
 * console.error until 2026-08-13 — the buyer found out before we did.
 */
export async function alertInvoiceFailure(
  context: string,
  customerEmail: string,
  sessionId: string,
  err: unknown,
): Promise<void> {
  try {
    await sendEmail({
      to: CONFIG.CONTACT_EMAIL,
      subject: `ACTION REQUIRED: tax invoice failed (${context})`,
      html: `<p>A paying customer's tax invoice failed to generate or send.</p>
        <p><strong>Customer:</strong> ${escapeHtml(customerEmail)}<br>
        <strong>Path:</strong> ${escapeHtml(context)}<br>
        <strong>Session:</strong> <code>${escapeHtml(sessionId)}</code></p>
        <p><strong>Error:</strong> ${escapeHtml(err instanceof Error ? err.message : String(err))}</p>
        <p>Re-issue: <code>/api/admin/tax-invoice?session=${escapeHtml(sessionId)}</code></p>`,
    })
  } catch (alertErr) {
    console.error('[invoice] failure alert email also failed:', alertErr)
  }
}
