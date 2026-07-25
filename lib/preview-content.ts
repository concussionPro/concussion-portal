/**
 * Locked-trial preview content — the PUBLIC, no-login sample of the courses.
 *
 * Module 1: first 3 sections unlocked (myths intro, learning objectives, the
 * "Is This a Concussion?" clinical scenario). Modules 2-8: first section only.
 * Every module also carries its full section-title list so the lock overlay can
 * show what's behind the paywall without shipping the content.
 *
 * SERVER-ONLY. Extracted from app/api/preview-content/route.ts so the /preview
 * page can build this during SERVER rendering instead of fetching it from the
 * browser. That fetch meant the trial's real clinical content never appeared in
 * the server HTML: crawlers and AI retrievers saw module titles and an empty
 * accordion, so the most citable public writing on the site was invisible to
 * search. The API route stays (the client accordion and any external caller
 * still use it) and now shares this single source, so the two can never drift.
 */
import { getAllModules } from '@/data/modules'
import { getEpModules, epDisplayId } from '@/data/ep-modules'

/** How many of Module 1's sections are unlocked in the public trial. */
export const MODULE_1_PREVIEW_COUNT = 3

export interface PreviewSection {
  id: string
  title: string
  content: string[]
}

export interface PreviewModuleData {
  id: number
  title: string
  subtitle: string
  duration: string
  points: number
  description: string
  totalSections: number
  previewSections: PreviewSection[]
  sectionTitles: string[]
}

export type PreviewCourse = 'ccm' | 'crm'

/** Normalise the ?course= param — anything that isn't 'crm' is the flagship. */
export function previewCourseFromParam(raw: unknown): PreviewCourse {
  return raw === 'crm' ? 'crm' : 'ccm'
}

/**
 * Build the trial payload for a course. Pure + synchronous — safe to call
 * during server rendering.
 */
export function getPreviewContent(course: PreviewCourse = 'ccm'): PreviewModuleData[] {
  const modules = course === 'crm' ? getEpModules() : getAllModules()

  return modules.map((module) => {
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
}
