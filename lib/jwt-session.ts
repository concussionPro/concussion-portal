// JWT-based session management - No Blob storage needed
import crypto from 'crypto'

// SECURITY: No fallback secrets - must be configured in environment
function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.MAGIC_LINK_SECRET
  if (!secret) {
    throw new Error(
      'CRITICAL: SESSION_SECRET or MAGIC_LINK_SECRET environment variable must be set. ' +
      'Generate a secure secret with: openssl rand -base64 32'
    )
  }
  return secret
}

const SECRET = getSecret()

export interface SessionData {
  userId: string
  email: string
  name: string
  accessLevel: 'online-only' | 'full-course'
  exp: number
}

// Create a signed session token
function createSessionToken(userId: string, email: string, name: string, accessLevel: 'online-only' | 'full-course', expiresInMs: number): string {
  const payload: SessionData = {
    userId,
    email,
    name,
    accessLevel,
    exp: Date.now() + expiresInMs,
  }

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', SECRET)
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
      .createHmac('sha256', SECRET)
      .update(payloadStr)
      .digest('base64url')

    if (signature !== expectedSignature) {
      return null
    }

    // Decode payload
    const payload: SessionData = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString()
    )

    // Check expiration
    if (payload.exp < Date.now()) {
      return null
    }

    return payload
  } catch (error) {
    return null
  }
}

// Create session token with appropriate duration
export function createJWTSession(
  userId: string,
  email: string,
  name: string,
  accessLevel: 'online-only' | 'full-course',
  rememberMe: boolean = false
): string {
  const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
  return createSessionToken(userId, email, name, accessLevel, duration)
}
