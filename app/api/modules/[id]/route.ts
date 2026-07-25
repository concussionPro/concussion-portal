import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { resolveModuleForAccess, type AccessLevel } from '@/lib/module-access'

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
    const accessLevel: AccessLevel | null =
      sessionData?.accessLevel ??
      (process.env.NODE_ENV !== 'production' ? 'full-course' : null)

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
