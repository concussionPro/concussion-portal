import { NextResponse } from 'next/server'
import { getAllModules } from '@/data/modules'

/**
 * Public (no auth) API route.
 * Returns ALL sections for Module 1 (full preview) + metadata only for modules 2-8.
 * No quiz data, no clinical references for locked modules.
 */
export async function GET() {
  const modules = getAllModules()

  const previewData = modules.map((module) => {
    const isModule1 = module.id === 1

    return {
      id: module.id,
      title: module.title,
      subtitle: module.subtitle,
      duration: module.duration,
      points: module.points,
      description: module.description,
      totalSections: module.sections.length,
      // Module 1: all sections unlocked. Modules 2-8: first section only.
      previewSections: isModule1
        ? module.sections.map((s) => ({
            id: s.id,
            title: s.title,
            content: s.content,
          }))
        : module.sections[0]
          ? [{ id: module.sections[0].id, title: module.sections[0].title, content: module.sections[0].content }]
          : [],
      sectionTitles: module.sections.map((s) => s.title),
    }
  })

  return NextResponse.json(previewData)
}
