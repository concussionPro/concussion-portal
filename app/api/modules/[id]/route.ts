import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { resolveModuleForAccess, type AccessLevel } from '@/lib/module-access'
import { CLINIC_DEMO_KEY, DEMO_KEY } from '@/lib/demo-key'
import { isDemoUserId } from '@/lib/demo-session'
import { getCurrentAccessLevel } from '@/lib/users'

/**
 * Secure Module Content API
 *
 * Returns module content based on the user's authentication and access level:
 * - Unauthenticated: 401
 * - Free tier (preview): SCAT modules in full; Module 1 truncated with quiz
 *   answers stripped; modules 2-8 refused with `upgrade: true`
 * - Paid: full module content
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

    // DEV-ONLY review bypass: on localhost, serve ANY module (free or paid) with
    // full access so the whole course can be reviewed without login. Production
    // keeps every gate untouched.
    // Clinic-prospect demo (/demo/clinic): no session cookie exists, but the
    // clinic_demo cookie entitles PREVIEW scope — Module 1 trial truncated,
    // paid modules refused with the upgrade CTA. Same resolver, same limits
    // as any free-tier user; the trial died with "Authentication required"
    // without this (2026-07-27).
    const clinicDemo =
      request.cookies.get('clinic_demo')?.value === CLINIC_DEMO_KEY
    // REVIEWER KEY (2026-08-07). Every other course in the catalogue already
    // honours demo_key — CRM, the AI course, RTP, the toolkit, the references,
    // Clinical Testing — but CCM did not, so an accreditation reviewer or a
    // partner following a /demo/* link got the full catalogue EXCEPT the
    // flagship. Measured before changing anything: CRM module 1 served 6,711
    // characters to a reviewer while CCM modules 1-8 served an 800-character
    // shell.
    //
    // Scope is 'full-course' because a reviewer assessing the course for
    // accreditation or distribution must see the paid content; 'preview' would
    // show them the truncated trial and misrepresent the product.
    //
    // This is the SAME shared key the accreditation links use, deliberately:
    // seventeen gates across twelve files already accept it, and introducing a
    // second key means any gate I miss becomes a locked page for the partner.
    // Rotating DEMO_KEY (or setting HEIDI_DEMO_KEY) revokes every reviewer link
    // at once, which is the documented revocation path.
    const reviewerKey = request.cookies.get('demo_key')?.value === DEMO_KEY
    let accessLevel: AccessLevel | null =
      sessionData?.accessLevel ??
      (reviewerKey ? 'full-course' : null) ??
      (clinicDemo ? 'preview' : null) ??
      (process.env.NODE_ENV !== 'production' ? 'full-course' : null)

    // Revocation re-check (2026-08-05 sweep #5): a 365-day session JWT outlives
    // a refund downgrade — when the session CLAIMS a paid level, the DB row is
    // the truth for paid content. One cheap indexed select, only on paid
    // claims; demo, unauthenticated and free paths never touch the DB here.
    if (
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
