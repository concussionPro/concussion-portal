// Magic Link Authentication - Passwordless login system using Vercel Blob
import crypto from 'crypto'
import { put, head } from '@vercel/blob'

export interface MagicToken {
  token: string
  userId: string
  email: string
  expiresAt: string
  used: boolean
}

const TOKENS_BLOB_PATH = 'magic-tokens.json'

// Load all tokens from Blob storage
async function loadTokens(): Promise<MagicToken[]> {
  try {
    // Check if blob exists
    const blobExists = await head(TOKENS_BLOB_PATH).catch(() => null)

    if (!blobExists) {
      return []
    }

    // Fetch the blob content
    const response = await fetch(blobExists.url)
    const tokens = await response.json()
    return tokens
  } catch (error) {
    console.error('Error loading tokens:', error)
    return []
  }
}

// Save tokens to Blob storage
async function saveTokens(tokens: MagicToken[]) {
  try {
    await put(TOKENS_BLOB_PATH, JSON.stringify(tokens, null, 2), {
      access: 'public',
      contentType: 'application/json',
    })
  } catch (error) {
    console.error('Error saving tokens:', error)
    throw error
  }
}

// Generate magic link for user
export async function generateMagicLink(userId: string, email: string, baseUrl: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  const tokens = await loadTokens()

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

  await saveTokens(validTokens)

  return `${baseUrl}/auth/verify?token=${token}`
}

// Verify magic link token
export async function verifyMagicToken(token: string): Promise<{ userId: string; email: string } | null> {
  const tokens = await loadTokens()
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
  await saveTokens(tokens)

  return {
    userId: magicToken.userId,
    email: magicToken.email,
  }
}

// Clean up old tokens (run periodically)
export async function cleanupExpiredTokens() {
  const tokens = await loadTokens()
  const validTokens = tokens.filter(t => new Date(t.expiresAt) > new Date())
  await saveTokens(validTokens)
}
