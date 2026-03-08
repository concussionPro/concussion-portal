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

    // Check if access level has changed (e.g., user upgraded after paying)
    const user = await findUserById(sessionData.userId)
    if (user && user.accessLevel !== sessionData.accessLevel) {
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

    // Return user data from JWT
    return NextResponse.json({
      success: true,
      user: {
        id: sessionData.userId,
        email: sessionData.email,
        name: sessionData.name,
        accessLevel: sessionData.accessLevel,
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
