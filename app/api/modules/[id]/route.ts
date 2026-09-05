import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import {
  resolveModuleForAccess,
  resolveFlagshipCallerAccessLevel,
  type AccessLevel,
} from '@/lib/module-access'
import { DEMO_KEY } from '@/lib/demo-key'
import { isDemoUserId } from '@/lib/demo-session'
import { getCurrentAccessLevel } from '@/lib/users'

/**
 * Secure Module Content API
 *
 * Returns module content based on the user's authentication and access level:
 * - Unauthenticated: 401
 * - Free tier (preview): SCAT modules in full; Module 1 truncated with quiz
 *   answers stripped; modules 2-8 refused with `upgrade: true`
 * - Paid / reviewer demo_key: full module content
 *
 * The gating itself lives in lib/module-access.ts, which the module PAGE also
 * uses to server-render its content — both read the same resolver so the
 * server-rendered HTML and this endpoint can never disagree about what a given
 * user is allowed to see.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const moduleId = parseInt(id)

    if (isNaN(moduleId)) {
      return NextResponse.json({ error: 'Invalid module ID' }, { status: 400 })
    }

    const sessionToken = request.cookies.get('session')?.value
    const sessionData = sessionToken ? verifySessionToken(sessionToken) : null

    // Caller tier: DEMO_KEY reviewers get full-course (same as toolkit /
    // /api/auth/session); clinic_demo prospects stay on preview; anonymous
    // production callers get null → 401. See resolveFlagshipCallerAccessLevel.
    const reviewerDemo =
      request.cookies.get('demo_key')?.value === DEMO_KEY
    let accessLevel: AccessLevel | null = resolveFlagshipCallerAccessLevel({
      sessionAccessLevel: sessionData?.accessLevel ?? null,
      demoKeyCookie: request.cookies.get('demo_key')?.value,
      clinicDemoCookie: request.cookies.get('clinic_demo')?.value,
    })

    // Revocation re-check (2026-08-05 sweep #5): a 365-day session JWT outlives
    // a refund downgrade — when the session CLAIMS a paid level, the DB row is
    // the truth for paid content. One cheap indexed select, only on paid
    // claims; demo_key, unauthenticated and free paths never touch the DB here.
    // Skip when reviewerDemo: the demo_key entitlement must not be overridden
    // by a leftover refunded JWT on the same browser.
    if (
      !reviewerDemo &&
      sessionData &&
      !isDemoUserId(sessionData.userId) &&
      (sessionData.accessLevel === 'online-only' || sessionData.accessLevel === 'full-course')
    ) {
      const dbLevel = await getCurrentAccessLevel(sessionData.userId)
      if (dbLevel) accessLevel = dbLevel
    }

    const result = resolveModuleForAccess(moduleId, accessLevel)

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          ...(result.upgrade
            ? {
                upgrade: true,
                message: 'Upgrade to the full course to access all 8 modules',
              }
            : {}),
        },
        { status: result.status }
      )
    }

    return NextResponse.json({
      success: true,
      module: result.module,
      accessLevel: result.accessLevel,
      ...(result.allSectionTitles ? { allSectionTitles: result.allSectionTitles } : {}),
    })
  } catch (error) {
    console.error('Module API error:', error)
    return NextResponse.json(
      { error: 'Failed to load module content' },
      { status: 500 }
    )
  }
}
