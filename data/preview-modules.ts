/**
 * Preview-safe module data — strips full course content.
 * Only exposes titles, descriptions, section titles, and first 150 chars of first 2 sections.
 * NEVER import getAllModules() in client-side preview pages.
 */

import { modules, type Module, type Section } from './modules'

export interface PreviewSection {
  id: string
  title: string
  preview: string // First 150 chars of content[0], or empty
}

export interface PreviewModule {
  id: number
  title: string
  subtitle: string
  duration: string
  description: string
  sectionCount: number
  sections: PreviewSection[]
}

/**
 * Returns module metadata with section titles only.
 * Content is stripped except for a short preview snippet of the first 2 sections.
 */
export function getPreviewModules(): PreviewModule[] {
  return modules.map((module) => ({
    id: module.id,
    title: module.title,
    subtitle: module.subtitle,
    duration: module.duration,
    description: module.description,
    sectionCount: module.sections.length,
    sections: module.sections.map((section, idx) => ({
      id: section.id,
      title: section.title,
      // Only first 2 sections get a content preview snippet
      preview: idx < 2 && section.content && section.content.length > 0
        ? section.content[0].substring(0, 150)
        : '',
    })),
  }))
}
