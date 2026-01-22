import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/users'
import { createSession } from '@/lib/sessions'

export async function GET(request: NextRequest) {
  try {
    // Create or get demo user with full access
    const demoEmail = 'demo@concussionpro.com'

    const user = await createUser({
      email: demoEmail,
      name: 'Demo User',
      accessLevel: 'full-course',
    })

    // Create session
    const sessionId = await createSession(user.id, user.email, true)

    // Set session cookie and redirect to dashboard
    const response = NextResponse.redirect(new URL('/dashboard', request.url))

    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Demo login error:', error)
    return NextResponse.json(
      { error: 'Demo login failed' },
      { status: 500 }
    )
  }
}
