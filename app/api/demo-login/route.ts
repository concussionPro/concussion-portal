import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, findUserById, createUser } from '@/lib/users'
import { createJWTSession } from '@/lib/jwt-session'

export async function GET(request: NextRequest) {
  try {
    // Get or create demo user with full access
    const demoEmail = 'demo@concussionpro.com'

    let user = await findUserByEmail(demoEmail)
    if (!user) {
      const userId = await createUser({
        email: demoEmail,
        name: 'Demo User',
        accessLevel: 'full-course',
      })
      user = await findUserById(userId)
      if (!user) {
        throw new Error('Failed to create demo user')
      }
    }

    // Create JWT session (instant, no Blob storage)
    const sessionToken = createJWTSession(user.id, user.email, user.name, user.accessLevel, true)

    // Set session cookie and redirect to dashboard
    const response = NextResponse.redirect(new URL('/dashboard', request.url))

    response.cookies.set('session', sessionToken, {
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
