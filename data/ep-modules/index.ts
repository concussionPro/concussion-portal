/**
 * EP course module aggregator. The 8 modules are authored as the same `Module`
 * shape as the flagship data/modules.ts, so they render through the IDENTICAL
 * flagship learning-suite UI (CourseNavigation + SectionStepper +
 * DynamicContentRenderer) — see app/ep-course/modules/[id].
 *
 * DEMO/private: served only via the gated /api/ep-course route + /demo/essa.
 */
import type { Module } from '@/data/modules'
import type { ModuleMeta } from '@/data/module-meta'
import { module1 } from './module-1'
import { module2 } from './module-2'
import { module3 } from './module-3'
import { module4 } from './module-4'
import { module5 } from './module-5'
import { module6 } from './module-6'
import { module7 } from './module-7'
import { module8 } from './module-8'

export const epModules: Module[] = [module1, module2, module3, module4, module5, module6, module7, module8]

/**
 * EP module ids are NAMESPACED to 201-208 in the data files (and in the shared
 * ProgressContext store) so they can never collide with the flagship modules
 * 1-8 — the two courses share one progress store, and identical ids caused
 * cross-course completion corruption.
 *
 * Everything user-visible stays 1-8: URLs (/ep-course/modules/1-8), the module
 * numbers rendered in the nav/dashboard, and epModulesMeta all use the DISPLAY
 * id. Convert with epProgressId()/epDisplayId() at the boundary.
 */
export const EP_MODULE_ID_OFFSET = 200

export function epProgressId(displayId: number): number {
  return displayId > EP_MODULE_ID_OFFSET ? displayId : displayId + EP_MODULE_ID_OFFSET
}

export function epDisplayId(id: number): number {
  return id > EP_MODULE_ID_OFFSET ? id - EP_MODULE_ID_OFFSET : id
}

// Accepts either form: display id (1-8, as in URLs / the API route) or
// namespaced id (201-208).
export function getEpModuleById(id: number): Module | undefined {
  return epModules.find((m) => m.id === epProgressId(id))
}

export function getEpModules(): Module[] {
  return epModules
}

// Meta exposes the DISPLAY id (1-8) — consumed by the EP nav/dashboard and the
// prospect-portal module listings, which render "Module {id}" and link to
// /ep-course/modules/{id}.
export const epModulesMeta: ModuleMeta[] = epModules.map((m) => ({
  id: epDisplayId(m.id),
  title: m.title,
  subtitle: m.subtitle,
  duration: m.duration,
  points: m.points,
  description: m.description,
}))

export function getEpModulesMeta(): ModuleMeta[] {
  return epModulesMeta
}
