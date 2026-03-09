import { NextResponse } from 'next/server'
import { getAllModules } from '@/data/modules'

/**
 * Public (no auth) API route.
 * Module 1: first 7 sections unlocked (myths quiz through DAI).
 * Cuts right before the neurometabolic cascade — the content clinicians
 * need most — creating a natural cliffhanger to convert.
 * Modules 2-8: first section only.
 */

const MODULE_1_PREVIEW_COUNT = 7

export async function GET() {
  const modules = getAllModules()

  const previewData = modules.map((module) => {
    const previewCount = module.id === 1 ? MODULE_1_PREVIEW_COUNT : 1
    const unlocked = module.sections.slice(0, previewCount)

    return {
      id: module.id,
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
