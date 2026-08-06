import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { unsubscribeUser } from '@/lib/users'

function getUnsubscribeSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.MAGIC_LINK_SECRET || process.env.JWT_SECRET
  if (!secret) throw new Error('SESSION_SECRET or MAGIC_LINK_SECRET must be configured')
  return secret
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Verify HMAC token for unsubscribe link */
function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = crypto
    .createHmac('sha256', getUnsubscribeSecret())
    .update(email.toLowerCase())
    .digest('hex')
  if (token.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

/** Generate HMAC token for unsubscribe link */
export function generateUnsubscribeToken(email: string): string {
  return crypto
    .createHmac('sha256', getUnsubscribeSecret())
    .update(email.toLowerCase())
    .digest('hex')
}

/**
 * POST /api/unsubscribe?email=...&token=...
 * RFC 8058 one-click unsubscribe — email clients (Gmail, Apple Mail, Yahoo) send POST
 * with body "List-Unsubscribe=One-Click"
 *
 * Also handles browser form submission from the GET confirmation page.
 */
export async function POST(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  const token = request.nextUrl.searchParams.get('token')

  if (!email || !token) {
    return NextResponse.json({ error: 'Invalid unsubscribe link' }, { status: 400 })
  }

  try {
    if (!verifyUnsubscribeToken(email, token)) {
      return NextResponse.json({ error: 'Invalid unsubscribe link' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid unsubscribe link' }, { status: 400 })
  }

  const contentType = request.headers.get('content-type') || ''
  const isFormPost = contentType.includes('form')

  // A DB failure here used to escape the handler entirely: the user clicked
  // "Confirm Unsubscribe", got Next's generic 500 page, and had no way to tell
  // whether they were off the list. Unsubs are zero-tolerance — say plainly
  // that it did not go through and give the manual fallback (the error page
  // already carries the reply-to-unsubscribe instruction).
  try {
    await unsubscribeUser(email)
  } catch (err) {
    console.error(`[unsubscribe] failed for ${email.slice(0, 3)}***:`, err)
    if (isFormPost) {
      return new NextResponse(
        unsubscribePage('We could not process your unsubscribe just now.', false),
        { status: 500, headers: { 'Content-Type': 'text/html' } }
      )
    }
    return NextResponse.json({ error: 'Unsubscribe failed — please try again.' }, { status: 500 })
  }

  // If this came from the browser confirmation form, return HTML success page
  if (isFormPost) {
    return new NextResponse(unsubscribePage(email, true), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  return NextResponse.json({ success: true })
}

/**
 * GET /api/unsubscribe?email=...&token=...
 * Browser-based unsubscribe — shows confirmation page with a button.
 * Does NOT auto-unsubscribe (email security scanners like Barracuda/Mimecast prefetch GET links).
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  const token = request.nextUrl.searchParams.get('token')

  if (!email || !token) {
    return new NextResponse(unsubscribePage('Invalid unsubscribe link.', false), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Verify token
  try {
    if (!verifyUnsubscribeToken(email, token)) {
      return new NextResponse(unsubscribePage('Invalid unsubscribe link.', false), {
        headers: { 'Content-Type': 'text/html' },
      })
    }
  } catch {
    return new NextResponse(unsubscribePage('Invalid unsubscribe link.', false), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Show confirmation page — user must click button to actually unsubscribe
  return new NextResponse(unsubscribeConfirmPage(email, token), {
    headers: { 'Content-Type': 'text/html' },
  })
}

/** Confirmation page — asks user to click a button to unsubscribe (POST form) */
function unsubscribeConfirmPage(email: string, token: string): string {
  const safeEmail = escapeHtml(email)
  const safeToken = escapeHtml(token)
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe — Concussion Education Australia</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: white; border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    h1 { font-size: 22px; margin: 0 0 12px; }
    p { color: #64748b; font-size: 15px; line-height: 1.6; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 28px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 16px; }
    .btn:hover { background: #b91c1c; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#9993;</div>
    <h1>Unsubscribe from emails?</h1>
    <p><strong>${safeEmail}</strong> will be removed from our email sequence. You won't receive any more emails in this series.</p>
    <form method="POST" action="/api/unsubscribe?email=${encodeURIComponent(email)}&token=${safeToken}">
      <button type="submit" class="btn">Confirm Unsubscribe</button>
    </form>
    <p style="margin-top: 20px; font-size: 13px;">Changed your mind? Just close this page.</p>
    <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">Concussion Education Australia</p>
  </div>
</body>
</html>`
}

function unsubscribePage(emailOrError: string, success: boolean): string {
  const safeText = escapeHtml(emailOrError)
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Unsubscribed' : 'Error'} — Concussion Education Australia</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: white; border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    h1 { font-size: 22px; margin: 0 0 12px; }
    p { color: #64748b; font-size: 15px; line-height: 1.6; }
    .icon { font-size: 48px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    ${success ? `
      <div class="icon">&#10003;</div>
      <h1>You've been unsubscribed</h1>
      <p><strong>${safeText}</strong> has been removed from our email sequence. You won't receive any more emails in this series.</p>
      <p style="margin-top: 20px; font-size: 13px;">If you change your mind, just sign up again at <a href="https://portal.concussion-education-australia.com" style="color: #0d9488;">our portal</a>.</p>
    ` : `
      <div class="icon">&#9888;</div>
      <h1>Something went wrong</h1>
      <p>${safeText}</p>
      <p style="margin-top: 20px; font-size: 13px;">If you'd like to unsubscribe, please reply to any of our emails with "unsubscribe" and we'll remove you manually.</p>
    `}
    <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">Concussion Education Australia</p>
  </div>
</body>
</html>`
}
