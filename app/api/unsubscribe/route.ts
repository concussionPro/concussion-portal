import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { unsubscribeUser } from '@/lib/users'

function getUnsubscribeSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET
  if (!secret) throw new Error('JWT_SECRET or SESSION_SECRET must be configured')
  return secret
}

/** Verify HMAC token for unsubscribe link */
function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = crypto
    .createHmac('sha256', getUnsubscribeSecret())
    .update(email.toLowerCase())
    .digest('hex')
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
 * GET /api/unsubscribe?email=...&token=...
 * One-click unsubscribe from nurture sequence
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

  // Mark user as unsubscribed
  await unsubscribeUser(email)

  return new NextResponse(unsubscribePage(email, true), {
    headers: { 'Content-Type': 'text/html' },
  })
}

function unsubscribePage(emailOrError: string, success: boolean): string {
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
      <p><strong>${emailOrError}</strong> has been removed from our email sequence. You won't receive any more emails in this series.</p>
      <p style="margin-top: 20px; font-size: 13px;">If you change your mind, just sign up again at <a href="https://portal.concussion-education-australia.com" style="color: #0d9488;">our portal</a>.</p>
    ` : `
      <div class="icon">&#9888;</div>
      <h1>Something went wrong</h1>
      <p>${emailOrError}</p>
      <p style="margin-top: 20px; font-size: 13px;">If you'd like to unsubscribe, please reply to any of our emails with "unsubscribe" and we'll remove you manually.</p>
    `}
    <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">Concussion Education Australia</p>
  </div>
</body>
</html>`
}
