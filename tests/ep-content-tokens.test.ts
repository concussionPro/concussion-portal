/**
 * EP course content-DSL validation.
 *
 * Module content lives in TS string arrays using an inline token DSL
 * ([CALLOUT: …], [VIDEO: …], [INFOGRAPHIC: …], …) that
 * DynamicContentRenderer.tsx interprets with anchored regexes. A typo'd
 * token used to fall through every handler and render the raw "[CALLOUT: …]"
 * string on the page. The renderer now has a generic leak guard (unmatched
 * `[TOKEN:` lines render nothing), and THIS test catches the typo at build
 * time so the content never silently loses a callout/video either.
 *
 * Grammar mirrors the renderer — keep the two in sync (see
 * components/course/DynamicContentRenderer.tsx token handlers).
 */
import { describe, it, expect } from 'vitest'
import { epModules as EP_MODULES } from '@/data/ep-modules'
import { getEpInfographic } from '@/components/course/ep-infographics'

/** [name, full-match grammar] — must mirror DynamicContentRenderer.tsx. */
const TOKEN_GRAMMARS: Array<[string, RegExp]> = [
  ['REVEAL', /^\[REVEAL:\s*[^|]+?\s*\|\s*[\s\S]+?\s*\]$/],
  ['POLL', /^\[POLL:\s*[\s\S]+?\s*\|\|\s*\d+\s*\|\s*[\s\S]+?\s*\]$/],
  ['VIDEO', /^\[VIDEO:\s*[^\]|]+?\s*\|\s*[^\]]+?\s*\]$/],
  ['INFOGRAPHIC', /^\[INFOGRAPHIC:\s*[a-z0-9-]+\s*\]$/],
  [
    'CALLOUT',
    /^\[CALLOUT:\s*(warning|evidence|clinical|key|scope|tip|example)\s*\|\s*.+\]$/,
  ],
  ['QUOTE', /^\[QUOTE:\s*[^|]+?\s*\|\s*.+\]$/],
  ['HIGHLIGHT', /^\[HIGHLIGHT:\s*.+\]$/],
]

/** Every content line in every EP module that looks like a token. */
function tokenLines(): Array<{ where: string; line: string }> {
  const out: Array<{ where: string; line: string }> = []
  for (const mod of EP_MODULES) {
    for (const section of mod.sections) {
      for (const line of section.content) {
        if (/^\[[A-Z]+:/.test(line)) {
          out.push({ where: `module ${mod.id} · section ${section.id}`, line })
        }
      }
    }
  }
  return out
}

describe('EP content DSL tokens', () => {
  const lines = tokenLines()

  it('finds a sensible number of tokens (sanity: DSL is in use)', () => {
    expect(lines.length).toBeGreaterThan(100)
  })

  it('every token line uses a known token type', () => {
    const unknown = lines.filter(
      ({ line }) => !TOKEN_GRAMMARS.some(([name]) => line.startsWith(`[${name}:`)),
    )
    expect(
      unknown.map((u) => `${u.where}: ${u.line.slice(0, 80)}`),
    ).toEqual([])
  })

  it('every token line fully matches its grammar (no malformed tokens)', () => {
    const malformed = lines.filter(({ line }) => {
      const grammar = TOKEN_GRAMMARS.find(([name]) => line.startsWith(`[${name}:`))
      return grammar ? !grammar[1].test(line) : false
    })
    expect(
      malformed.map((m) => `${m.where}: ${m.line.slice(0, 100)}`),
    ).toEqual([])
  })

  it('every [INFOGRAPHIC: id] resolves to a registered component', () => {
    const unregistered = lines
      .filter(({ line }) => line.startsWith('[INFOGRAPHIC:'))
      .map(({ where, line }) => ({
        where,
        id: line.match(/^\[INFOGRAPHIC:\s*([a-z0-9-]+)\s*\]$/)?.[1] ?? line,
      }))
      .filter(({ id }) => !getEpInfographic(id))
    expect(unregistered).toEqual([])
  })

  it('quiz shape: every module quiz question has a valid correctAnswer index', () => {
    for (const mod of EP_MODULES) {
      for (const q of mod.quiz) {
        expect(q.correctAnswer).toBeGreaterThanOrEqual(0)
        expect(q.correctAnswer).toBeLessThan(q.options.length)
      }
    }
  })
})
