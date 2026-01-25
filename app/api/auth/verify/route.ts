import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicTokenJWT } from '@/lib/magic-link-jwt'
import { updateLastLogin } from '@/lib/users'
import { createJWTSession } from '@/lib/jwt-session'
import { logAuthFailure, logCriticalError } from '@/lib/monitoring'

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

    // Update last login (non-critical, async fire-and-forget)
    updateLastLogin(tokenData.userId).catch(err =>
      console.error('Failed to update last login:', err)
    )

    // Check if remember me is requested (default to true for convenience)
    const rememberMe = searchParams.get('rememberMe') !== 'false'

    // Create JWT session token (no Blob storage needed - instant!)
    const sessionToken = createJWTSession(
      tokenData.userId,
      tokenData.email,
      tokenData.name,
      tokenData.accessLevel,
      rememberMe
    )

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
      console.warn('⚠️  Development mode: Session cookie secure flag disabled. Use HTTPS in production.')
    }

    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict', // SECURITY: Changed from 'lax' to 'strict' for better CSRF protection
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
