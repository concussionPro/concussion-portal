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

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify session
    const sessionData = verifySessionToken(sessionToken)

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Determine access level
    const hasFullAccess =
      sessionData.accessLevel === 'online-only' ||
      sessionData.accessLevel === 'full-course'

    // Get appropriate module based on access level
    let module
    if (hasFullAccess) {
      // Paid users: Get from main course modules
      module = getModuleById(moduleId)
      if (!module) {
        return NextResponse.json(
          { error: 'Module not found' },
          { status: 404 }
        )
      }
    } else {
      // Preview/free users: Get from SCAT modules
      console.log('[MODULE API] Preview user accessing module:', moduleId)
      const scatModule = getSCATModuleById(moduleId)
      console.log('[MODULE API] SCAT module found:', !!scatModule, scatModule?.id)

      if (!scatModule) {
        console.error('[MODULE API] SCAT module not found for ID:', moduleId)
        // They're trying to access a paid module
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
      module = scatModule
    }

    // For preview users: only return first 2 sections
    let responseModule = module
    if (sessionData.accessLevel === 'preview') {
      responseModule = {
        ...module,
        sections: module.sections.slice(0, 2),
      }
      console.log('[MODULE API] Limited preview user to first 2 sections')
    }

    // Return content based on access level
    return NextResponse.json({
      success: true,
      module: responseModule,
      accessLevel: sessionData.accessLevel,
    })

  } catch (error) {
    console.error('Module API error:', error)
    return NextResponse.json(
      { error: 'Failed to load module content' },
      { status: 500 }
    )
  }
}
