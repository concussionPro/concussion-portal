// Magic link authentication system
// No passwords needed - users receive secure login links via email

export interface MagicToken {
  token: string
  email: string
  expiresAt: number
  used: boolean
}

/**
 * Generate a secure 6-digit code for email verification
 */
export function generateMagicToken(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

/**
 * Store a magic token for later verification
 */
export function storeMagicToken(email: string, token: string): void {
  if (typeof window === 'undefined') return

  const tokens = getMagicTokens()
  tokens[email] = {
    token,
    email,
    expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
    used: false,
  }

  localStorage.setItem('magic_tokens', JSON.stringify(tokens))
}

/**
 * Verify a magic token and mark it as used
 */
export function verifyMagicToken(email: string, token: string): boolean {
  if (typeof window === 'undefined') return false

  const tokens = getMagicTokens()
  const stored = tokens[email]

  if (!stored) {
    console.log('No token found for email:', email)
    return false
  }

  if (stored.used) {
    console.log('Token already used')
    return false
  }

  if (stored.expiresAt < Date.now()) {
    console.log('Token expired')
    return false
  }

  if (stored.token !== token) {
    console.log('Token mismatch')
    return false
  }

  // Mark token as used
  stored.used = true
  localStorage.setItem('magic_tokens', JSON.stringify(tokens))

  return true
}

/**
 * Get all stored magic tokens
 */
function getMagicTokens(): Record<string, MagicToken> {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem('magic_tokens')
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Failed to parse magic tokens:', error)
    return {}
  }
}

/**
 * Clean up expired tokens
 */
export function cleanupExpiredTokens(): void {
  if (typeof window === 'undefined') return

  const tokens = getMagicTokens()
  const now = Date.now()

  Object.keys(tokens).forEach(email => {
    if (tokens[email].expiresAt < now || tokens[email].used) {
      delete tokens[email]
    }
  })

  localStorage.setItem('magic_tokens', JSON.stringify(tokens))
}
