import { NextRequest, NextResponse } from 'next/server'
import { getAllModules } from '@/data/modules'

/**
 * Module List API - Returns module metadata only (no content)
 *
 * This endpoint provides module titles, durations, descriptions for the
 * learning dashboard WITHOUT exposing the actual lesson content.
 */
export async function GET(request: NextRequest) {
  try {
    const modules = getAllModules()

    // Return only metadata, strip out all content
    const moduleList = modules.map(module => ({
      id: module.id,
      title: module.title,
      subtitle: module.subtitle,
      duration: module.duration,
      points: module.points,
      description: module.description,
      videoRequiredMinutes: module.videoRequiredMinutes,
      // Do NOT include: sections, quiz, clinicalReferences, videoUrl
    }))

    return NextResponse.json({
      success: true,
      modules: moduleList,
    })
  } catch (error) {
    console.error('Module list API error:', error)
    return NextResponse.json(
      { error: 'Failed to load module list' },
      { status: 500 }
    )
  }
}
