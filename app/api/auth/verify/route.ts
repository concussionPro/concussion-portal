import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicTokenJWT } from '@/lib/magic-link-jwt'
import { updateLastLogin } from '@/lib/users'
import { createSession } from '@/lib/sessions'

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

    // Create session
    const sessionId = await createSession(tokenData.userId, tokenData.email, rememberMe)

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
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
