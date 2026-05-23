/**
 * Splits a markdown module into sections at H2 boundaries, then attaches
 * per-section interactive elements (quiz checks, activity prompts, "try
 * this" cards) so the AI course mirrors the concussion course's chunked
 * structure rather than a wall of prose.
 *
 * Per-module section quizzes live in section-quizzes.ts. They are
 * lightweight 1-2 question knowledge checks — NOT the final certification
 * quiz (which is in quiz.ts). A learner can skip them; they exist to keep
 * engagement and reinforce key concepts mid-module.
 */

import { SECTION_QUIZZES } from './section-quizzes'
import { extractPromptForms, type PromptFormData } from './prompt-form-extract'

export interface ParsedSection {
  /** Stable slug derived from the heading text — used as DOM id + stepper key */
  id: string
  /** H2 heading text (without "## ") */
  title: string
  /** Section index within the module, 0-based */
  index: number
  /** Estimated reading minutes for this section */
  readingMin: number
  /** Markdown body of the section (between this H2 and the next, or EOF) */
  body: string
  /** Auto-extracted interactive prompt forms (replace [PROMPT-FORM-AUTO: N] in body) */
  promptForms?: PromptFormData[]
  /** Optional inline quiz check that appears at the END of this section */
  quizCheck?: SectionQuizCheck
  /** Optional "Apply tomorrow" prompt at the end of this section */
  applyTomorrow?: string
}

export interface SectionQuizCheck {
  question: string
  options: string[]
  correctIndex: number
  rationale: string
}

const HEADER_BLOCK_END_MARKER = /^---\s*$/m

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

function estimateReadingMin(text: string): number {
  // ~220 words per minute reading speed for clinical content (slower than
  // pop-prose because of density and reference checking).
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

/**
 * Strip the module frontmatter (everything up to and including the first
 * `---` line that's followed by content with H2 sections). Returns the
 * remaining markdown body.
 */
function stripModuleFrontmatter(raw: string): { header: string; body: string } {
  // The module files use a frontmatter pattern: title block, then a `---`
  // separator, then prose. We preserve the header block to render above
  // the section stepper.
  const lines = raw.split('\n')
  // Find first `---` line (header separator)
  const firstHr = lines.findIndex((l, i) => i > 0 && /^---\s*$/.test(l))
  if (firstHr === -1) return { header: '', body: raw }
  const header = lines.slice(0, firstHr).join('\n')
  const body = lines.slice(firstHr + 1).join('\n')
  return { header, body }
}

export function parseModuleSections(moduleSlug: string, raw: string): {
  header: string
  sections: ParsedSection[]
} {
  const { header, body } = stripModuleFrontmatter(raw)
  const lines = body.split('\n')
  const sections: ParsedSection[] = []

  // Walk through lines, collecting blocks under each H2
  let currentTitle: string | null = null
  let currentLines: string[] = []
  let index = 0
  const moduleQuizzes = SECTION_QUIZZES[moduleSlug] || {}

  const finalize = () => {
    if (currentTitle === null) {
      // Pre-first-H2 prose goes into an "intro" section if any meaningful content exists
      const intro = currentLines.join('\n').trim()
      if (intro.length > 40) {
        const id = 'intro'
        const { transformed, forms } = extractPromptForms(intro)
        const sectionMin = estimateReadingMin(transformed)
        sections.push({
          id,
          title: 'Overview',
          index: index++,
          readingMin: sectionMin,
          body: transformed,
          promptForms: forms.length ? forms : undefined,
          quizCheck: moduleQuizzes[id],
        })
      }
      return
    }
    const sectionBody = currentLines.join('\n').trim()
    const { transformed, forms } = extractPromptForms(sectionBody)
    const id = slugify(currentTitle)
    sections.push({
      id,
      title: currentTitle,
      index: index++,
      readingMin: estimateReadingMin(transformed),
      body: transformed,
      promptForms: forms.length ? forms : undefined,
      quizCheck: moduleQuizzes[id],
    })
  }

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      finalize()
      currentTitle = line.replace(/^##\s+/, '').trim()
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }
  finalize()

  return { header, sections }
}
