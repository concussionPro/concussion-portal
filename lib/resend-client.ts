/**
 * Resend Email Client
 * Handles all email sending including magic links and nurture sequences
 */

import { Resend } from 'resend'
import { isSafeRelativePath } from './safe-redirect'

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


/**
 * PLAIN-TEXT ALTERNATIVE, derived from the HTML.
 *
 * WHY EVERY SEND NEEDS ONE. An HTML-only email is a multipart/alternative with
 * one part, and spam filters treat that as a signal in its own right —
 * legitimate bulk senders send both, and a message with no text part looks like
 * something assembled by a tool that did not care. It also renders as a blank
 * or garbled message in text-only clients, on some watch previews, and in the
 * inbox preview line, which is the first thing a recipient reads.
 *
 * Nothing in this codebase was passing `text`, so every email the system has
 * ever sent has been HTML-only. That is free deliverability left on the table:
 * it costs nothing per send and it is one of the few levers that does not
 * depend on DNS or on warming.
 *
 * Deliberately simple. It is not a Markdown renderer — it keeps the reading
 * order, turns links into "label (url)" so the destination survives, and drops
 * everything else. A text part that is merely FAITHFUL beats a clever one.
 */
export function htmlToText(html: string): string {
  return html
    // Anchors first, so the href survives the tag strip.
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
      const text = String(label).replace(/<[^>]+>/g, '').trim()
      // A bare URL as its own label reads as duplication in text.
      return text && text !== href ? `${text} (${href})` : href
    })
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/(p|div|tr|h[1-6]|li|table|center)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n').map((l) => l.trim()).join('\n')
    .trim()
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  tags?: Array<{ name: string; value: string }>
  headers?: Record<string, string>
  /** ISO 8601 datetime — Resend holds the send and dispatches at this time.
   *  Used by cron loops to stagger batches and protect sender reputation. */
  scheduledAt?: string
  /** Optional file attachments — used for tax invoice PDFs on real purchases.
   *  Buffer content is automatically base64-encoded before send because the
   *  Resend Node SDK JSON.stringify-serialises the payload, which turns a
   *  raw Buffer into `{ type: 'Buffer', data: [bytes] }` — Resend's REST
   *  API silently drops attachments in that form. Pre-encoding to base64
   *  string is what their API expects. */
  attachments?: Array<{ filename: string; content: Buffer | string }>
  /** Plain-text alternative. Omit and one is derived from `html` — see
   *  htmlToText below for why every send must carry one. */
  text?: string
}

/**
 * Infer a `sequence` tag from the subject line so every send gets
 * categorised in /admin/email-analytics, even when the call site forgot
 * to pass tags. Resend tags are server-side metadata — they don't touch
 * the email content, so there's no deliverability cost.
 *
 * Keep slugs short, kebab-case, and stable so the analytics dashboard
 * keeps a clean per-sequence breakdown over time.
 */
function inferSequenceFromSubject(subject: string | undefined): string {
  if (!subject) return 'untagged-other'
  const s = subject.toLowerCase()
  // Transactional + auth
  if (s.includes('login link') || s.includes('your link')) return 'magic-link'
  if (s.includes("you're in") || s.includes('welcome to concussionpro')) return 'purchase-welcome'
  if (s.includes('verify')) return 'verify-email'
  if (s.includes('reset') && s.includes('password')) return 'password-reset'
  // Certificate + receipts
  if (s.includes('certificate')) return 'certificate'
  if (s.includes('tax invoice') || s.includes('your invoice')) return 'tax-invoice'
  // Re-engagement cluster
  if (s.includes('where did you get up to') || s.includes('modules are waiting') || s.includes("clinicians say changes")) return 'reengagement'
  if (s.includes('module 1') || s.includes('opened module') || s.includes('start with module')) return 'onboarding-nudge'
  if (s.includes('know a colleague')) return 'referral-nudge'
  if (s.includes('earned it') || s.includes('$50 off') || s.includes('discount')) return 'discount-reward'
  // Cold outreach + samples
  if (s.startsWith('[sample')) return 'cold-outreach-sample'
  if (s.includes('clear this patient') || s.includes('positioned to manage concussion')) return 'cold-outreach'
  if (s.includes('outreach') || s.includes('checking in')) return 'cold-outreach'
  // CPD + course value
  if (s.includes('cpd options') || s.includes('final summary')) return 'cpd-options-recap'
  if (s.includes('cpd hours') || s.includes('cpd points') || s.includes('full breakdown')) return 'cpd-breakdown'
  // Workshop cluster
  if (s.includes('workshop') && s.includes('byron')) return 'byron-workshop'
  if (s.includes('workshop') && s.includes('melbourne')) return 'melbourne-workshop'
  if (s.includes('one week away') || (s.includes('workshop') && s.includes('prepare'))) return 'workshop-prep'
  if (s.includes('early bird')) return 'early-bird'
  // Operational + admin
  if (s.includes('hot lead') || s.includes('morning briefing') || s.includes('cea daily') || s.includes('item to note')) return 'admin-digest'
  // Other products
  if (s.includes('preseason')) return 'preseason'
  if (s.includes('scat')) return 'scat-resource'
  if (s.includes('ready to train') || s.includes('ready-to-train')) return 'ready-to-train'
  if (s.includes('inbound') || s.includes('reply notification')) return 'inbound-reply'
  if (s.includes('reminder')) return 'reminder'
  if (s.includes('ai in clinical practice') || s.includes('ai course')) return 'ai-course'
  if (s.includes('hub pack') || s.includes('concussion hub')) return 'concussion-hub'
  if (s.includes('register your interest') || s.includes('interest registered')) return 'interest-registration'
  if (s.includes('thanks for') || s.includes('thank you for')) return 'thank-you'
  return 'untagged-other'
}

/**
 * Ensure the tags array contains a `sequence` entry. If the caller already
 * supplied one, leave it alone. Otherwise infer from the subject line.
 */
function ensureSequenceTag(
  tags: Array<{ name: string; value: string }> | undefined,
  subject: string,
): Array<{ name: string; value: string }> {
  const arr = Array.isArray(tags) ? [...tags] : []
  if (arr.some((t) => t.name === 'sequence')) return arr
  arr.push({ name: 'sequence', value: inferSequenceFromSubject(subject) })
  return arr
}

/**
 * Normalise attachments so Buffer.content becomes a base64 string.
 * Pass-through if content is already a string (assumed base64 by caller).
 */
function encodeAttachments(
  atts: Array<{ filename: string; content: Buffer | string }> | undefined,
): Array<{ filename: string; content: string }> | undefined {
  if (!atts || atts.length === 0) return undefined
  return atts.map((a) => ({
    filename: a.filename,
    content: typeof a.content === 'string' ? a.content : a.content.toString('base64'),
  }))
}

/**
 * What the console-only path should REPORT to the caller.
 *
 * In dev/test "logged instead of sent" is the intended behaviour, so `true`
 * (success) is honest. In PRODUCTION a null client means RESEND_API_KEY is
 * missing or still the placeholder — nothing was sent, and returning `true`
 * made every caller's success check lie: /api/send-magic-link answers
 * "check your email", /api/sst/start answers "your clinic code is on its way",
 * the certificate route answers "emailed successfully", and the ONE warning is
 * a single console.warn at cold start. One wrong Vercel env var silently turns
 * the whole email system into a no-op reporting 100% success (2026-08-06
 * degradation audit). Report the truth so the ~35 call sites that DO check the
 * boolean surface a real error, and the honest "we couldn't email you"
 * fallbacks they already contain actually run.
 */
function unconfiguredSendResult(options: EmailOptions): boolean {
  if (process.env.NODE_ENV === 'production' && !getResend()) {
    console.error(
      '[resend] RESEND_API_KEY is missing or a placeholder in PRODUCTION — nothing was sent. ' +
        `Dropped: "${options.subject}" to ${redactEmail(options.to)}`,
    )
    return false
  }
  return true
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
    return unconfiguredSendResult(options)
  }

  try {
    const encodedAttachments = encodeAttachments(options.attachments)
    const normalisedTags = ensureSequenceTag(options.tags, options.subject)
    const result = await getResend()!.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      replyTo: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      // Never HTML-only — see htmlToText.
      text: options.text ?? htmlToText(options.html),
      tags: normalisedTags,
      headers: options.headers,
      ...(options.scheduledAt ? { scheduledAt: options.scheduledAt } : {}),
      ...(encodedAttachments ? { attachments: encodedAttachments } : {}),
    })

    if (result.data) {
      console.log('Email sent via Resend:', result.data.id, options.scheduledAt ? `(scheduled ${options.scheduledAt})` : '')
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
export async function sendEmailWithAttachment(options: EmailOptions & { attachments: Array<{ filename: string; content: Buffer | string }> }): Promise<boolean> {
  if (!getResend() || process.env.NODE_ENV === 'development') {
    console.log('Email (with attachment) would be sent:', {
      to: redactEmail(options.to),
      subject: options.subject,
      attachments: options.attachments.map(a => a.filename),
    })
    return unconfiguredSendResult(options)
  }

  try {
    const encodedAttachments = encodeAttachments(options.attachments)!
    const normalisedTags = ensureSequenceTag(options.tags, options.subject)
    const result = await getResend()!.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      replyTo: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      // Never HTML-only — see htmlToText.
      text: options.text ?? htmlToText(options.html),
      tags: normalisedTags,
      headers: options.headers,
      attachments: encodedAttachments,
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
  accommodationPerkLine?: string
  origin?: string
  /** Optional attachments — used for tax invoice PDF on real purchases. */
  attachments?: Array<{ filename: string; content: Buffer | string }>
  /**
   * Lifetime of the magic link IN HOURS, so the copy matches the token that was
   * actually minted. The purchase webhook mints a 7-day link (NURTURE_TTL_MS)
   * while this template said "24 hours" — understating the window and sending
   * buyers off to request a replacement link they did not need. Defaults to the
   * 24h transactional TTL, which is what the admin resend path uses.
   */
  linkTtlHours?: number
}): Promise<boolean> {
  const baseUrl = opts.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const loginUrl = `${baseUrl}/api/auth/verify?token=${opts.token}&utm_source=email&utm_medium=email&utm_campaign=purchase_welcome`

  const isFullCourse = opts.accessLevel === 'full-course'
  const ttlHours = opts.linkTtlHours && opts.linkTtlHours > 0 ? Math.round(opts.linkTtlHours) : 24
  const linkLifetimeLabel =
    ttlHours >= 48
      ? `${Math.round(ttlHours / 24)} days`
      : `${ttlHours} ${ttlHours === 1 ? 'hour' : 'hours'}`
  const firstName = opts.firstName ? escapeHtml(opts.firstName.split(' ')[0]) : 'there'
  const courseLabel = escapeHtml(opts.courseLabel)
  const amountLine = `${escapeHtml(opts.currency)} $${opts.amount.toFixed(2)}`

  const cityLabel = opts.workshopCity
    ? (opts.workshopCity === 'byron-bay' ? 'Byron Bay' : opts.workshopCity.charAt(0).toUpperCase() + opts.workshopCity.slice(1))
    : ''

  const workshopBlock = (isFullCourse && opts.workshopCity)
    ? (opts.workshopDate
        ? `
    <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 14px 16px; margin: 20px 0;">
      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #c2410c; text-transform: uppercase; letter-spacing: 0.05em;">Your seat is secured</p>
      <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0f172a;">${escapeHtml(cityLabel)} — ${escapeHtml(opts.workshopDate)}</p>
      ${opts.workshopVenue ? `<p style="margin: 2px 0 0; font-size: 13px; color: #475569;">${escapeHtml(opts.workshopVenue)} · 8am–4pm · buffet lunch included, please let us know of any dietary needs</p>` : ''}
      ${opts.accommodationPerkLine ? `<p style="margin: 8px 0 0; font-size: 13px; color: #0f766e; font-weight: 600;">🛏 ${escapeHtml(opts.accommodationPerkLine)}</p>` : ''}
    </div>
  `
        : `
    <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 14px 16px; margin: 20px 0;">
      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #c2410c; text-transform: uppercase; letter-spacing: 0.05em;">Your seat is secured</p>
      <p style="margin: 0 0 6px; font-size: 15px; font-weight: 600; color: #0f172a;">${escapeHtml(cityLabel)} workshop — date to be confirmed</p>
      <p style="margin: 0; font-size: 13px; color: #475569;">Your spot at the ${escapeHtml(cityLabel)} workshop is locked in. We'll confirm the exact date once registrations hit the minimum to run, and you'll get at least 6 weeks' notice before the day.</p>
    </div>
  `)
    : ''

  return sendEmail({
    to: opts.email,
    subject: isFullCourse ? "You're in — welcome to Concussion Education Australia" : "You're in — your course is ready",
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to Concussion Education Australia</title>
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
      <p class="secondary" style="text-align: center;">One-click login — this link expires in ${linkLifetimeLabel}.</p>

      <div class="order">
        <strong>What you bought</strong><br>
        ${courseLabel}${isFullCourse ? '' : ''} · ${amountLine}
      </div>

      ${workshopBlock}

      <div class="next">
        <strong>Where to start</strong> — Module 1 (Concussion neuroscience) takes about 75 minutes. Clinicians who finish it in the first 48 hours are 3× more likely to complete the whole course.
      </div>

      <p style="font-size: 14px; color: #475569;">${opts.attachments && opts.attachments.length > 0 ? 'Your tax invoice is attached to this email — keep it for your CPD / tax records or forward to your employer for reimbursement.' : 'A formal tax invoice will arrive separately from Stripe — keep it for your CPD / tax records.'}</p>
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
    ...(opts.attachments && opts.attachments.length > 0 ? { attachments: opts.attachments } : {}),
  })
}

/**
 * Hub Pack owner welcome — login link PLUS the forwardable team access KEY.
 * The buyer forwards the key (or the redeem link) to their team; the key is
 * seat-capped server-side so it can't grant access beyond the paid team.
 */
export async function sendHubOwnerWelcomeEmail(opts: {
  email: string
  token: string
  firstName: string
  hubKey: string
  clinicianSeats: number
  adminSeats: number
  amount: number
  currency: string
  redeemUrl: string
  origin?: string
  attachments?: Array<{ filename: string; content: Buffer | string }>
}): Promise<boolean> {
  const baseUrl = opts.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const loginUrl = `${baseUrl}/api/auth/verify?token=${opts.token}`
  const firstName = opts.firstName ? escapeHtml(opts.firstName.split(' ')[0]) : 'there'
  const key = escapeHtml(opts.hubKey)
  const redeemUrl = escapeHtml(opts.redeemUrl)
  return sendEmail({
    to: opts.email,
    subject: 'Your clinic access is live — your team key inside',
    tags: [{ name: 'sequence', value: 'hub-welcome' }],
    ...(opts.attachments ? { attachments: opts.attachments } : {}),
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;line-height:1.6;color:#1e293b;background:#f8fafc;margin:0;padding:0">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,.1)">
        <div style="background:#16243f;padding:28px 32px;color:#fff">
          <h1 style="margin:0;font-size:20px">Your clinic access is live</h1>
          <p style="margin:6px 0 0;color:#cbd5e1;font-size:13px">Concussion Clinical Mastery — full clinic team access</p>
        </div>
        <div style="padding:32px">
          <p>Hi ${firstName},</p>
          <p>Thanks for setting up full clinic access. Your own login is one click away:</p>
          <p style="text-align:center;margin:22px 0">
            <a href="${loginUrl}" style="display:inline-block;background:#16243f;color:#fff;font-weight:700;padding:13px 30px;border-radius:10px;text-decoration:none">Open my course</a>
          </p>
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;background:#f8fafc;margin:24px 0">
            <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#64748b;font-weight:700">Your team access key</p>
            <p style="margin:0 0 10px;font-size:22px;font-weight:800;font-family:monospace;letter-spacing:1px;color:#16243f">${key}</p>
            <p style="margin:0;font-size:13px;color:#475569">Forward this to your team, or send them this one-click link:</p>
            <p style="margin:8px 0 0"><a href="${redeemUrl}" style="color:#0f766e;font-weight:700;word-break:break-all">${redeemUrl}</a></p>
          </div>
          <p style="font-size:13px;color:#475569">This key covers <strong>${opts.clinicianSeats} clinician${opts.clinicianSeats === 1 ? '' : 's'} + ${opts.adminSeats} front-desk seats</strong>. Each teammate redeems it once for their own login. It stops working once your seats are used — so it's safe to share inside your clinic, but it won't grant access beyond your team.</p>
          <p style="font-size:13px;color:#94a3b8;margin-top:20px">Your GST tax invoice is attached. Questions? Just reply to this email.</p>
          <p style="font-size:13px;margin-top:16px">— Zac Lewis, Concussion Education Australia</p>
        </div>
      </div>
    </body></html>`,
  })
}

/**
 * Send magic link login email
 */
export async function sendMagicLinkEmail(
  email: string,
  token: string,
  origin?: string,
  /**
   * Where the user was headed before the login bounce (middleware /
   * ProtectedRoute set `?redirect=` on /login). It MUST ride the emailed
   * link — production emails never hit the /auth/verify page, so the
   * localStorage stash on /login is invisible to them and every gated
   * destination was silently dropped onto /dashboard. The server-side
   * allowlist in /api/auth/verify still decides what is honoured.
   */
  redirect?: string | null,
): Promise<boolean> {
  const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const safeRedirect = isSafeRelativePath(redirect) ? redirect : null
  const loginUrl = `${baseUrl}/api/auth/verify?token=${token}${safeRedirect ? `&redirect=${encodeURIComponent(safeRedirect)}` : ''}`

  return sendEmail({
    to: email,
    subject: 'Your Concussion Education Australia Login Link',
    tags: [{ name: 'sequence', value: 'magic-link' }],
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Concussion Education Australia Login</title>
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
              <h1>Concussion Education Australia</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Login to Your Course</h2>
              <p>Click the button below to access your Concussion Education Australia dashboard:</p>

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


