/**
 * Concussion Exercise Rehabilitation for Exercise Physiologists (EP course).
 *
 * Aggregates the 7 EP module objects (data/ep-modules/*) into a single course,
 * reusing the existing `Module` shape from data/modules.ts so the standard
 * DynamicContentRenderer can render them — no new rendering engine. Mirrors the
 * lib/vagus-course/content.ts pattern (a standalone, gated course).
 *
 * PRIVATE: delivered only through /courses/concussion-ep-rehab/* which is gated
 * by requireAiCourseAccess() (admin or demo_key cookie) and noindex. Not listed
 * in the public catalogue. Built for ESSA accreditation review (Steve) — share
 * via the /demo/essa reviewer link.
 */
import type { Module } from '@/data/modules'
import { module1 } from '@/data/ep-modules/module-1'
import { module2 } from '@/data/ep-modules/module-2'
import { module3 } from '@/data/ep-modules/module-3'
import { module4 } from '@/data/ep-modules/module-4'
import { module5 } from '@/data/ep-modules/module-5'
import { module6 } from '@/data/ep-modules/module-6'
import { module7 } from '@/data/ep-modules/module-7'

export const EP_MODULES: Module[] = [module1, module2, module3, module4, module5, module6, module7]

export const EP_COURSE = {
  title: 'Concussion Rehabilitation for Exercise Physiologists',
  subtitle: 'Active Recovery, Sub-Symptom-Threshold Exercise & Return to Sport — within AEP scope',
  basePath: '/courses/concussion-ep-rehab',
}

export const epSlug = (id: number) => `module-${id}`
export const findEpModule = (slug: string): Module | undefined =>
  EP_MODULES.find((m) => epSlug(m.id) === slug)
export const EP_TOTAL_POINTS = EP_MODULES.reduce((s, m) => s + m.points, 0)
