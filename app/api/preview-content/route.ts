import { NextResponse } from 'next/server'
import { getAllModules } from '@/data/modules'
import { getEpModules, epDisplayId } from '@/data/ep-modules'

/**
 * Public (no auth) API route — the locked-trial preview.
 * Module 1: first 3 sections unlocked (myths intro, learning objectives,
 * introduction with "Is This a Concussion?" clinical scenario).
 * The scenario ends with an upgrade CTA → /pricing.
 * Modules 2-8: first section only.
 *
 * ?course=crm serves the EP course (data/ep-modules) through the IDENTICAL
 * locked-trial structure — same architecture, different course data.
 */

const MODULE_1_PREVIEW_COUNT = 3

export async function GET(request: Request) {
  const course = new URL(request.url).searchParams.get('course')
  const modules = course === 'crm' ? getEpModules() : getAllModules()

  const previewData = modules.map((module) => {
    // EP data ids are namespaced to 201-208 (progress-store collision fix);
    // the preview always presents the DISPLAY id (1-8).
    const displayId = course === 'crm' ? epDisplayId(module.id) : module.id
    const previewCount = displayId === 1 ? MODULE_1_PREVIEW_COUNT : 1
    const unlocked = module.sections.slice(0, previewCount)

    return {
      id: displayId,
      title: module.title,
      subtitle: module.subtitle,
      duration: module.duration,
      points: module.points,
      description: module.description,
      totalSections: module.sections.length,
      previewSections: unlocked.map((s) => ({
        id: s.id,
        title: s.title,
        content: s.content,
      })),
      sectionTitles: module.sections.map((s) => s.title),
    }
  })

  return NextResponse.json(previewData)
}
