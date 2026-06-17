/**
 * EP course module aggregator. The 7 modules are authored as the same `Module`
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

export const epModules: Module[] = [module1, module2, module3, module4, module5, module6, module7]

export function getEpModuleById(id: number): Module | undefined {
  return epModules.find((m) => m.id === id)
}

export function getEpModules(): Module[] {
  return epModules
}

export const epModulesMeta: ModuleMeta[] = epModules.map((m) => ({
  id: m.id,
  title: m.title,
  subtitle: m.subtitle,
  duration: m.duration,
  points: m.points,
  description: m.description,
}))

export function getEpModulesMeta(): ModuleMeta[] {
  return epModulesMeta
}
