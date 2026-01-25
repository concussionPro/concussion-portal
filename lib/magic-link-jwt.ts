// JWT-based magic link authentication - no database lookup needed
import crypto from 'crypto'

// SECURITY: No fallback secrets - must be configured in environment
const SECRET = process.env.MAGIC_LINK_SECRET

if (!SECRET) {
  throw new Error(
    'CRITICAL: MAGIC_LINK_SECRET environment variable must be set. ' +
    'Generate a secure secret with: openssl rand -base64 32'
  )
}

interface TokenPayload {
  userId: string
  email: string
  name: string
  accessLevel: 'online-only' | 'full-course'
  exp: number
}

// Create a signed token
function createToken(userId: string, email: string, name: string, accessLevel: 'online-only' | 'full-course'): string {
  const payload: TokenPayload = {
    userId,
    email,
    name,
    accessLevel,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', SECRET)
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
      .createHmac('sha256', SECRET)
      .update(payloadStr)
      .digest('base64url')

    if (signature !== expectedSignature) {
      return null
    }

    // Decode payload
    const payload: TokenPayload = JSON.parse(
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

// Generate magic link
export function generateMagicLinkJWT(
  userId: string,
  email: string,
  name: string,
  accessLevel: 'online-only' | 'full-course',
  baseUrl: string
): string {
  const token = createToken(userId, email, name, accessLevel)
  return `${baseUrl}/auth/verify?token=${token}`
}

// Verify magic link token
export function verifyMagicTokenJWT(token: string): {
  userId: string;
  email: string;
  name: string;
  accessLevel: 'online-only' | 'full-course'
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
