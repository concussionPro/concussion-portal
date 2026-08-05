import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { getAllModules } from '../data/modules'
import { getEpModules } from '../data/ep-modules'
import { getSCATModules } from '../data/scat-modules'
import { epDisplayId } from '../data/ep-modules'

/**
 * The distinctive prose of every interactive belonging to a section the public
 * trial does NOT unlock — questions, explanations, scenario narratives and
 * clinical reasoning. None of it may appear in the trial payload.
 *
 * Long strings only: a widget's short TITLE is often the section title too, and
 * section titles ship on purpose (the lock overlay advertises what's behind the
 * paywall). Prose is what must never leak.
 */
function lockedInteractives(course: 'ccm' | 'crm', displayId: number, unlocked: Set<string>): string[] {
  const modules = course === 'crm' ? getEpModules() : getAllModules()
  const module = modules.find((m) => (course === 'crm' ? epDisplayId(m.id) : m.id) === displayId)
  if (!module) return []
  const strings: string[] = []
  const collect = (value: unknown) => {
    if (typeof value === 'string') {
      if (value.length > 60) strings.push(value)
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(collect)
    }
  }
  module.sections.filter((s) => !unlocked.has(s.id)).forEach((s) => collect(s.interactives ?? []))
  return strings
}

/**
 * COURSE CONTENT INTEGRITY.
 *
 * Module content is authored as `string[]` carrying an embedded DSL —
 * `[CALLOUT: type | text]`, `[INFOGRAPHIC: id]`, `[VIDEO: youtubeId | title]`,
 * `[HIGHLIGHT: ...]` — parsed at render time by DynamicContentRenderer. The
 * parser's failure modes are SILENT or UGLY, never loud:
 *
 *   - an unknown `[INFOGRAPHIC: id]` renders `null`  → content just vanishes
 *     from a paid module and nobody finds out;
 *   - an unrecognised `[CALLOUT: type]` falls through → the raw marker text is
 *     printed to a paying customer. This ALREADY HAPPENED across EP modules 4-8
 *     (see the `scope`/`tip`/`example` entries added to the callout config).
 *
 * Nothing else validates this: the content is plain TypeScript strings, so the
 * compiler can't help, and a typo ships. These tests turn both failure modes
 * into a red build.
 */

const REPO = join(__dirname, '..')

/** Every content line across every course, tagged with where it came from. */
function allContentLines(): Array<{ where: string; line: string }> {
  const out: Array<{ where: string; line: string }> = []
  const push = (course: string, mods: Array<{ id: number; sections: Array<{ id: string; content: string[] }> }>) => {
    for (const m of mods) {
      for (const s of m.sections) {
        for (const line of s.content) {
          out.push({ where: `${course} module ${m.id} / section "${s.id}"`, line })
        }
      }
    }
  }
  push('CCM', getAllModules() as never)
  push('CRM', getEpModules() as never)
  push('SCAT', getSCATModules() as never)
  return out
}

/** Callout types DynamicContentRenderer actually handles. */
const KNOWN_CALLOUT_TYPES = ['warning', 'evidence', 'clinical', 'key', 'scope', 'tip', 'example']

/** Infographic ids the registry can resolve. */
function registeredInfographicIds(): Set<string> {
  const dir = join(REPO, 'components/course/ep-infographics')
  const ids = new Set<string>()
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.tsx') && !f.endsWith('.ts')) continue
    const src = readFileSync(join(dir, f), 'utf8')
    // Registry entries and config maps are keyed by quoted kebab-case ids.
    for (const m of src.matchAll(/^\s*'([a-z0-9][a-z0-9-]*)':/gm)) ids.add(m[1])
  }
  return ids
}

describe('content DSL markers are all parseable', () => {
  const lines = allContentLines()

  it('finds a non-trivial amount of content to check', () => {
    expect(lines.length).toBeGreaterThan(1000)
  })

  it('every [CALLOUT: …] uses a type the renderer handles', () => {
    const bad: string[] = []
    for (const { where, line } of lines) {
      for (const m of line.matchAll(/\[CALLOUT:\s*([a-zA-Z]+)\s*\|/g)) {
        if (!KNOWN_CALLOUT_TYPES.includes(m[1])) bad.push(`${where}: unknown callout type '${m[1]}'`)
      }
    }
    expect(bad, `unhandled callout types leak their raw marker text to paying users:\n${bad.join('\n')}`).toEqual([])
  })

  it('every [CALLOUT: …] closes on its own line (the regex is anchored)', () => {
    // DynamicContentRenderer matches /^\[CALLOUT:…\]$/ — a marker that opens but
    // never closes on the same line renders as raw text.
    const bad = lines
      .filter(({ line }) => line.trimStart().startsWith('[CALLOUT:') && !line.trimEnd().endsWith(']'))
      .map(({ where }) => where)
    expect(bad, `unterminated CALLOUT markers:\n${bad.join('\n')}`).toEqual([])
  })

  it('every [INFOGRAPHIC: id] resolves to a registered component', () => {
    const registered = registeredInfographicIds()
    const bad: string[] = []
    for (const { where, line } of lines) {
      for (const m of line.matchAll(/\[INFOGRAPHIC:\s*([a-z0-9-]+)\s*\]/g)) {
        if (!registered.has(m[1])) bad.push(`${where}: '${m[1]}'`)
      }
    }
    expect(bad, `these render as NOTHING — content silently disappears:\n${bad.join('\n')}`).toEqual([])
  })

  it('every [VIDEO: …] has a plausible YouTube id and a title', () => {
    const bad: string[] = []
    for (const { where, line } of lines) {
      for (const m of line.matchAll(/\[VIDEO:\s*([^\]|]+?)\s*\|\s*([^\]]*?)\s*\]/g)) {
        const id = m[1].split('&')[0]
        if (!/^[A-Za-z0-9_-]{11}$/.test(id)) bad.push(`${where}: bad video id '${id}'`)
        if (!m[2].trim()) bad.push(`${where}: video '${id}' has no title (iframe a11y)`)
      }
    }
    expect(bad, bad.join('\n')).toEqual([])
  })

  it('no content marker exists that the renderer has no handler for', () => {
    // Derive the handled set FROM the renderer rather than hardcoding it, so
    // adding a marker to DynamicContentRenderer doesn't leave this test stale
    // (and so removing a handler while content still uses it fails loudly).
    const renderer = readFileSync(join(REPO, 'components/course/DynamicContentRenderer.tsx'), 'utf8')
    const handled = new Set(
      [...renderer.matchAll(/match\(\/\^\\\[([A-Z][A-Z_]+):/g)].map((m) => m[1]),
    )
    expect(handled.size, 'could not detect any marker handlers — the parser shape changed').toBeGreaterThan(3)

    const bad: string[] = []
    for (const { where, line } of lines) {
      for (const m of line.matchAll(/\[([A-Z][A-Z_]{2,}):/g)) {
        if (!handled.has(m[1])) bad.push(`${where}: '[${m[1]}:' has no handler`)
      }
    }
    expect(bad, `unhandled markers render as raw text or vanish:\n${bad.join('\n')}`).toEqual([])
  })

  it('inline interactives are well-formed (a malformed one silently vanishes)', () => {
    // DynamicContentRenderer anchors these and returns null on no-match, so a
    // missing `||` or a non-numeric answer index deletes the interactive from a
    // paid module with no error anywhere.
    const bad: string[] = []
    for (const { where, line } of lines) {
      const t = line.trim()
      if (t.startsWith('[POLL:') && !/^\[POLL:\s*[\s\S]+?\s*\|\|\s*\d+\s*\|\s*[\s\S]+?\s*\]$/.test(t)) {
        bad.push(`${where}: malformed POLL (needs "question | optA | optB || correctIndex | explanation")`)
      }
      if (t.startsWith('[REVEAL:') && !/^\[REVEAL:\s*[^|]+?\s*\|\s*[\s\S]+?\s*\]$/.test(t)) {
        bad.push(`${where}: malformed REVEAL (needs "prompt | answer")`)
      }
      if (t.startsWith('[QUOTE:') && !/^\[QUOTE:\s*[^|]+?\s*\|\s*(.+)\]$/.test(t)) {
        bad.push(`${where}: malformed QUOTE (needs "attribution | content")`)
      }
    }
    expect(bad, bad.join('\n')).toEqual([])
  })
})

describe('module structure is sound', () => {
  const courses: Array<[string, ReturnType<typeof getAllModules>]> = [
    ['CCM', getAllModules()],
    ['CRM', getEpModules() as never],
    ['SCAT', getSCATModules() as never],
  ]

  it.each(courses)('%s modules have unique ids and non-empty sections', (name, mods) => {
    const ids = mods.map((m) => m.id)
    expect(new Set(ids).size, `${name}: duplicate module ids`).toBe(ids.length)
    for (const m of mods) {
      expect(m.sections.length, `${name} module ${m.id} has no sections`).toBeGreaterThan(0)
      const sectionIds = m.sections.map((s) => s.id)
      expect(
        new Set(sectionIds).size,
        `${name} module ${m.id}: duplicate section ids (breaks the section checkpoint + stepper)`,
      ).toBe(sectionIds.length)
      for (const s of m.sections) {
        expect(s.title?.trim(), `${name} module ${m.id} section '${s.id}' has no title`).toBeTruthy()
        expect(s.content.length, `${name} module ${m.id} section '${s.id}' is empty`).toBeGreaterThan(0)
      }
    }
  })

  // The Reference Repository size is quoted on public marketing surfaces, so it
  // has to be a fact, not a vibe. It was live as "140+", "136 peer-reviewed" AND
  // a fabricated "120" simultaneously. REFERENCE_COUNT is a client-safe literal
  // (data/references.ts is paid content and must never enter a client bundle) —
  // this test is what keeps that literal honest.
  it('REFERENCE_COUNT matches the real reference dataset', async () => {
    const { references } = await import('../data/references')
    const { REFERENCE_COUNT } = await import('../data/reference-count')
    expect(
      REFERENCE_COUNT,
      'data/reference-count.ts is out of sync with data/references.ts — update the literal',
    ).toBe(references.length)
    const ids = references.map((r) => r.id)
    expect(new Set(ids).size, 'duplicate reference ids inflate the public count').toBe(ids.length)
  })

  it('the public trial never exposes quiz answers or more than its unlocked sections', async () => {
    const { getPreviewContent, MODULE_1_PREVIEW_COUNT } = await import('../lib/preview-content')
    for (const course of ['ccm', 'crm'] as const) {
      const data = getPreviewContent(course)
      expect(data.length).toBeGreaterThan(0)
      for (const m of data) {
        const expected = m.id === 1 ? MODULE_1_PREVIEW_COUNT : 1
        expect(m.previewSections.length, `${course} module ${m.id} unlocked too much`).toBeLessThanOrEqual(expected)
        // The payload carries no `quiz` field at all — the graded assessment's
        // answers must never ship to an unentitled visitor.
        expect(m).not.toHaveProperty('quiz')
        // Interactives ARE carried, but only for the unlocked sections: those
        // widgets are the trial itself (Module 1's myths quiz), and they have
        // always rendered on this page. Anything belonging to a LOCKED section
        // must be absent — that is the leak this file guards.
        const payload = JSON.stringify(m)
        const unlocked = new Set(m.previewSections.map((s) => s.id))
        for (const spec of lockedInteractives(course, m.id, unlocked)) {
          expect(payload, `${course} module ${m.id} leaked a locked interactive`).not.toContain(spec)
        }
      }
    }
  })
})
