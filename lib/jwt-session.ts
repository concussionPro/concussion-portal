// JWT-based session management - No Blob storage needed
import crypto from 'crypto'

// SECURITY: No fallback secrets - must be configured in environment
// Lazy evaluation: only resolve at request time, not at module import (build crashes otherwise)
let _secret: string | null = null
function getSecret(): string {
  if (_secret) return _secret
  const secret = process.env.SESSION_SECRET || process.env.MAGIC_LINK_SECRET
  if (!secret) {
    throw new Error(
      'CRITICAL: SESSION_SECRET or MAGIC_LINK_SECRET environment variable must be set. ' +
      'Generate a secure secret with: openssl rand -base64 32'
    )
  }
  _secret = secret
  return _secret
}

export interface SessionData {
  type: 'session'
  userId: string
  email: string
  name: string
  accessLevel: 'online-only' | 'full-course' | 'preview'
  exp: number
}

// Create a signed session token
function createSessionToken(userId: string, email: string, name: string, accessLevel: 'online-only' | 'full-course' | 'preview', expiresInMs: number): string {
  const payload: SessionData = {
    type: 'session',
    userId,
    email,
    name,
    accessLevel,
    exp: Date.now() + expiresInMs,
  }

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(payloadStr)
    .digest('base64url')

  return `${payloadStr}.${signature}`
}

// Verify and decode session token
export function verifySessionToken(token: string): SessionData | null {
  try {
    const [payloadStr, signature] = token.split('.')

    if (!payloadStr || !signature) {
      return null
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', getSecret())
      .update(payloadStr)
      .digest('base64url')

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null
    }

    // Decode payload
    const payload: SessionData = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString()
    )

    // Reject tokens that aren't session tokens (e.g. magic-link tokens)
    if (payload.type !== 'session') {
      return null
    }

    // Check expiration
    if (payload.exp < Date.now()) {
      return null
    }

    return payload
  } catch (error) {
    return null
  }
}

// Long-lived session: once a user logs in, they stay logged in for a year.
// Was 30 days for rememberMe / 7 days otherwise — too short, paying customers
// were logging out and getting stuck on the magic-link round-trip every
// month. The token is HMAC-signed and httpOnly so leaking it would still
// require XSS, and the auth check stays cheap.
const REMEMBER_ME_DURATION_MS = 365 * 24 * 60 * 60 * 1000
const DEFAULT_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

// Create session token with appropriate duration
export function createJWTSession(
  userId: string,
  email: string,
  name: string,
  accessLevel: 'online-only' | 'full-course' | 'preview',
  rememberMe: boolean = false
): string {
  const duration = rememberMe ? REMEMBER_ME_DURATION_MS : DEFAULT_SESSION_DURATION_MS
  return createSessionToken(userId, email, name, accessLevel, duration)
}
