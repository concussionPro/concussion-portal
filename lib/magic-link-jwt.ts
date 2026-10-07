// JWT-based magic link authentication - no database lookup needed
import crypto from 'crypto'

// SECURITY: Use MAGIC_LINK_SECRET, fallback to SESSION_SECRET
// Lazy evaluation: only resolve at request time, not at module import (build crashes otherwise)
let _secret: string | null = null
function getSecret(): string {
  if (_secret) return _secret
  const secret = process.env.MAGIC_LINK_SECRET || process.env.SESSION_SECRET
  if (!secret) {
    throw new Error(
      'CRITICAL: MAGIC_LINK_SECRET or SESSION_SECRET environment variable must be set. ' +
      'Generate a secure secret with: openssl rand -base64 32'
    )
  }
  _secret = secret
  return _secret
}

interface TokenPayload {
  type: 'magic-link'
  userId: string
  email: string
  name: string
  accessLevel: 'online-only' | 'full-course' | 'preview'
  exp: number
}

// Default TTL for transactional links (request-from-/login, post-purchase
// welcome, admin resend). Tight window for security on user-initiated flows.
const TRANSACTIONAL_TTL_MS = 24 * 60 * 60 * 1000

// Default TTL for nurture / welcome / catch-up emails sent by the cron.
// 7 days because subscribers don't always check email same-day, and a
// 24h-expired link was the dominant failure mode (74% of imported preview
// users never logged in — most landed too late).
export const NURTURE_TTL_MS = 7 * 24 * 60 * 60 * 1000

/**
 * PAID BUYERS — NO EXPIRY (owner decision, 2026-10-06: "do not put a limit to
 * their login").
 *
 * A clinician who has paid should never be locked out of the product they own
 * by a clock. The 24h default was written for a user-initiated /login request,
 * where the person is sitting in front of the inbox — that is still the right
 * window there, and it is unchanged. It was never right for a purchase
 * welcome, a purchase-welcome RESEND (the repair path used precisely when
 * someone already cannot get in), a hub-pack redeem, a Squarespace order or an
 * admin-created account.
 *
 * WHAT STILL BOUNDS THIS TOKEN — it is not a standing key:
 *  - SINGLE USE. The first successful verify writes its hash to
 *    used_magic_tokens and every later presentation is refused. "No expiry"
 *    means the first use can happen whenever they get to it, not that the link
 *    keeps working.
 *  - A scanner prefetch cannot burn it: the GET only serves the confirm
 *    interstitial, and consumption requires the POST.
 *  - It is traded immediately for an httpOnly session cookie.
 *
 * THE RESIDUAL RISK, stated plainly: an unused link in a mailbox is a
 * first-use credential with no time bound, so a forwarded or breached inbox is
 * an account takeover whenever it is read. Rotating MAGIC_LINK_SECRET
 * invalidates every outstanding link at once if that is ever needed.
 *
 * Implemented as a far-future expiry rather than a null/zero sentinel on
 * purpose: the verifier keeps one unconditional expiry comparison, so there is
 * no "expiry disabled" branch for a malformed token to fall into.
 */
export const PAID_TTL_MS = 100 * 365 * 24 * 60 * 60 * 1000

// Create a signed token. ttlMs default = 24h for transactional links.
export function createMagicToken(userId: string, email: string, name: string, accessLevel: 'online-only' | 'full-course' | 'preview', ttlMs?: number): string {
  const payload: TokenPayload = {
    type: 'magic-link',
    userId,
    email,
    name,
    accessLevel,
    exp: Date.now() + (ttlMs ?? TRANSACTIONAL_TTL_MS),
  }

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(payloadStr)
    .digest('base64url')

  return `${payloadStr}.${signature}`
}

// Verify and decode token
function verifyToken(token: string): TokenPayload | null {
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
    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString()
    )

    // Reject tokens that aren't magic-link tokens (e.g. session tokens)
    if (payload.type !== 'magic-link') {
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

// Generate magic link for nurture / welcome / catch-up emails.
// Uses the longer NURTURE_TTL_MS (7 days) — these are pushed by us, the
// recipient hasn't asked for it, so the link needs to survive a few days
// of inbox neglect.
export function generateMagicLinkJWT(
  userId: string,
  email: string,
  name: string,
  accessLevel: 'online-only' | 'full-course' | 'preview',
  baseUrl: string
): string {
  const token = createMagicToken(userId, email, name, accessLevel, NURTURE_TTL_MS)
  return `${baseUrl}/api/auth/verify?token=${token}`
}

// Verify magic link token
export function verifyMagicTokenJWT(token: string): {
  userId: string;
  email: string;
  name: string;
  accessLevel: 'online-only' | 'full-course' | 'preview'
} | null {
  const payload = verifyToken(token)

  if (!payload) {
    return null
  }

  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    accessLevel: payload.accessLevel,
  }
}
