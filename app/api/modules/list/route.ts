import { NextRequest, NextResponse } from 'next/server'
import { getAllModules } from '@/data/modules'
import { getSCATModules } from '@/data/scat-modules'
import { verifySessionToken } from '@/lib/jwt-session'
import { resolveFlagshipCallerAccessLevel } from '@/lib/module-access'

/**
 * Module List API - Returns module metadata based on access level
 *
 * - Preview users: FREE SCAT6/SCOAT6 Mastery course modules (3 modules)
 * - Paid users / reviewer demo_key: Full concussion management course (8 modules)
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    const sessionData = sessionToken ? verifySessionToken(sessionToken) : null

    const accessLevel = resolveFlagshipCallerAccessLevel({
      sessionAccessLevel: sessionData?.accessLevel ?? null,
      demoKeyCookie: request.cookies.get('demo_key')?.value,
      clinicDemoCookie: request.cookies.get('clinic_demo')?.value,
    })

    if (!accessLevel) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Determine which modules to return based on access level
    const hasFullAccess =
      accessLevel === 'online-only' || accessLevel === 'full-course'

    const modules = hasFullAccess ? getAllModules() : getSCATModules()

    // Return only metadata, strip out all content
    const moduleList = modules.map(module => ({
      id: module.id,
      title: module.title,
      subtitle: module.subtitle,
      duration: module.duration,
      points: module.points,
      description: module.description,
      isFree: 'isFree' in module ? module.isFree : false,
      // Do NOT include: sections, quiz, clinicalReferences
    }))

    return NextResponse.json({
      success: true,
      modules: moduleList,
      accessLevel,
    })
  } catch (error) {
    console.error('Module list API error:', error)
    return NextResponse.json(
      { error: 'Failed to load module list' },
      { status: 500 }
    )
  }
}
