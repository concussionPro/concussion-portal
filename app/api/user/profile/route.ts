import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, createJWTSession } from '@/lib/jwt-session'
import { updateUserProfile } from '@/lib/users'

export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const sessionData = verifySessionToken(sessionToken)
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const body = await request.json()
    const updates: { name?: string; nurtureUnsubscribed?: boolean } = {}

    if (typeof body.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim().slice(0, 100)
    }
    if (typeof body.nurtureUnsubscribed === 'boolean') {
      updates.nurtureUnsubscribed = body.nurtureUnsubscribed
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updatedUser = await updateUserProfile(sessionData.userId, updates)
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const response = NextResponse.json({ success: true, user: updatedUser })

    // Reissue session cookie if name changed (name is embedded in JWT)
    if (updates.name && updates.name !== sessionData.name) {
      const newToken = createJWTSession(
        sessionData.userId,
        sessionData.email,
        updates.name,
        sessionData.accessLevel,
        true
      )
      response.cookies.set('session', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
