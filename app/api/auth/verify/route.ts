import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { verifyMagicTokenJWT } from '@/lib/magic-link-jwt'
import { updateLastLogin } from '@/lib/users'
import { createJWTSession } from '@/lib/jwt-session'
import { logAuthFailure, logCriticalError } from '@/lib/monitoring'
import { sql } from '@/lib/db'

/** Ensure the used_magic_tokens table exists (runs once per cold start) */
let tableEnsured = false
async function ensureTokenTable() {
  if (tableEnsured) return
  await sql`CREATE TABLE IF NOT EXISTS used_magic_tokens (
    token_hash TEXT PRIMARY KEY,
    used_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`
  tableEnsured = true
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Verify the magic token (contains all user data - no database lookup needed!)
    const tokenData = verifyMagicTokenJWT(token)

    if (!tokenData) {
      // Log failed verification attempts
      await logAuthFailure({
        endpoint: '/api/auth/verify',
        reason: 'Invalid or expired magic link token',
      })

      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Replay protection: hash token and check if already used
    await ensureTokenTable()
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const { rows: existing } = await sql`SELECT 1 FROM used_magic_tokens WHERE token_hash = ${tokenHash} LIMIT 1`
    if (existing.length > 0) {
      await logAuthFailure({
        endpoint: '/api/auth/verify',
        reason: 'Magic link already used (replay attempt)',
      })
      return NextResponse.json(
        { error: 'This login link has already been used. Please request a new one.' },
        { status: 401 }
      )
    }

    // Update last login (non-critical, async fire-and-forget)
    updateLastLogin(tokenData.userId).catch(err =>
      console.error('Failed to update last login:', err)
    )

    // Always use long-lived sessions — magic links are ephemeral anyway
    const rememberMe = true

    // Create JWT session token (no Blob storage needed - instant!)
    const sessionToken = createJWTSession(
      tokenData.userId,
      tokenData.email,
      tokenData.name,
      tokenData.accessLevel,
      rememberMe
    )

    // Mark token as used (replay protection)
    await sql`INSERT INTO used_magic_tokens (token_hash) VALUES (${tokenHash}) ON CONFLICT DO NOTHING`
    // Prune tokens older than 24h (non-blocking best-effort)
    sql`DELETE FROM used_magic_tokens WHERE used_at < now() - interval '24 hours'`.catch(() => {})

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: tokenData.userId,
        email: tokenData.email,
        name: tokenData.name,
        accessLevel: tokenData.accessLevel,
      },
    })

    // Set httpOnly cookie for security
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60 // 30 days or 7 days

    // SECURITY: Always use secure cookies (even in dev with warning)
    const isProduction = process.env.NODE_ENV === 'production'
    if (!isProduction) {
      console.warn('Development mode: Session cookie secure flag disabled. Use HTTPS in production.')
    }

    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax', // SECURITY: Use 'lax' for magic link compatibility while maintaining CSRF protection
      maxAge,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Verification error:', error)

    // Log critical verification errors
    if (error instanceof Error) {
      await logCriticalError(error, {
        endpoint: '/api/auth/verify',
      })
    }

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
