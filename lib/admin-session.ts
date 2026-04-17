/**
 * Admin session cookie — HMAC-signed, httpOnly.
 *
 * The ADMIN_API_KEY is never sent to the browser. Instead, operators
 * POST the key to /api/admin/login, which sets an opaque signed cookie.
 * All subsequent admin API requests authenticate via that cookie.
 *
 * Header-based auth (x-admin-key / Bearer) is still accepted by middleware
 * for machine-to-machine clients (cron, curl, scripts).
 */

import crypto from 'crypto'

export const ADMIN_COOKIE_NAME = 'admin_session'
const ADMIN_SESSION_TYPE = 'admin'
const DEFAULT_DURATION_MS = 8 * 60 * 60 * 1000 // 8 hours

interface AdminSessionPayload {
  type: typeof ADMIN_SESSION_TYPE
  iat: number
  exp: number
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.MAGIC_LINK_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET or MAGIC_LINK_SECRET must be set to issue admin sessions')
  }
  return secret
}

export function createAdminSessionToken(durationMs: number = DEFAULT_DURATION_MS): string {
  const now = Date.now()
  const payload: AdminSessionPayload = {
    type: ADMIN_SESSION_TYPE,
    iat: now,
    exp: now + durationMs,
  }
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(payloadStr)
    .digest('base64url')
  return `${payloadStr}.${signature}`
}

export function verifyAdminSessionToken(token: string | undefined | null): AdminSessionPayload | null {
  if (!token) return null
  try {
    const [payloadStr, signature] = token.split('.')
    if (!payloadStr || !signature) return null

    const expected = crypto
      .createHmac('sha256', getSecret())
      .update(payloadStr)
      .digest('base64url')

    if (
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return null
    }

    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString()) as AdminSessionPayload
    if (payload.type !== ADMIN_SESSION_TYPE) return null
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DEFAULT_DURATION_MS / 1000,
  }
}
