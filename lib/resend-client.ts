/**
 * Resend Email Client
 * Handles all email sending including magic links and nurture sequences
 */

import { Resend } from 'resend'
import { CONFIG } from '@/lib/config'

function redactEmail(email: string): string {
  return email.length > 3 ? email.slice(0, 3) + '***' : '***'
}

let _resend: Resend | null | undefined
let _resendWarned = false

/** Lazy-initialised Resend client (avoids top-level env access that breaks builds) */
export function getResend(): Resend | null {
  if (_resend !== undefined) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key || key === 'YOUR_RESEND_API_KEY_HERE') {
    if (!_resendWarned) {
      console.warn('RESEND_API_KEY not configured - emails will be logged to console only')
      _resendWarned = true
    }
    _resend = null
    return null
  }
  _resend = new Resend(key)
  return _resend
}

const FROM_EMAIL = 'zac@concussion-education-australia.com'
const FROM_NAME = 'Concussion Education Australia'

interface EmailOptions {
  to: string
  subject: string
  html: string
  tags?: Array<{ name: string; value: string }>
  headers?: Record<string, string>
}

/**
 * Send email via Resend (or log to console in dev)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Development mode - just log (redact PII)
  if (!getResend() || process.env.NODE_ENV === 'development') {
    console.log('Email would be sent:', {
      to: redactEmail(options.to),
      subject: options.subject,
      tags: options.tags,
    })
    return true
  }

  try {
    const result = await getResend()!.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      replyTo: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      tags: options.tags,
      headers: options.headers,
    })

    if (result.data) {
      console.log('Email sent via Resend:', result.data.id)
      return true
    } else {
      console.error('Resend email error:', result.error)
      return false
    }
  } catch (error) {
    console.error('Resend email error:', error)
    return false
  }
}

/**
 * Send email via Resend with attachment support (or log to console in dev)
 */
export async function sendEmailWithAttachment(options: EmailOptions & { attachments: Array<{ filename: string; content: Buffer }> }): Promise<boolean> {
  if (!getResend() || process.env.NODE_ENV === 'development') {
    console.log('Email (with attachment) would be sent:', {
      to: redactEmail(options.to),
      subject: options.subject,
      attachments: options.attachments.map(a => a.filename),
    })
    return true
  }

  try {
    const result = await getResend()!.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      replyTo: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      tags: options.tags,
      headers: options.headers,
      attachments: options.attachments,
    })

    if (result.data) {
      console.log('Email sent via Resend:', result.data.id)
      return true
    } else {
      console.error('Resend email error:', result.error)
      return false
    }
  } catch (error) {
    console.error('Resend email error:', error)
    return false
  }
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/**
 * Send post-purchase welcome email — a warmer variant of the magic link.
 * Still a one-click login, but with context: what they bought, what to do
 * first, and (for Complete Course) the confirmed workshop details.
 */
export async function sendPostPurchaseLoginEmail(opts: {
  email: string
  token: string
  firstName: string
  courseLabel: string
  accessLevel: 'online-only' | 'full-course' | 'preview'
  amount: number
  currency: string
  workshopCity?: string
  workshopDate?: string
  workshopVenue?: string
  origin?: string
}): Promise<boolean> {
  const baseUrl = opts.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const loginUrl = `${baseUrl}/auth/verify?token=${opts.token}&utm_source=email&utm_medium=email&utm_campaign=purchase_welcome`

  const isFullCourse = opts.accessLevel === 'full-course'
  const firstName = opts.firstName ? escapeHtml(opts.firstName.split(' ')[0]) : 'there'
  const courseLabel = escapeHtml(opts.courseLabel)
  const amountLine = `${escapeHtml(opts.currency)} $${opts.amount.toFixed(2)}`

  const isMelbourne = opts.workshopCity?.toLowerCase() === 'melbourne'
  const melbourneBenefits = CONFIG.VENUE_BENEFITS.MELBOURNE
  const workshopBlock = (isFullCourse && opts.workshopCity && opts.workshopDate) ? `
    <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 14px 16px; margin: 20px 0;">
      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #c2410c; text-transform: uppercase; letter-spacing: 0.05em;">Your workshop</p>
      <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0f172a;">${escapeHtml(opts.workshopCity === 'byron-bay' ? 'Byron Bay' : opts.workshopCity.charAt(0).toUpperCase() + opts.workshopCity.slice(1))} — ${escapeHtml(opts.workshopDate)}</p>
      ${opts.workshopVenue ? `<p style="margin: 2px 0 0; font-size: 13px; color: #475569;">${escapeHtml(opts.workshopVenue)} · 8am–4pm · catered lunch included</p>` : ''}
      ${isMelbourne ? `
        <p style="margin: 10px 0 4px; font-size: 12px; color: #475569;"><strong>Travelling in?</strong> ${melbourneBenefits.accommodationDiscountPct}% off at ${escapeHtml(melbourneBenefits.hotelName)} with code <strong>${escapeHtml(melbourneBenefits.accommodationCode)}</strong>. On-site parking $${melbourneBenefits.parkingConferenceRate}/day or $${melbourneBenefits.parkingOvernightRate}/night for hotel guests. Full logistics email 2 weeks out.</p>
      ` : ''}
    </div>
  ` : ''

  return sendEmail({
    to: opts.email,
    subject: isFullCourse ? "You're in — welcome to ConcussionPro" : "You're in — your course is ready",
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to ConcussionPro</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
  .header-bar { height: 5px; background: linear-gradient(90deg, #0d9488, #0ea5e9); }
  .content { padding: 36px 28px 28px; }
  h2 { margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #0f172a; }
  p { margin: 0 0 14px; font-size: 15px; }
  .button { display: inline-block; padding: 14px 28px; background: #0d9488; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
  .order { background: #f8fafc; border-radius: 10px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #475569; }
  .order strong { color: #0f172a; }
  .next { background: #f0fdfa; border-left: 3px solid #0d9488; border-radius: 6px; padding: 12px 16px; margin: 20px 0; font-size: 14px; }
  .sig { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #475569; }
  .footer { padding: 18px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  .secondary { color: #64748b; font-size: 13px; margin-top: 8px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header-bar"></div>
    <div class="content">
      <h2>Welcome, ${firstName} — you're in.</h2>
      <p>Thanks for backing your clinical practice. Your <strong>${courseLabel}</strong> is live on your account, lifetime access, no deadline.</p>

      <p style="text-align: center; margin: 24px 0;">
        <a href="${loginUrl}" class="button">Access Your Course →</a>
      </p>
      <p class="secondary" style="text-align: center;">One-click login — this link expires in 24 hours.</p>

      <div class="order">
        <strong>What you bought</strong><br>
        ${courseLabel}${isFullCourse ? '' : ''} · ${amountLine}
      </div>

      ${workshopBlock}

      <div class="next">
        <strong>Where to start</strong> — Module 1 (Concussion neuroscience) takes about 75 minutes. Clinicians who finish it in the first 48 hours are 3× more likely to complete the whole course.
      </div>

      <p style="font-size: 14px; color: #475569;">A formal tax invoice will arrive separately from Stripe — keep it for your CPD / tax records.</p>
      <p style="font-size: 14px; color: #475569;">Any questions, just hit reply — I read every message.</p>

      <div class="sig">
        Zac Lewis<br>
        Concussion Education Australia
      </div>
    </div>
    <div class="footer">
      Concussion Education Australia · Melbourne, VIC, Australia<br>
      If you didn't expect this email, you can safely ignore it.
    </div>
  </div>
</body>
</html>`,
    tags: [
      { name: 'type', value: 'purchase-welcome' },
      { name: 'accessLevel', value: opts.accessLevel },
    ],
  })
}

/**
 * Send magic link login email
 */
export async function sendMagicLinkEmail(email: string, token: string, origin?: string): Promise<boolean> {
  const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const loginUrl = `${baseUrl}/auth/verify?token=${token}`

  return sendEmail({
    to: email,
    subject: 'Your ConcussionPro Login Link',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ConcussionPro Login</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #64a8b0 0%, #5b9aa6 100%);
              padding: 32px 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: white;
              font-size: 24px;
              font-weight: 700;
            }
            .content {
              padding: 32px 24px;
            }
            .button {
              display: inline-block;
              padding: 16px 32px;
              background: linear-gradient(135deg, #64a8b0 0%, #5b9aa6 100%);
              color: white;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              margin: 24px 0;
              text-align: center;
            }
            .code {
              background: #f1f5f9;
              padding: 16px;
              border-radius: 8px;
              font-family: 'Courier New', monospace;
              font-size: 24px;
              font-weight: 700;
              letter-spacing: 4px;
              text-align: center;
              color: #5b9aa6;
              margin: 16px 0;
            }
            .footer {
              padding: 24px;
              text-align: center;
              color: #64748b;
              font-size: 14px;
              border-top: 1px solid #e2e8f0;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px 16px;
              border-radius: 4px;
              margin: 16px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ConcussionPro</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Login to Your Course</h2>
              <p>Click the button below to access your ConcussionPro dashboard:</p>

              <center>
                <a href="${loginUrl}&utm_source=email&utm_medium=email&utm_campaign=magic_link" class="button">
                  Access Your Course →
                </a>
              </center>

              <div class="warning" style="margin-top: 24px;">
                This link expires in <strong>24 hours</strong> for security.
              </div>

              <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                If you didn't request this login link, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>Concussion Education Australia &middot; Melbourne, VIC, Australia</p>
              <p>Questions? Reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}


