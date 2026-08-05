/**
 * CRM (Concussion Rehab Mastery) reference database.
 *
 * The EP modules author their citations as plain APA strings on
 * `Module.clinicalReferences`. That is the right authoring format — one string,
 * no fields to keep in sync — but it gave the CRM buyer a flat, unsearchable
 * list per module while the CCM buyer got the structured, searchable Reference
 * Repository (data/references.ts → /references).
 *
 * This module closes that gap WITHOUT restating a single citation: it derives
 * structured fields FROM the authored strings, and the authored string is what
 * is displayed. Parsing only powers search, sort and the module filter — if a
 * citation doesn't match the expected APA shape the derived fields are simply
 * empty and the full string still renders verbatim. No citation is ever
 * rewritten, invented or dropped.
 *
 * SERVER-ONLY — imports the paid EP module content. Call it from a server
 * component behind the CRM gate (app/ep-course/references) and pass the result
 * down; never import it from a 'use client' file.
 */
import { getEpModules, epDisplayId } from '@/data/ep-modules'

export interface EpReference {
  /**
   * Stable key derived from the citation text. UNIQUE across the repository —
   * it is the React list key in EpReferenceSearch, and truncating it collided
   * on 5 of 63 rows (two Patricios 2023 spellings, two Giza 2014, two Haider
   * 2018, two ESSA scope entries all share their first 80 characters).
   */
  id: string
  /** The citation EXACTLY as authored in the module. Always displayed. */
  citation: string
  /** Author block before the year, when the string parses. */
  authors: string
  /** Publication year, when the string parses. */
  year: string
  /** Title sentence, when the string parses. */
  title: string
  /** Journal / publisher remainder, when the string parses. */
  source: string
  /** First URL embedded in the citation (usually the DOI link). */
  url?: string
  /** DISPLAY module ids (1-8) this citation is cited by, ascending. */
  modules: number[]
}

/** First http(s) URL in the string, trailing punctuation trimmed. */
function extractUrl(ref: string): string | undefined {
  const m = ref.match(/https?:\/\/\S+/)
  if (!m) return undefined
  return m[0].replace(/[.,;)]+$/, '')
}

/**
 * Split an APA citation into its parts. Deliberately conservative: anything
 * that doesn't match returns empty fields rather than a guess.
 *
 * Shape handled: `Authors (Year). Title. Source.` with an optional trailing URL.
 */
function parseApa(ref: string): { authors: string; year: string; title: string; source: string } {
  const withoutUrl = ref.replace(/https?:\/\/\S+/g, '').trim()
  // [\s\S] rather than the `s` flag — the tsconfig target predates es2018.
  const m = withoutUrl.match(/^([\s\S]*?)\s*\((\d{4}[a-z]?)\)\.\s*([\s\S]*)$/)
  if (!m) return { authors: '', year: '', title: '', source: '' }
  const [, authors, year, rest] = m
  // First sentence of the remainder is the title; the rest is the source.
  const dot = rest.indexOf('. ')
  const title = dot > 0 ? rest.slice(0, dot) : rest.replace(/\.\s*$/, '')
  const source = dot > 0 ? rest.slice(dot + 2).replace(/\.\s*$/, '') : ''
  return { authors: authors.trim(), year, title: title.trim(), source: source.trim() }
}

/** Normalised key so the same citation cited by two modules collapses to one row. */
function keyFor(ref: string): string {
  return ref.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim()
}

/**
 * Every CRM citation, deduplicated across modules, in authored order.
 *
 * Deduplication is why the repository count is lower than the sum of the
 * per-module counts: the same paper legitimately underpins several modules and
 * is listed once here, tagged with every module that cites it.
 */
export function getEpReferences(): EpReference[] {
  const byKey = new Map<string, EpReference>()

  for (const m of getEpModules()) {
    const moduleId = epDisplayId(m.id)
    for (const raw of m.clinicalReferences ?? []) {
      const citation = raw.trim()
      if (!citation) continue
      const key = keyFor(citation)
      const existing = byKey.get(key)
      if (existing) {
        if (!existing.modules.includes(moduleId)) existing.modules.push(moduleId)
        continue
      }
      byKey.set(key, {
        id: key.replace(/ /g, '-'),
        citation,
        ...parseApa(citation),
        url: extractUrl(citation),
        modules: [moduleId],
      })
    }
  }

  const out = [...byKey.values()]
  for (const r of out) r.modules.sort((a, b) => a - b)
  return out
}

/** Total citations across the modules INCLUDING repeats (the per-module sum). */
export function epCitationTotal(): number {
  return getEpModules().reduce((s, m) => s + (m.clinicalReferences?.length ?? 0), 0)
}
