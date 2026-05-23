/**
 * Course content loading (server-only). Modules live as markdown files
 * in /content/ai-course/. We load them at runtime via fs.readFile so
 * monthly content updates can ship without a full rebuild.
 *
 * Module metadata (MODULES, ModuleMeta, findModule) is re-exported from
 * lib/ai-course/modules.ts so client components can import the data
 * without pulling fs into the client bundle. Server callers can keep
 * importing from this file unchanged.
 */

import { promises as fs } from 'fs'
import path from 'path'

export { MODULES, findModule } from './modules'
export type { ModuleMeta } from './modules'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'ai-course')

export async function loadModuleContent(slug: string): Promise<string> {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`)
  return fs.readFile(filePath, 'utf-8')
}

export interface PromptMeta {
  title: string
  specialty: string
  useCase: string
  riskTier: 'low' | 'medium' | 'high'
  toolTier: string
  body: string
  category: string
}

/**
 * Load all prompts from the prompts/ directory. Each .md file is a category
 * with multiple prompts separated by `---` frontmatter blocks.
 */
export async function loadPrompts(): Promise<PromptMeta[]> {
  const dir = path.join(CONTENT_DIR, 'prompts')
  let files: string[] = []
  try {
    files = await fs.readdir(dir)
  } catch {
    return []
  }

  const prompts: PromptMeta[] = []
  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const category = file.replace(/\.md$/, '')
    const raw = await fs.readFile(path.join(dir, file), 'utf-8')
    prompts.push(...parsePromptFile(raw, category))
  }
  return prompts
}

function parsePromptFile(raw: string, category: string): PromptMeta[] {
  // The agent-generated format places a horizontal-rule "---" before each
  // prompt's opening frontmatter fence, producing `---\n\n---\n<fm>\n---\n<body>`
  // sequences. To handle both that and the simpler `---\n<fm>\n---\n<body>`
  // form, we match each frontmatter block via regex: a "---" line, then any
  // number of "key: value" lines, then a "---" line. Body is everything
  // until the next such block or EOF.
  const prompts: PromptMeta[] = []
  const fmRegex = /^---\s*$\n((?:[ \t]*[\w-]+[ \t]*:[ \t]*[^\n]*\n)+)---\s*$/gm
  const matches: Array<{ start: number; end: number; fm: string }> = []
  let m: RegExpExecArray | null
  while ((m = fmRegex.exec(raw)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, fm: m[1] })
  }

  for (let idx = 0; idx < matches.length; idx++) {
    const { end, fm } = matches[idx]
    const bodyStart = end
    const bodyEnd = idx + 1 < matches.length ? matches[idx + 1].start : raw.length
    const body = raw.slice(bodyStart, bodyEnd).trim()

    const meta: Record<string, string> = {}
    for (const line of fm.split('\n')) {
      const colonIdx = line.indexOf(':')
      if (colonIdx === -1) continue
      const k = line.slice(0, colonIdx).trim()
      const v = line.slice(colonIdx + 1).trim()
      if (k) meta[k] = v
    }
    if (!meta.title) continue
    prompts.push({
      title: meta.title,
      specialty: meta.specialty || 'all',
      useCase: meta.useCase || category,
      riskTier: (meta.riskTier as 'low' | 'medium' | 'high') || 'medium',
      toolTier: meta.toolTier || 'A,B,C',
      body,
      category,
    })
  }
  return prompts
}

export interface TemplateMeta {
  slug: string
  title: string
  specialty: string
  useCase: string
  body: string
  /** Field placeholder names extracted from body and/or frontmatter `fields:` list. */
  fields: string[]
}

/**
 * Pull all `{snake_case_token}` placeholders out of a template body in
 * order of first appearance, deduplicated. We don't trust the
 * frontmatter `fields:` list alone — some templates have placeholders
 * the author didn't enumerate.
 */
function extractTemplateFields(body: string): string[] {
  const seen = new Set<string>()
  const ordered: string[] = []
  const re = /\{([a-z][a-z0-9_]*)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(body)) !== null) {
    const key = m[1]
    if (!seen.has(key)) {
      seen.add(key)
      ordered.push(key)
    }
  }
  return ordered
}

export async function loadTemplates(): Promise<TemplateMeta[]> {
  const dir = path.join(CONTENT_DIR, 'templates')
  let files: string[] = []
  try {
    files = await fs.readdir(dir)
  } catch {
    return []
  }
  const templates: TemplateMeta[] = []
  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const raw = await fs.readFile(path.join(dir, file), 'utf-8')
    const slug = file.replace(/\.md$/, '')
    const fmEnd = raw.indexOf('\n---', 4)
    if (!raw.startsWith('---') || fmEnd === -1) {
      // No frontmatter; use defaults
      templates.push({
        slug,
        title: slug,
        specialty: 'all',
        useCase: '',
        body: raw,
        fields: extractTemplateFields(raw),
      })
      continue
    }
    const fm = raw.slice(3, fmEnd).trim()
    const body = raw.slice(fmEnd + 4).trim()
    const meta: Record<string, string> = {}
    for (const line of fm.split('\n')) {
      const [k, ...rest] = line.split(':')
      if (!k) continue
      meta[k.trim()] = rest.join(':').trim()
    }
    templates.push({
      slug,
      title: meta.title || slug,
      specialty: meta.specialty || 'all',
      useCase: meta.useCase || '',
      body,
      fields: extractTemplateFields(body),
    })
  }
  return templates
}
