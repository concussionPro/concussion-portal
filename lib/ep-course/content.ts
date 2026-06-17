/**
 * EP course content loader. Mirrors lib/vagus-course/content.ts — re-exports
 * client-safe module metadata and provides the server-only markdown loader so
 * the standard parseModuleSections + ModuleViewer render it like every other
 * course in the suite.
 */
import { promises as fs } from 'fs'
import path from 'path'

export { EP_MODULES, findEpModule } from './modules'
export type { EpModuleMeta } from './modules'

export const EP_COURSE = {
  title: 'Concussion Rehabilitation for Exercise Physiologists',
  subtitle: 'Active recovery, sub-symptom-threshold exercise & return to sport — within AEP scope',
  basePath: '/courses/concussion-ep-rehab',
  cpdHours: 8,
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'ep-course')

export async function loadEpModuleContent(slug: string): Promise<string> {
  return fs.readFile(path.join(CONTENT_DIR, `${slug}.md`), 'utf-8')
}
