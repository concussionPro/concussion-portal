import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/sessions'
import { findUserById } from '@/lib/users'

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }

    // Verify session
    const sessionData = await verifySession(sessionId)

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Get user data
    const user = await findUserById(sessionData.userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accessLevel: user.accessLevel,
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
