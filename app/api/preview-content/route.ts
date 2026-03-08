import { NextResponse } from 'next/server'
import { getAllModules } from '@/data/modules'

/**
 * Public (no auth) API route.
 * Returns the first section of each module + metadata + totalSections count.
 * No quiz data, no clinical references, no sections beyond index 0.
 */
export async function GET() {
  const modules = getAllModules()

  const previewData = modules.map((module) => ({
    id: module.id,
    title: module.title,
    subtitle: module.subtitle,
    duration: module.duration,
    points: module.points,
    description: module.description,
    totalSections: module.sections.length,
    firstSection: module.sections[0]
      ? {
          id: module.sections[0].id,
          title: module.sections[0].title,
          content: module.sections[0].content,
        }
      : null,
    sectionTitles: module.sections.map((s) => s.title),
  }))

  return NextResponse.json(previewData)
}
