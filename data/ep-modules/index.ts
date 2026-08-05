/**
 * EP course module aggregator. The 8 modules are authored as the same `Module`
 * shape as the flagship data/modules.ts, so they render through the IDENTICAL
 * flagship learning-suite UI (CourseNavigation + SectionStepper +
 * DynamicContentRenderer) — see app/ep-course/modules/[id].
 *
 * DEMO/private: served only via the gated /api/ep-course route + /demo/essa.
 */
import type { Module } from '@/data/modules'
import { epProgressId } from '@/data/ep-module-meta'
import { module1 } from './module-1'
import { module2 } from './module-2'
import { module3 } from './module-3'
import { module4 } from './module-4'
import { module5 } from './module-5'
import { module6 } from './module-6'
import { module7 } from './module-7'
import { module8 } from './module-8'

export const epModules: Module[] = [module1, module2, module3, module4, module5, module6, module7, module8]

// The id-namespacing helpers and the meta list now live in data/ep-module-meta
// (a LITERAL, content-free file) so 'use client' components can consume them
// WITHOUT importing this barrel — importing it compiles all 8 paid modules,
// quiz answers included, into a public client chunk. Re-exported here so
// server-side consumers keep a single import path.
export {
  EP_MODULE_ID_OFFSET,
  epProgressId,
  epDisplayId,
  epModulesMeta,
  getEpModulesMeta,
} from '@/data/ep-module-meta'

// Accepts either form: display id (1-8, as in URLs / the API route) or
// namespaced id (201-208).
export function getEpModuleById(id: number): Module | undefined {
  return epModules.find((m) => m.id === epProgressId(id))
}

export function getEpModules(): Module[] {
  return epModules
}
