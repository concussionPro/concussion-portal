import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, createJWTSession } from '@/lib/jwt-session'
import { findUserById } from '@/lib/users'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }

    // Verify JWT session token
    const sessionData = verifySessionToken(sessionToken)

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Always fetch full user from DB for up-to-date data
    const user = await findUserById(sessionData.userId)

    if (!user) {
      // User was deleted from DB — invalidate session
      const response = NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
      response.cookies.delete('session')
      return response
    }

    if (user.accessLevel !== sessionData.accessLevel) {
      // Access level changed — issue a refreshed session cookie
      const newToken = createJWTSession(
        user.id, user.email, user.name, user.accessLevel, true
      )
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          accessLevel: user.accessLevel,
          createdAt: user.createdAt,
          nurtureUnsubscribed: user.nurtureUnsubscribed || false,
        },
      })
      response.cookies.set('session', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      })
      return response
    }

    // Return user data from DB
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accessLevel: user.accessLevel,
        createdAt: user.createdAt,
        nurtureUnsubscribed: user.nurtureUnsubscribed || false,
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { error: 'Session validation failed' },
      { status: 500 }
    )
  }
}
