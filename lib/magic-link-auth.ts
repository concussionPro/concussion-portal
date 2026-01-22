// Magic Link Authentication - Passwordless login system
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

export interface MagicToken {
  token: string
  userId: string
  email: string
  expiresAt: string
  used: boolean
}

const TOKENS_FILE = path.join(process.cwd(), 'data', 'magic-tokens.json')

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load all tokens
function loadTokens(): MagicToken[] {
  try {
    ensureDataDir()
    if (!fs.existsSync(TOKENS_FILE)) {
      fs.writeFileSync(TOKENS_FILE, JSON.stringify([]), 'utf8')
      return []
    }
    const data = fs.readFileSync(TOKENS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading tokens:', error)
    return []
  }
}

// Save tokens
function saveTokens(tokens: MagicToken[]) {
  ensureDataDir()
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf8')
}

// Generate magic link for user
export function generateMagicLink(userId: string, email: string, baseUrl: string): string {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  const tokens = loadTokens()

  // Clean up expired tokens
  const validTokens = tokens.filter(t => new Date(t.expiresAt) > new Date())

  // Add new token
  validTokens.push({
    token,
    userId,
    email,
    expiresAt: expiresAt.toISOString(),
    used: false,
  })

  saveTokens(validTokens)

  return `${baseUrl}/auth/verify?token=${token}`
}

// Verify magic link token
export function verifyMagicToken(token: string): { userId: string; email: string } | null {
  const tokens = loadTokens()
  const magicToken = tokens.find(t => t.token === token)

  if (!magicToken) {
    return null
  }

  // Check if expired
  if (new Date(magicToken.expiresAt) < new Date()) {
    return null
  }

  // Check if already used
  if (magicToken.used) {
    return null
  }

  // Mark as used
  magicToken.used = true
  saveTokens(tokens)

  return {
    userId: magicToken.userId,
    email: magicToken.email,
  }
}

// Clean up old tokens (run periodically)
export function cleanupExpiredTokens() {
  const tokens = loadTokens()
  const validTokens = tokens.filter(t => new Date(t.expiresAt) > new Date())
  saveTokens(validTokens)
}
