import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { getModuleById } from '@/data/modules'

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
  { params }: { params: { id: string } }
) {
  try {
    const moduleId = parseInt(params.id)

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

    // Get module data
    const module = getModuleById(moduleId)

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      )
    }

    // Determine access level
    const hasFullAccess =
      sessionData.accessLevel === 'online-only' ||
      sessionData.accessLevel === 'full-course'

    // For preview/free users: return only first 2 sections
    if (!hasFullAccess) {
      const previewModule = {
        ...module,
        sections: module.sections.slice(0, 2), // Only first 2 sections
        quiz: [], // No quiz access for preview
        clinicalReferences: [], // No references for preview
      }

      return NextResponse.json({
        success: true,
        module: previewModule,
        accessLevel: 'preview',
        message: 'Preview mode - upgrade to access full content',
      })
    }

    // For paid users: return full content
    return NextResponse.json({
      success: true,
      module: module,
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
