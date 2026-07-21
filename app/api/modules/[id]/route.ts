import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { getModuleById } from '@/data/modules'
import { getSCATModuleById } from '@/data/scat-modules'

/**
 * Secure Module Content API
 *
 * Returns module content based on user's authentication and access level:
 * - Unauthenticated: 403 Forbidden
 * - Authenticated (preview): First 2 sections only
 * - Authenticated (paid): Full module content
 *
 * This prevents content from being exposed to unauthorized users.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const moduleId = parseInt(id)

    // Validate module ID
    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      )
    }

    // Check authentication
    const sessionToken = request.cookies.get('session')?.value
    let sessionData = sessionToken ? verifySessionToken(sessionToken) : null

    // DEV-ONLY review bypass: let the free lead modules (101-104) render without
    // signup on localhost so the free course can be reviewed. Production keeps
    // the email-capture gate untouched.
    const devFreePreview =
      process.env.NODE_ENV !== 'production' && moduleId >= 101 && moduleId <= 104
    if (!sessionData && devFreePreview) {
      sessionData = { email: 'preview@localhost', accessLevel: 'preview' } as ReturnType<typeof verifySessionToken>
    }

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Determine access level
    const hasFullAccess =
      sessionData.accessLevel === 'online-only' ||
      sessionData.accessLevel === 'full-course'

    // Get appropriate module based on access level
    const isSCATModule = moduleId >= 101 && moduleId <= 104
    let module

    if (hasFullAccess) {
      // Paid users: Get from main course modules, then fall through to SCAT
      module = getModuleById(moduleId) || getSCATModuleById(moduleId)
      if (!module) {
        return NextResponse.json(
          { error: 'Module not found' },
          { status: 404 }
        )
      }
    } else {
      // Preview/free users: SCAT modules are the free course
      const scatModule = getSCATModuleById(moduleId)

      if (scatModule) {
        module = scatModule
      } else if (moduleId === 1) {
        // Preview users can access Module 1 with truncated content
        module = getModuleById(moduleId)
        if (!module) {
          return NextResponse.json(
            { error: 'Module not found' },
            { status: 404 }
          )
        }
      } else {
        // They're trying to access a paid module (2-8)
        return NextResponse.json(
          {
            error: 'This module requires full course access',
            upgrade: true,
            message: 'Upgrade to the full course to access all 8 modules',
            debug: {
              requestedId: moduleId,
              userType: 'preview',
            }
          },
          { status: 403 }
        )
      }
    }

    // For preview users accessing PAID modules (1-8): truncate content
    // SCAT modules (101-104) are the free course — preview users get FULL access
    let responseModule = module
    let allSectionTitles: string[] | undefined
    if (sessionData.accessLevel === 'preview' && !isSCATModule) {
      // Preserve all section titles for the locked banner before truncating
      allSectionTitles = module.sections.map((s: any) => s.title)
      responseModule = {
        ...module,
        sections: module.sections.slice(0, 2),
      }
    }

    // Strip quiz answers for preview users on PAID modules only
    // SCAT modules need full quiz data so preview users can complete them and earn CPD
    const safeModule = (sessionData.accessLevel === 'preview' && !isSCATModule)
      ? { ...responseModule, quiz: responseModule.quiz?.map(({ correctAnswer, explanation, ...q }: any) => q) ?? [] }
      : responseModule

    // Return content based on access level
    return NextResponse.json({
      success: true,
      module: safeModule,
      accessLevel: sessionData.accessLevel,
      ...(allSectionTitles ? { allSectionTitles } : {}),
    })

  } catch (error) {
    console.error('Module API error:', error)
    return NextResponse.json(
      { error: 'Failed to load module content' },
      { status: 500 }
    )
  }
}
