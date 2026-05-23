import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, createJWTSession } from '@/lib/jwt-session'
import { findUserById, isBookOwner } from '@/lib/users'

/**
 * Synthetic "demo viewer" user — returned when the partner-preview
 * demo_key cookie is set (via /api/ai-course/demo-access/accept after
 * NDA acceptance, or /api/admin/demo-preview shortcut). Gives a partner
 * full-course access to browse CCM + AI course + learning dashboard
 * without provisioning a real user account.
 *
 * Used as a fallback for ANY session-failure path so a partner can land
 * on /learning even when there's a stale/invalid `session` cookie from
 * a prior visit.
 *
 * The synthetic user has id `demo-viewer-<org>` so downstream code that
 * mutates user records (e.g. progress writes) must skip when id starts
 * with `demo-viewer`.
 */
function getDemoViewerResponse(request: NextRequest): NextResponse | null {
  const demoKey = request.cookies.get('demo_key')?.value
  const demoOrg = request.cookies.get('demo_org')?.value
  if (demoKey && process.env.HEIDI_DEMO_KEY && demoKey === process.env.HEIDI_DEMO_KEY) {
    return NextResponse.json({
      success: true,
      user: {
        id: `demo-viewer-${demoOrg || 'unknown'}`,
        email: 'demo@partner-preview.local',
        name: `${demoOrg || 'Partner'} Demo Viewer`,
        accessLevel: 'full-course',
        bookOwner: false,
        workshopLocation: null,
        createdAt: new Date().toISOString(),
        nurtureUnsubscribed: true,
        progressEmailsOptedOut: true,
        isDemo: true,
      },
    })
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      const demoResponse = getDemoViewerResponse(request)
      if (demoResponse) return demoResponse
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }

    // Verify JWT session token
    const sessionData = verifySessionToken(sessionToken)

    if (!sessionData) {
      // Stale or invalid session — fall back to demo viewer if a valid
      // demo_key cookie is present. Avoids locking out a partner who
      // happens to have an old session cookie from a different visit.
      const demoResponse = getDemoViewerResponse(request)
      if (demoResponse) return demoResponse
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
      // Detect if original session was rememberMe (30 days) by checking remaining time
      const remainingMs = sessionData.exp - Date.now()
      const wasRememberMe = remainingMs > 10 * 24 * 60 * 60 * 1000 // >10 days remaining = was 30-day
      const newToken = createJWTSession(
        user.id, user.email, user.name, user.accessLevel, wasRememberMe
      )
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          accessLevel: user.accessLevel,
          bookOwner: await isBookOwner(user.email),
          workshopLocation: user.workshopLocation || null,
          createdAt: user.createdAt,
          nurtureUnsubscribed: user.nurtureUnsubscribed || false,
          progressEmailsOptedOut: user.progressEmailsOptedOut || false,
        },
      })
      const maxAge = wasRememberMe ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60
      response.cookies.set('session', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
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
        workshopLocation: user.workshopLocation || null,
        createdAt: user.createdAt,
        nurtureUnsubscribed: user.nurtureUnsubscribed || false,
        progressEmailsOptedOut: user.progressEmailsOptedOut || false,
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
