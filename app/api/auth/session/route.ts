import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, createJWTSession } from '@/lib/jwt-session'
import { findUserById, isBookOwner } from '@/lib/users'
import { crmEntitlementsFor } from '@/lib/crm-course'
import { DEMO_KEY, CLINIC_DEMO_KEY } from '@/lib/demo-key'

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
  if (demoKey && demoKey === DEMO_KEY) {
    return NextResponse.json({
      success: true,
      user: {
        id: `demo-viewer-${demoOrg || 'unknown'}`,
        email: 'demo@partner-preview.local',
        name: `${demoOrg || 'Partner'} Demo Viewer`,
        accessLevel: 'full-course',
        bookOwner: false,
        // The demo_key already passes CrmCourseGate, so the dashboard must
        // match the gate — otherwise a partner sees CRM rendered as locked
        // while /ep-course lets them straight in.
        ownsCrm: true,
        workshopLocation: null,
        createdAt: new Date().toISOString(),
        nurtureUnsubscribed: true,
        progressEmailsOptedOut: true,
        isDemo: true,
      },
    })
  }
  // Clinic-prospect demo (/demo/clinic — the ACC/supplier pitch surface):
  // a synthetic PREVIEW-level user, so the whole portal renders the existing
  // free-tier sell — CCM/CRM visible but locked, Module 1 trial + free
  // courses open, Clinical Testing in demo mode (DEMO00). No session cookie
  // is ever issued, so every session-authed mutation (progress writes,
  // account changes, certificates) stays naturally blocked. Real sessions
  // are checked BEFORE this fallback — demo is a floor, never a downgrade.
  const clinicDemo = request.cookies.get('clinic_demo')?.value
  if (clinicDemo && clinicDemo === CLINIC_DEMO_KEY) {
    return NextResponse.json({
      success: true,
      user: {
        id: 'demo-viewer-clinic',
        email: 'demo@clinic-preview.local',
        name: 'Clinic Demo',
        accessLevel: 'preview',
        bookOwner: false,
        ownsCrm: false,
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
      // DEV-ONLY: return a PREVIEW user on localhost so the learning dashboard
      // and free course render for review — free modules accessible, paid
      // modules shown locked with the upgrade CTA. Production is untouched.
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({
          success: true,
          user: {
            id: 'dev-preview',
            email: 'preview@localhost',
            name: 'Dev Preview',
            accessLevel: 'preview',
            bookOwner: false,
            workshopLocation: null,
            createdAt: new Date().toISOString(),
            nurtureUnsubscribed: true,
            progressEmailsOptedOut: true,
            isDemo: true,
          },
        })
      }
      return NextResponse.json({ success: false, error: 'No session found' })
    }

    // Verify JWT session token
    const sessionData = verifySessionToken(sessionToken)

    if (!sessionData) {
      // Stale or invalid session — fall back to demo viewer if a valid
      // demo_key cookie is present. Avoids locking out a partner who
      // happens to have an old session cookie from a different visit.
      const demoResponse = getDemoViewerResponse(request)
      if (demoResponse) return demoResponse
      // DEV-ONLY: a stale/invalid cookie must not block localhost review either.
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({
          success: true,
          user: {
            id: 'dev-preview', email: 'preview@localhost', name: 'Dev Preview',
            accessLevel: 'preview', bookOwner: false, workshopLocation: null,
            createdAt: new Date().toISOString(), nurtureUnsubscribed: true,
            progressEmailsOptedOut: true, isDemo: true,
          },
        })
      }
      return NextResponse.json({ success: false, error: 'Invalid or expired session' })
    }

    // Always fetch full user from DB for up-to-date data
    const user = await findUserById(sessionData.userId)

    if (!user) {
      // Demo identities carry a REAL preview JWT but have NO users row —
      // return the synthetic user instead of nuking their session (the
      // /demo/clinic prospect flow; see lib/demo-session.ts).
      if (sessionData.userId.startsWith('demo-viewer')) {
        return NextResponse.json({
          success: true,
          user: {
            id: sessionData.userId,
            email: sessionData.email,
            name: sessionData.name,
            accessLevel: sessionData.accessLevel,
            bookOwner: false,
            ownsCrm: false,
            workshopLocation: null,
            createdAt: new Date().toISOString(),
            nurtureUnsubscribed: true,
            progressEmailsOptedOut: true,
            isDemo: true,
          },
        })
      }
      // User was deleted from DB — invalidate session
      const response = NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
      response.cookies.delete('session')
      return response
    }

    // Both CRM entitlements in ONE query (see crmEntitlementsFor): `ownsCrm`
    // admits them to /ep-course, `ownsCrmPractical` tells the UI whether the
    // SHARED practical day is still an upsell for them. Without the second
    // flag no client component could distinguish "CRM online" from "CRM
    // complete", which is why the EP course had no in-portal upgrade path at
    // all while CCM had eleven.
    const crm = await crmEntitlementsFor(user.email)

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
          // CRM entitlement lives in course_purchases, NOT access_level (the two
          // streams are deliberately isolated). The client needs it or a paying
          // CRM buyer renders as a free 'preview' user.
          ownsCrm: crm.ownsCrm,
          ownsCrmPractical: crm.ownsCrmPractical,
          hubPackSeat: Boolean(user.hubPackSeatAt),
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
        // See above — CRM ownership is course_purchases-based, not access_level.
        ownsCrm: crm.ownsCrm,
        ownsCrmPractical: crm.ownsCrmPractical,
        hubPackSeat: Boolean(user.hubPackSeatAt),
        // Book ownership is a DB flag on a preview-level account — omitting it
        // here (the path nearly every request takes) locked paying book
        // buyers out of /complete-reference and the $50 bundle discount
        // (2026-08-05 round-G #3).
        bookOwner: await isBookOwner(user.email),
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
