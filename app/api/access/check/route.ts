// Server-side access control - SECURE
import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/sessions'
import { findUserById } from '@/lib/users'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')

    if (!sessionCookie) {
      return NextResponse.json({
        hasAccess: false,
        accessLevel: null,
        reason: 'Not authenticated',
      })
    }

    const session = await verifySession(sessionCookie.value)

    if (!session) {
      return NextResponse.json({
        hasAccess: false,
        accessLevel: null,
        reason: 'Invalid session',
      })
    }

    // Get user data from server
    const user = await findUserById(session.userId)

    if (!user) {
      return NextResponse.json({
        hasAccess: false,
        accessLevel: null,
        reason: 'User not found',
      })
    }

    // Return server-validated access level
    return NextResponse.json({
      hasAccess: true,
      accessLevel: user.accessLevel,
      userId: user.id,
      email: user.email,
    })
  } catch (error) {
    console.error('Access check error:', error)
    return NextResponse.json({
      hasAccess: false,
      accessLevel: null,
      reason: 'Server error',
    }, { status: 500 })
  }
}
