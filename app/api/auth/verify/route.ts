import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicTokenJWT } from '@/lib/magic-link-jwt'
import { findUserById, updateLastLogin } from '@/lib/users'
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

    // Verify the magic token
    const tokenData = verifyMagicTokenJWT(token)

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get user data
    const user = await findUserById(tokenData.userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update last login
    await updateLastLogin(user.id)

    // Check if remember me is requested (default to true for convenience)
    const rememberMe = searchParams.get('rememberMe') !== 'false'

    // Create session
    const sessionId = await createSession(user.id, user.email, rememberMe)

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accessLevel: user.accessLevel,
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
