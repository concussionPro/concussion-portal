/**
 * The paid course's answer keys must never ship in a public client chunk.
 *
 * WHAT WENT WRONG. app/modules/[id]/FlagshipModuleClient.tsx statically
 * imported components/course/SectionInteractiveElements.tsx — a 'use client'
 * file holding all 152 CCM interactive elements as hardcoded JSX. Next bundled
 * it into a chunk served to ANY anonymous visitor, so the whole $1,190 course's
 * marking scheme (76 correctAnswer values, 54 clinicalReasoning blocks) was
 * readable with a single unauthenticated curl. Verified live before the fix.
 *
 * THE FIX. The specs are data (data/module-interactives.ts, attached to
 * Section.interactives in data/modules.ts) and travel inside the
 * entitlement-gated module payload, rendering through SectionDataInteractives.
 *
 * These tests fail if any of that is undone.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SectionDataInteractives } from '@/components/course/SectionDataInteractives'
import { MODULE_INTERACTIVES } from '@/data/module-interactives'
import { getAllModules } from '@/data/modules'
import { resolveModuleForAccess } from '@/lib/module-access'
import { getPreviewContent } from '@/lib/preview-content'

const ROOT = path.resolve(__dirname, '..')
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8')
/** Source with comments removed — a comment explaining the fix is not the bug. */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

// ---------------------------------------------------------------------------
// 1. Nothing a browser downloads may reach the course content.
// ---------------------------------------------------------------------------

const SOURCE_DIRS = ['app', 'components', 'lib', 'data', 'hooks', 'contexts']

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') sourceFiles(p, out)
    } else if (/\.tsx?$/.test(entry.name)) out.push(p)
  }
  return out
}

function resolveSpec(spec: string, from: string): string | null {
  let base: string
  if (spec.startsWith('@/')) base = path.join(ROOT, spec.slice(2))
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec)
  else return null
  const candidates = [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx'), base]
  for (const c of candidates) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
  return null
}

/**
 * VALUE imports only. `import type { Section } from '@/data/modules'` is erased
 * at compile time and puts nothing in a bundle — counting it would make this
 * test unsatisfiable, since the client renderer legitimately imports the types.
 */
function valueImports(file: string, sourceOf?: Map<string, string>): string[] {
  const src = (sourceOf?.get(file) ?? read(path.relative(ROOT, file)))
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
  const specs: string[] = []
  const withClause = /(?:^|\n)\s*(?:import|export)\s+([\s\S]*?)\s*from\s*['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = withClause.exec(src))) {
    if (/^type\b/.test(m[1].trim())) continue
    specs.push(m[2])
  }
  const sideEffect = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g
  while ((m = sideEffect.exec(src))) specs.push(m[1])
  return specs.map((s) => resolveSpec(s, file)).filter((s): s is string => s !== null)
}

const files = SOURCE_DIRS.flatMap((d) => sourceFiles(path.join(ROOT, d)))
const isClientEntry = (f: string) => /^\s*['"]use client['"]/m.test(fs.readFileSync(f, 'utf8').slice(0, 400))

/**
 * Every module Next can pull into a browser bundle, with the chain that did it.
 *
 * `extraEntries` injects synthetic 'use client' files (path -> source) WITHOUT
 * writing to disk. Only the negative-control test uses it, to prove the walk
 * actually catches a leak rather than passing because it found nothing.
 */
function clientReachable(extraEntries: Map<string, string> = new Map()): Map<string, string[]> {
  const chains = new Map<string, string[]>()
  const queue: string[] = []
  for (const f of [...files, ...extraEntries.keys()]) {
    if (extraEntries.has(f) || isClientEntry(f)) {
      chains.set(f, [f])
      queue.push(f)
    }
  }
  while (queue.length) {
    const cur = queue.shift()!
    for (const dep of valueImports(cur, extraEntries)) {
      if (chains.has(dep)) continue
      chains.set(dep, [...chains.get(cur)!, dep])
      queue.push(dep)
    }
  }
  return chains
}

describe('paid answer keys stay out of public client chunks', () => {
  const reachable = clientReachable()
  const rel = (p: string) => path.relative(ROOT, p)

  it.each([
    'data/module-interactives.ts',
    'data/modules.ts',
    'data/scat-modules.ts',
    'data/ep-modules/index.ts',
    // CRM (EP course). Its 157 interactive specs and its eight module content
    // files carry the same kind of answer key CCM's do, and the same rule
    // applies: they may only travel inside the entitlement-gated payload.
    'data/ep-module-interactives.ts',
    'data/ep-modules/module-1.ts',
    'data/ep-modules/module-2.ts',
    'data/ep-modules/module-3.ts',
    'data/ep-modules/module-4.ts',
    'data/ep-modules/module-5.ts',
    'data/ep-modules/module-6.ts',
    'data/ep-modules/module-7.ts',
    'data/ep-modules/module-8.ts',
  ])('%s is never reachable from a client component', (target) => {
    const abs = path.join(ROOT, target)
    const chain = reachable.get(abs)
    expect(
      chain === undefined,
      chain
        ? `${target} would ship to the browser via:\n    ${chain.map(rel).join('\n -> ')}`
        : '',
    ).toBe(true)
  })

  it('the client-reachability walk actually works (guards the guard)', () => {
    // A known client component and one of its real value imports must both be
    // seen — otherwise the assertions above could pass because the walk found
    // nothing at all.
    expect(reachable.size).toBeGreaterThan(50)
    expect(reachable.has(path.join(ROOT, 'components/course/SectionDataInteractives.tsx'))).toBe(true)
    expect(reachable.has(path.join(ROOT, 'components/course/InteractiveElements.tsx'))).toBe(true)
  })

  it.each([
    ['data/ep-module-interactives.ts', "import { EP_MODULE_INTERACTIVES } from '@/data/ep-module-interactives'"],
    ['data/ep-modules/module-4.ts', "import { module4 } from '@/data/ep-modules/module-4'"],
    ['data/ep-modules/index.ts', "import { getEpModules } from '@/data/ep-modules'"],
  ])('the walk WOULD catch %s becoming client-reachable (negative control)', (target, importLine) => {
    // Without this, the assertions above could pass for the wrong reason. A
    // synthetic 'use client' entry that value-imports the EP data must show up
    // as reachable — and the reported chain must start at that entry.
    const fake = path.join(ROOT, 'components/__leak-probe.tsx')
    const probe = clientReachable(
      new Map([[fake, `'use client'\n${importLine}\nexport const X = 1\n`]]),
    )
    const chain = probe.get(path.join(ROOT, target))
    expect(chain, `${target} should be reachable from the synthetic client entry`).toBeTruthy()
    expect(chain![0]).toBe(fake)

    // …and the probe must not exist on disk, so it can never leak for real.
    expect(fs.existsSync(fake)).toBe(false)
  })

  it('the flagship course declares no code-authored interactive component', () => {
    // The exact regression: a JSX interactives file imported by the client
    // module page is what leaked the keys.
    const client = code(read('app/modules/[id]/FlagshipModuleClient.tsx'))
    expect(client).not.toMatch(/InteractiveComponent:/)
    expect(fs.existsSync(path.join(ROOT, 'components/course/SectionInteractiveElements.tsx'))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 2. The content itself is unchanged — this was a delivery-mechanism change.
// ---------------------------------------------------------------------------

/**
 * SHA-256 of JSON.stringify(MODULE_INTERACTIVES) — every question, option,
 * answer index, explanation, scenario branch and clinical-reasoning block, in
 * order. Recorded at the migration, when rendering the data through
 * SectionDataInteractives was proven byte-identical to rendering the original
 * hardcoded JSX from a pristine checkout: all 244 (module, section, isPreview)
 * combinations, zero differences.
 *
 * If this moves, CLINICAL TEACHING CONTENT changed. That must be a deliberate,
 * reviewed edit — never a refactor side effect. Re-record it in the same commit
 * as the content change, not before.
 *
 * (The digest is taken over the DATA, not the rendered HTML: OrderingExercise
 * and MatchingExercise shuffle their items on mount by design, so rendered
 * markup is intentionally nondeterministic and cannot be hashed.)
 */
const COURSE_INTERACTIVES_DIGEST = 'b5d5530875e928ad002ca135f99da86e90ad25f4eedf4877ef6f0639835dc921'

describe('the migrated CCM interactives are byte-identical to the JSX they replaced', () => {
  it('every clinical string is unchanged', () => {
    const json = JSON.stringify(MODULE_INTERACTIVES)
    expect(json.length).toBe(139540)
    expect(createHash('sha256').update(json).digest('hex')).toBe(COURSE_INTERACTIVES_DIGEST)
  })

  it('every keyed section still renders its widgets', () => {
    // Catches the worst outcome of a bad migration: a paying customer opening a
    // module that silently renders nothing where a quiz used to be.
    let nonEmpty = 0
    for (const module of getAllModules()) {
      for (const section of module.sections) {
        const html = renderToStaticMarkup(
          createElement(SectionDataInteractives, { specs: section.interactives, isPreview: false }),
        )
        if (html !== '') nonEmpty++
      }
    }
    expect(nonEmpty).toBe(85)
  })

  it('still holds all 152 widgets, in the original per-kind counts', () => {
    const all = Object.values(MODULE_INTERACTIVES).flatMap((m) => Object.values(m).flat())
    expect(all.length).toBe(152)
    const byKind: Record<string, number> = {}
    for (const spec of all) byKind[spec.kind] = (byKind[spec.kind] ?? 0) + 1
    expect(byKind).toEqual({
      'quick-check': 69,
      'multi-select': 7,
      insight: 21,
      'key-concept': 20,
      flowchart: 12,
      scenario: 12,
      ordering: 7,
      matching: 4,
    })
  })

  it('every data-authored key names a real section of that module', () => {
    // A typo'd section id renders NOTHING for a paying customer, silently.
    const modules = getAllModules()
    for (const [moduleId, sections] of Object.entries(MODULE_INTERACTIVES)) {
      const module = modules.find((m) => m.id === Number(moduleId))
      expect(module, `module ${moduleId} exists`).toBeTruthy()
      for (const sectionId of Object.keys(sections)) {
        expect(
          module!.sections.some((s) => s.id === sectionId),
          `module ${moduleId} has a section '${sectionId}'`,
        ).toBe(true)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 3. The entitlement gate is what decides who gets them.
// ---------------------------------------------------------------------------

describe('interactives are delivered by the entitled payload, not the bundle', () => {
  it('a full-access user receives every interactive of every module', () => {
    let total = 0
    for (let id = 1; id <= 8; id++) {
      const res = resolveModuleForAccess(id, 'full-course')
      expect(res.ok, `module ${id} readable with full access`).toBe(true)
      if (!res.ok) continue
      total += res.module.sections.reduce((n, s) => n + (s.interactives?.length ?? 0), 0)
    }
    expect(total).toBe(152)
  })

  it('a free-tier visitor receives only the trial sections’ interactives', () => {
    // Module 1's opening sections are the public trial and always were; every
    // other module is locked and must hand over nothing.
    let leaked = 0
    for (let id = 2; id <= 8; id++) {
      const res = resolveModuleForAccess(id, 'preview')
      if (res.ok) leaked += res.module.sections.reduce((n, s) => n + (s.interactives?.length ?? 0), 0)
    }
    expect(leaked).toBe(0)

    const one = resolveModuleForAccess(1, 'preview')
    expect(one.ok).toBe(true)
    if (!one.ok) return
    const shown = one.module.sections.reduce((n, s) => n + (s.interactives?.length ?? 0), 0)
    expect(shown).toBeLessThan(152)
    expect(shown).toBeGreaterThan(0)
  })

  it('the public trial still ships its own widgets, and only its own', () => {
    // /preview used to render these by importing the whole JSX file, so the
    // trial page carried all eight modules' answer keys to show Module 1's
    // myths quiz. It must keep showing exactly what it showed before.
    const preview = getPreviewContent('ccm')
    const one = preview.find((m) => m.id === 1)!
    expect(one.previewSections.flatMap((s) => s.interactives ?? []).length).toBe(12)
    expect(
      one.previewSections.find((s) => s.id === 'myths-intro')?.interactives?.length,
      'the ten-question myths quiz is the trial’s hook',
    ).toBe(10)

    const rest = preview.filter((m) => m.id !== 1)
    expect(rest.flatMap((m) => m.previewSections).flatMap((s) => s.interactives ?? []).length).toBe(0)
  })
})
