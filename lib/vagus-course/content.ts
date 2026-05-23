/**
 * Vagus course content loader. Mirrors lib/ai-course/content.ts.
 * Re-exports module metadata from modules.ts (client-safe), and
 * provides server-only loaders for markdown content.
 */

import { promises as fs } from 'fs'
import path from 'path'

export { VAGUS_MODULES, findVagusModule } from './modules'
export type { VagusModuleMeta } from './modules'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'vagus-course')

export async function loadVagusModuleContent(slug: string): Promise<string> {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`)
  return fs.readFile(filePath, 'utf-8')
}
