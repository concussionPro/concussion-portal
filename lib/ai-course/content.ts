/**
 * Course structure and content loading. Modules live as markdown files in
 * /content/ai-course/. We load them at runtime via fs.readFile so monthly
 * content updates can ship without a full rebuild.
 */

import { promises as fs } from 'fs'
import path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'ai-course')

export interface ModuleMeta {
  slug: string
  title: string
  number: number
  durationMin: number
  description: string
  loadBearing?: boolean
}

export const MODULES: ModuleMeta[] = [
  {
    slug: 'module-1-compliance',
    number: 1,
    title: 'Compliance & Medicolegal Framework',
    durationMin: 40,
    description: 'AHPRA 2025 AI Code, Australian Privacy Principles, TGA boundaries, indemnity insurer positions. The legal scaffolding everything else relies on.',
    loadBearing: true,
  },
  {
    slug: 'module-2-tools',
    number: 2,
    title: 'Tool Selection & Data Sovereignty',
    durationMin: 20,
    description: 'Three-tier framework for choosing LLMs. Healthcare-purpose-built tools (Heidi, Lyrebird), enterprise AU-residency LLMs, consumer LLMs. When each is appropriate.',
  },
  {
    slug: 'module-3-documentation',
    number: 3,
    title: 'Documentation Workflows (Compliant by Design)',
    durationMin: 20,
    description: 'AI scribes, SOAP note refinement, treatment plans, workers comp, discharge summaries, mental health care plans. Practical workflows that survive an AHPRA audit.',
  },
  {
    slug: 'module-4-patient-comms',
    number: 4,
    title: 'Patient Communication & Documents',
    durationMin: 15,
    description: 'Patient info sheets, exercise programs, referral letters, return-to-work/school certificates, multilingual translation, discharge instructions.',
  },
  {
    slug: 'module-5-physio',
    number: 5,
    title: 'Specialty Deep Dive — Physiotherapy',
    durationMin: 8,
    description: 'Exercise prescription, return-to-sport, treatment summaries, pain education. 3-prompt starter kit.',
  },
  {
    slug: 'module-5-naturopath',
    number: 5,
    title: 'Specialty Deep Dive — Naturopathy',
    durationMin: 8,
    description: 'Supplement education sheets, diet plans, herb-drug interactions. TGA-careful framing throughout.',
  },
  {
    slug: 'module-5-gp',
    number: 5,
    title: 'Specialty Deep Dive — General Practice',
    durationMin: 8,
    description: 'Referrals, mental health care plans, chronic disease management, polypharmacy support.',
  },
  {
    slug: 'module-5-osteopath',
    number: 5,
    title: 'Specialty Deep Dive — Osteopathy',
    durationMin: 7,
    description: 'Treatment notes, exercise/posture sheets, progress reports, return-to-work documentation.',
  },
  {
    slug: 'module-6-hub-and-certification',
    number: 6,
    title: 'Hub Onboarding & Certification',
    durationMin: 10,
    description: 'Tour of the AI Practice Hub, prompt library, tool comparison matrix, monthly update feed, certification quiz.',
  },
]

export function findModule(slug: string): ModuleMeta | undefined {
  return MODULES.find((m) => m.slug === slug)
}

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
      templates.push({ slug, title: slug, specialty: 'all', useCase: '', body: raw })
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
    })
  }
  return templates
}
