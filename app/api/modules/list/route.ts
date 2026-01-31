import { NextRequest, NextResponse } from 'next/server'
import { getAllModules } from '@/data/modules'
import { getSCATModules } from '@/data/scat-modules'
import { verifySessionToken } from '@/lib/jwt-session'

/**
 * Module List API - Returns module metadata based on access level
 *
 * - Preview users: FREE SCAT6/SCOAT6 Mastery course modules (5 modules)
 * - Paid users: Full concussion management course (8 modules)
 */
export async function GET(request: NextRequest) {
  try {
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

    // Determine which modules to return based on access level
    const hasFullAccess =
      sessionData.accessLevel === 'online-only' ||
      sessionData.accessLevel === 'full-course'

    const modules = hasFullAccess ? getAllModules() : getSCATModules()

    // Return only metadata, strip out all content
    const moduleList = modules.map(module => ({
      id: module.id,
      title: module.title,
      subtitle: module.subtitle,
      duration: module.duration,
      points: module.points,
      description: module.description,
      videoRequiredMinutes: module.videoRequiredMinutes,
      isFree: 'isFree' in module ? module.isFree : false,
      // Do NOT include: sections, quiz, clinicalReferences, videoUrl
    }))

    return NextResponse.json({
      success: true,
      modules: moduleList,
      accessLevel: sessionData.accessLevel,
    })
  } catch (error) {
    console.error('Module list API error:', error)
    return NextResponse.json(
      { error: 'Failed to load module list' },
      { status: 500 }
    )
  }
}
