/**
 * CLASS-WIDE REGRESSION GUARDS.
 *
 * Every other test in tests/ pins a defect. These pin CLASSES — the shapes
 * that kept coming back through the 2026-08 sweep in a different file each
 * time, where no unit test is possible because the bug is "some file
 * somewhere does X".
 *
 * The model is tests/course-answer-key-exposure.test.ts: walk the repo, apply
 * one rule to every file, and prove the walk works by feeding it a synthetic
 * offender. Each detector here is a PURE function of (path, source), so the
 * negative controls run entirely in memory — nothing is ever written to disk,
 * which is the only way a probe for a leak can be guaranteed not to become
 * the leak.
 *
 * The five classes, and why each earned a guard:
 *
 *  1. FIRST PAINT WAS EMPTY (adf2382f). SstEntry initialised state to
 *     'deciding' and returned null until a client effect resolved, so
 *     /sst-trainer — the site's #2 landing page — served 85 characters to
 *     crawlers and slow phones. Class: any page's painting component whose
 *     render returns null for the INITIAL value of its own state.
 *  2. A MARKETING LINK POINTING AT A REDIRECT (adf2382f). "I'm a clinician"
 *     and "See the platform" both pointed at /platform, whose children 307 to
 *     /clinical-suite: click, read the same copy, arrive where you started.
 *     Class: any internal href whose target redirects.
 *  3. A HARDCODED PRICE OR CPD LITERAL ON A PUBLIC SURFACE (2bc52018,
 *     f133275e, 89d7114a, 1aeb7fc9, e4b6bce4 …). This is the single most
 *     recurrent class in the sweep: '14 CPD' survived the 2026-07-30 OA
 *     re-rate on three surfaces, $1,400 outlived the $1,190 price in five
 *     emails and on the locked-module overlay, and the online certificate was
 *     still printing a literal 8 at HEAD. Class: any literal money or CPD
 *     figure in customer-facing copy instead of a CONFIG read.
 *  4. AN ASSET SUPERSEDED BY A HIGHER-NUMBERED SIBLING (f133275e). The
 *     homepage rendered /instruments/baseline-flow/1.png — the superseded
 *     13:44 capture set — while every other surface had moved to
 *     baseline-flow2. Class: any reference to a numbered asset family member
 *     that is not the newest generation.
 *  5. ASSERTING AHPRA ACCREDITATION (89f206c6, f133275e). "16 AHPRA CPD
 *     hours" was live on 12 public surfaces including the /in-person meta and
 *     OG description — i.e. the SERP snippet — and the homepage stat block
 *     still said it at HEAD. AHPRA accredits no CPD and awards no hours;
 *     'AHPRA-aligned' is the only permissible framing. Class: any file
 *     asserting AHPRA accreditation, approval or certification, in any
 *     phrasing.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '..')
const rel = (p: string) => path.relative(ROOT, p)

/** Comments are not shipped copy — a comment explaining a fix is not the bug. */
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') walk(p, out)
    } else if (/\.tsx?$/.test(e.name)) out.push(p)
  }
  return out
}

const APP = path.join(ROOT, 'app')
const ALL_TS = [...walk(APP), ...walk(path.join(ROOT, 'components'))]
/** Customer-facing surfaces: everything a visitor or a buyer can see rendered. */
const PUBLIC_TS = ALL_TS.filter((f) => !/[/\\](admin|api)[/\\]/.test(f)).sort()
const source = (f: string) => strip(fs.readFileSync(f, 'utf8'))

// ===========================================================================
// 1. NO PAGE CAN PAINT NOTHING ON ITS FIRST FRAME
// ===========================================================================

/**
 * Which file actually paints a route. A page that is nothing but
 * `return <SomeClient />` hands its whole first paint to that component —
 * which is exactly the /sst-trainer shape — so the component is what must be
 * checked, not the two-line wrapper.
 */
function resolveSpec(spec: string, from: string): string | null {
  let base: string
  if (spec.startsWith('@/')) base = path.join(ROOT, spec.slice(2))
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec)
  else return null
  for (const c of [`${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')]) {
    if (fs.existsSync(c)) return c
  }
  return null
}

function painterFor(pageFile: string): string {
  const src = source(pageFile)
  const thin = src.match(
    /export default (?:async )?function \w+\([^)]*\)\s*\{\s*return\s*\(?\s*<(\w+)\s*\/>\s*\)?\s*\}/,
  )
  if (!thin) return pageFile
  const imp = src.match(new RegExp(`import\\s+${thin[1]}\\s+from\\s+['"]([^'"]+)['"]`))
  return (imp && resolveSpec(imp[1], pageFile)) || pageFile
}

/**
 * Returns the `if (…) return null` statements that fire on the component's
 * OWN initial state — i.e. on the very first render, before any effect runs.
 *
 * Deliberately narrow so it cannot cry wolf:
 *  - only top-level statements of the component body (two-space indent). The
 *    same pattern inside a useMemo/useCallback callback is a normal null
 *    return for a derived value and is not a blank page.
 *  - only state whose initialiser is a literal, matched against the literal
 *    the condition tests.
 */
export function blankFirstPaint(src: string): string[] {
  const code = strip(src)
  if (!/^\s*['"]use client['"]/m.test(code.slice(0, 400))) return []

  const inits = new Map<string, string>()
  for (const m of code.matchAll(
    /const\s*\[\s*(\w+)\s*,\s*set\w+\s*\]\s*=\s*useState\s*(?:<[^>]*>)?\s*\(\s*([^)]*?)\s*\)/g,
  )) {
    inits.set(m[1], m[2].trim())
  }

  const norm = (s: string) => s.replace(/[`"]/g, "'")
  const EMPTY = /^(false|null|undefined|''|0)$/
  const found: string[] = []
  //                      ^^ exactly two spaces: the component body's own level
  for (const m of code.matchAll(
    /^ {2}if\s*\(([^)]{1,140})\)\s*return\s*(?:null|<\s*\/?\s*>|undefined)\s*[;\n]/gm,
  )) {
    const cond = m[1].trim()
    for (const [name, init] of inits) {
      const eq = cond.match(new RegExp(`^${name}\\s*===\\s*(['"\`][^'"\`]*['"\`]|null|undefined|true|false)$`))
      const blank =
        (eq && norm(eq[1]) === norm(init)) ||
        (cond === `!${name}` && EMPTY.test(norm(init))) ||
        (cond === name && init === 'true')
      if (blank) found.push(`${m[0].trim()}   // useState(${init})`)
    }
  }
  return found
}

describe('1. no route paints nothing on its first frame', () => {
  const pages = ALL_TS.filter(
    (f) => path.basename(f) === 'page.tsx' && !/[/\\](admin|api)[/\\]/.test(f),
  )
  const painters = new Map(pages.map((p) => [p, painterFor(p)]))

  it('the walk found the real routes and followed thin wrappers (guards the guard)', () => {
    // Without this, the assertion below could pass because nothing was scanned.
    expect(pages.length).toBeGreaterThan(100)
    const sst = pages.find((p) => p.endsWith(path.join('app', 'sst-trainer', 'page.tsx')))!
    expect(sst, '/sst-trainer is the page this class was found on').toBeTruthy()
    expect(
      rel(painters.get(sst)!),
      'a two-line page wrapper must be followed to the component that actually paints',
    ).toBe(path.join('components', 'platform', 'SstEntry.tsx'))
  })

  it('no page component returns null for the initial value of its own state', () => {
    const offenders: string[] = []
    for (const [page, painter] of painters) {
      for (const hit of blankFirstPaint(fs.readFileSync(painter, 'utf8'))) {
        offenders.push(`${rel(page)} (painted by ${rel(painter)}):\n      ${hit}`)
      }
    }
    expect(
      offenders,
      'these routes serve an empty document until a client effect resolves — a crawler and a slow phone see nothing:\n    ' +
        offenders.join('\n    '),
    ).toEqual([])
  })

  it('WOULD catch the /sst-trainer shape that shipped (negative control)', () => {
    // The pre-adf2382f SstEntry, reconstructed. Held in memory only.
    const shipped = `'use client'
import { useEffect, useState } from 'react'
export default function SstEntry() {
  const [view, setView] = useState<'deciding' | 'landing' | 'app'>('deciding')
  useEffect(() => { setView('landing') }, [])
  if (view === 'deciding') return null
  return <div>the page</div>
}`
    expect(blankFirstPaint(shipped)).toHaveLength(1)
    expect(blankFirstPaint(shipped)[0]).toContain("view === 'deciding'")

    // …and the boolean spelling of the same class.
    const boolean = `'use client'
import { useEffect, useState } from 'react'
export default function Page() {
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])
  if (!ready) return null
  return <div>the page</div>
}`
    expect(blankFirstPaint(boolean)).toHaveLength(1)

    // The current SstEntry must NOT trip it, or the rule is unsatisfiable.
    expect(blankFirstPaint(fs.readFileSync(path.join(ROOT, 'components/platform/SstEntry.tsx'), 'utf8'))).toEqual([])
    // Nor may a null return inside a useMemo callback (a derived value, not a page).
    const derived = `'use client'
import { useMemo, useState } from 'react'
export default function Page() {
  const [dob, setDob] = useState('')
  const age = useMemo(() => {
    if (!dob) return null
    return 1
  }, [dob])
  return <div>{age}</div>
}`
    expect(blankFirstPaint(derived)).toEqual([])
  })
})

// ===========================================================================
// 2. NO LINK LANDS ON A REDIRECT
// ===========================================================================

/** Every route that answers with a redirect rather than a page. */
function redirectMap(): { config: Set<string>; pages: Map<string, string> } {
  const cfg = strip(fs.readFileSync(path.join(ROOT, 'next.config.ts'), 'utf8'))
  const block = cfg.slice(cfg.indexOf('async redirects()'), cfg.indexOf('async headers()'))
  const config = new Set<string>()
  for (const m of block.matchAll(/source:\s*'([^']+)'/g)) config.add(m[1])

  const pages = new Map<string, string>()
  for (const f of ALL_TS) {
    if (path.basename(f) !== 'page.tsx') continue
    // Unconditional: redirect() is the first statement of the component body.
    const m = source(f).match(
      /export default (?:async )?function \w+\([^)]*\)\s*\{\s*redirect\(\s*['"]([^'"]+)['"]/,
    )
    if (!m) continue
    let route = '/' + path.relative(APP, path.dirname(f)).replace(/\\/g, '/')
    route = (route === '/.' ? '/' : route).replace(/\/\(.*?\)/g, '')
    pages.set(route, m[1])
  }
  return { config, pages }
}

export function redirectTargetOf(
  href: string,
  map: { config: Set<string>; pages: Map<string, string> },
): string | null {
  if (!href.startsWith('/') || href.startsWith('//')) return null
  const p = href.split(/[?#]/)[0].replace(/\/$/, '') || '/'
  if (map.config.has(p)) return `next.config redirect`
  if (map.pages.has(p)) return `redirect() -> ${map.pages.get(p)}`
  for (const s of map.config) {
    if (!s.includes(':')) continue
    const re = new RegExp('^' + s.replace(/:\w+\*/g, '.*').replace(/:\w+/g, '[^/]+') + '$')
    if (re.test(p)) return `next.config wildcard ${s}`
  }
  return null
}

/**
 * Links that are allowed to land on a redirect, each with the reason. Kept
 * short on purpose: an exemption list that grows is the rule dying quietly.
 */
const REDIRECT_LINK_EXCEPTIONS: Record<string, string> = {
  'app/admin/demo-activity/DemoActivityClient.tsx|/admin':
    'admin back-link; /admin -> /admin/analytics is the dashboard index, one hop inside the admin shell',
  'app/admin/import-contacts/page.tsx|/admin':
    'the same admin back-link, on the contact importer',
  'app/login/page.tsx|/dev-login':
    'rendered only when the server returns a devMagicLink (email unconfigured). /dev-login redirects to / in every environment, so this control is dead — reported to the routes register 2026-08-06, not exempted on merit',
}

describe('2. no link lands on a route that redirects', () => {
  const map = redirectMap()

  it('the redirect map found both kinds of redirect (guards the guard)', () => {
    expect(map.config.size).toBeGreaterThan(10)
    expect(map.pages.size).toBeGreaterThan(5)
    // The exact route the CTAs looped through.
    expect(redirectTargetOf('/platform/clinicians', map)).toBeTruthy()
    expect(redirectTargetOf('/sst/pricing', map), 'wildcard sources must resolve too').toBeTruthy()
    // A real page must NOT look like a redirect.
    expect(redirectTargetOf('/clinical-suite', map)).toBeNull()
  })

  it('every internal href resolves to a page, not a 307', () => {
    const offenders: string[] = []
    for (const f of ALL_TS) {
      const src = source(f)
      for (const m of src.matchAll(/href=(?:"([^"]+)"|\{'([^']+)'\}|\{"([^"]+)"\})/g)) {
        const href = m[1] || m[2] || m[3]
        const hit = redirectTargetOf(href, map)
        if (!hit) continue
        if (REDIRECT_LINK_EXCEPTIONS[`${rel(f)}|${href}`]) continue
        offenders.push(`${rel(f)} -> ${href}  [${hit}]`)
      }
    }
    expect(
      offenders,
      'a link that redirects makes the reader read the same copy twice and arrive where they started:\n    ' +
        offenders.join('\n    '),
    ).toEqual([])
  })

  it('no exemption is stale — each one is still a real link at a redirecting route', () => {
    for (const [key, reason] of Object.entries(REDIRECT_LINK_EXCEPTIONS)) {
      const [file, href] = key.split('|')
      expect(reason.length, `${key} needs a reason`).toBeGreaterThan(20)
      expect(fs.existsSync(path.join(ROOT, file)), `${file} is gone — drop the exemption`).toBe(true)
      expect(source(path.join(ROOT, file)), `${file} no longer links ${href} — drop the exemption`).toContain(href)
      expect(redirectTargetOf(href, map), `${href} no longer redirects — drop the exemption`).toBeTruthy()
    }
  })

  it('WOULD catch the CTA loop that shipped (negative control)', () => {
    // Both /sst-trainer CTAs pointed here; every child of /platform 307s.
    expect(redirectTargetOf('/platform/pricing', map)).toContain('redirect')
    expect(redirectTargetOf('/reference', map)).toContain('/pricing')
    expect(redirectTargetOf('/courses/streams', map)).toContain('redirect')
  })
})

// ===========================================================================
// 3. NO NEW HARDCODED PRICE OR CPD LITERAL ON A PUBLIC SURFACE
// ===========================================================================

/**
 * A money or CPD figure written as a literal instead of read from CONFIG.
 *
 * `{CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours` has no literal digit and never
 * matches; `16 CPD hours` does. The lookbehind keeps `{module.points} CPD`
 * and decimals out.
 */
const PRICE_LITERAL = /(?:A?\$|AUD\s*)\s?(?:1,?400|1,?190|1,?497|497|693|447|347|97|82)\b/g
const CPD_LITERAL = /(?<![{.\w$])\b\d{1,3}\s*(?:AHPRA[- ]aligned\s*)?(?:ESSA\s*)?CPD\s*(?:hours?|points?)/gi

export function derivedFigureOffenders(src: string): string[] {
  const code = strip(src)
  return [
    ...[...code.matchAll(PRICE_LITERAL)].map((m) => m[0]),
    ...[...code.matchAll(CPD_LITERAL)].map((m) => m[0].trim()),
  ]
}

/**
 * The debt as it stood on 2026-08-06: 90 literal figures across 38 public
 * files. This is a RATCHET, not a clean bill of health — the count may fall
 * and files may leave, but nothing new may join. It is expressed that way
 * because fixing all 90 in one pass is a copy rewrite of the whole site,
 * while a literal added to a clean file is exactly how '14 CPD' and $1,400
 * kept coming back.
 */
const FIGURE_LITERAL_BASELINE = new Set([
  'app/HomeClient.tsx',
  'app/about/zac-lewis/page.tsx',
  'app/ai-safety-checklist/checklist/page.tsx',
  'app/concussion-rehab-mastery/page.tsx',
  'app/course/layout.tsx',
  'app/course/page.tsx',
  'app/courses/about-the-founder/page.tsx',
  'app/courses/ai-in-clinical-practice/page.tsx',
  'app/courses/melbourne/layout.tsx',
  'app/courses/poll/page.tsx',
  'app/courses/private-preview/page.tsx',
  'app/courses/sydney/layout.tsx',
  'app/cpd/page.tsx',
  'app/ep-course/modules/[id]/EpModuleClient.tsx',
  'app/in-person/page.tsx',
  'app/modules/[id]/FlagshipModuleClient.tsx',
  'app/partners/[slug]/page.tsx',
  'app/partners/page.tsx',
  'app/preseason/page.tsx',
  'app/proposals/advanced-health-buderim/page.tsx',
  'app/proposals/sydney-physios/page.tsx',
  'app/proposals/sydney-physios/print/page.tsx',
  'app/reference/success/page.tsx',
  'app/team-training/page.tsx',
  'app/workshops/thanks/page.tsx',
  'components/HomepageAiCourseCard.tsx',
  'components/PricingOptions.tsx',
  'components/ccm/CcmInternationalContent.tsx',
  'components/course/ContentLockedBanner.tsx',
  'components/course/PreviewClient.tsx',
  'components/crm/CrmInternationalContent.tsx',
  'components/crm/CrmPricingContent.tsx',
  'components/dashboard/BentoGrid.tsx',
  'components/prospect/DualStreamTabs.tsx',
  'components/prospect/EpProspectLanding.tsx',
  'components/prospect/HubPackBuyCard.tsx',
  'components/prospect/InvestmentLadder.tsx',
  'components/prospect/ProspectLanding.tsx',
])
const FIGURE_LITERAL_CEILING = 90

describe('3. no NEW hardcoded price or CPD literal on a public surface', () => {
  const current = new Map<string, string[]>()
  for (const f of PUBLIC_TS) {
    const hits = derivedFigureOffenders(fs.readFileSync(f, 'utf8'))
    if (hits.length) current.set(rel(f).replace(/\\/g, '/'), hits)
  }
  const total = [...current.values()].reduce((n, h) => n + h.length, 0)

  it('no file outside the recorded baseline carries one', () => {
    const added = [...current.entries()]
      .filter(([f]) => !FIGURE_LITERAL_BASELINE.has(f))
      .map(([f, h]) => `${f}: ${h.join(', ')}`)
    expect(
      added,
      'a literal figure was added to a clean surface. Derive it: CONFIG.COURSE.*_CPD_POINTS, ' +
        'CONFIG.ESSA_ACCREDITATION.ONLINE_POINTS, workshopPriceFor(). This is the class that ' +
        'survived the 2026-07-30 OA re-rate on three surfaces:\n    ' + added.join('\n    '),
    ).toEqual([])
  })

  it('the total never grows (the ratchet only turns one way)', () => {
    expect(total, `${total} literal figures on public surfaces`).toBeLessThanOrEqual(FIGURE_LITERAL_CEILING)
  })

  it('WOULD catch a fresh literal, and does not fire on a CONFIG read (negative control)', () => {
    expect(derivedFigureOffenders('<p>16 AHPRA-aligned CPD hours for A$1,400</p>').sort())
      .toEqual(['16 AHPRA-aligned CPD hours', 'A$1,400'])
    expect(derivedFigureOffenders('<p>8 ESSA CPD points</p>')).toEqual(['8 ESSA CPD points'])
    // The shape the fix is supposed to produce must stay clean, or the rule
    // is unsatisfiable and everyone would just delete it.
    expect(derivedFigureOffenders('<p>{CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours</p>')).toEqual([])
    expect(derivedFigureOffenders('<p>{module.points} CPD points · ${price}</p>')).toEqual([])
    // A comment naming the old figure is documentation, not copy.
    expect(derivedFigureOffenders('// was 16 CPD hours before the re-rate\nconst x = 1')).toEqual([])
  })

  it('the baseline has no stale entries', () => {
    const gone = [...FIGURE_LITERAL_BASELINE].filter(
      (f) => !fs.existsSync(path.join(ROOT, f)),
    )
    expect(gone, 'baseline names files that no longer exist').toEqual([])
  })
})

// ===========================================================================
// 4. NO SUPERSEDED ASSET GENERATION IS REFERENCED
// ===========================================================================

/**
 * Screen captures are re-shot into a numbered sibling — baseline-flow ->
 * baseline-flow2, watch -> watch2 … watch5. The number IS the version, so a
 * surface pointing at anything but the newest member is showing a stale
 * screenshot of the product. The homepage was doing that with the superseded
 * 13:44 baseline capture set while every other surface had moved on.
 *
 * Uses only directory names — no mtimes, which are all identical on a fresh
 * CI checkout, and no `git log`, which a depth-1 clone does not have.
 */
export function assetFamilies(publicDir: string): Map<string, number> {
  const families = new Map<string, number>()
  const scan = (dir: string, base: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue
      const m = e.name.match(/^(.*[^\d])(\d+)$/)
      if (m) {
        const key = `${base}/${m[1]}`
        // Only a family if the unnumbered original is there too.
        if (fs.existsSync(path.join(dir, m[1]))) {
          families.set(key, Math.max(families.get(key) ?? 1, Number(m[2])))
        }
      }
      scan(path.join(dir, e.name), `${base}/${e.name}`)
    }
  }
  scan(publicDir, '')
  return families
}

export function supersededAssetRefs(src: string, families: Map<string, number>): string[] {
  const code = strip(src)
  const hits: string[] = []
  for (const [stem, newest] of families) {
    // stem = '/instruments/baseline-flow', newest = 2
    for (let gen = 1; gen < newest; gen++) {
      const p = gen === 1 ? stem : `${stem}${gen}`
      const re = new RegExp(`['"\`]${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`, 'g')
      for (const _ of code.matchAll(re)) hits.push(`${p}/… (newest is ${stem}${newest})`)
    }
  }
  return hits
}

describe('4. no surface references a superseded asset generation', () => {
  const families = assetFamilies(path.join(ROOT, 'public'))

  it('the family scan found the real generations (guards the guard)', () => {
    expect(families.get('/instruments/baseline-flow')).toBe(2)
    expect(families.get('/instruments/watch')).toBe(5)
  })

  it('every referenced generation is the newest one', () => {
    const offenders: string[] = []
    for (const f of ALL_TS) {
      for (const hit of supersededAssetRefs(fs.readFileSync(f, 'utf8'), families)) {
        offenders.push(`${rel(f)}: ${hit}`)
      }
    }
    expect(
      offenders,
      'a stale screenshot of the product is being shown to buyers:\n    ' + offenders.join('\n    '),
    ).toEqual([])
  })

  it('WOULD catch the homepage capture that shipped (negative control)', () => {
    const shipped = `<Image src="/instruments/baseline-flow/1.png" alt="Baseline" />`
    expect(supersededAssetRefs(shipped, families)).toHaveLength(1)
    expect(supersededAssetRefs(shipped, families)[0]).toContain('newest is /instruments/baseline-flow2')

    const olderWatch = `const s = '/instruments/watch3/2.png'`
    expect(supersededAssetRefs(olderWatch, families)).toHaveLength(1)

    // The current references must stay clean.
    expect(supersededAssetRefs(`src="/instruments/baseline-flow2/1.png"`, families)).toEqual([])
    expect(supersededAssetRefs(`src="/instruments/watch5/1.png"`, families)).toEqual([])
  })
})

// ===========================================================================
// 5. AHPRA ACCREDITS NOTHING — NO SURFACE MAY SAY OTHERWISE
// ===========================================================================

/**
 * AHPRA issues no CPD hours and accredits no CPD. CONFIG's own sanctioned
 * wording is 'AHPRA-aligned'. The false claim reached 12 public surfaces
 * including the /in-person meta description — the SERP snippet — and was
 * still on the homepage stat block at HEAD, one commit ago.
 *
 * Matching per SENTENCE, not per file, because the honest content that MUST
 * survive is the rebuttal: the FAQ heading "Is this course AHPRA-accredited?"
 * and its answer "AHPRA does not accredit CPD courses" are how the correction
 * reaches a clinician and an AI summariser at all. Deleting them removes the
 * rebuttal, not the myth. (tests/geo-llm-surface.test.ts already applies this
 * rule to llms.txt; this extends it to every rendered surface.)
 */
const AHPRA_ASSERTION =
  /AHPRA[\s-]*(?:accredited|approved|certified|endorsed)|(?:accredited|approved|certified|endorsed)\s+by\s+AHPRA|AHPRA\s+CPD\s+(?:hours?|points?)/i
/** A sentence that DENIES the claim, or asks it as a question, is the fix. */
const AHPRA_DENIAL =
  /\b(?:does not|doesn't|do not|don't|never|no|not|misus|red flag|cannot|can't|instead of|rather than|is wrong|false)\b/i

/**
 * A claim wrapped in its own quotation marks is being NAMED, not made — the
 * vetting page lists 'Marketing uses "AHPRA-certified" language' as a reason
 * it REJECTS a course. The quotes are the whole point; asserting the claim
 * ("AHPRA-accredited course", alt="AHPRA approved") never quotes it as a
 * standalone span.
 */
function isQuotedMention(sentence: string, match: string, at: number): boolean {
  const OPEN = ['"', '“', '&quot;', '&ldquo;']
  const CLOSE = ['"', '”', '&quot;', '&rdquo;']
  const before = sentence.slice(Math.max(0, at - 6), at)
  const after = sentence.slice(at + match.length, at + match.length + 6)
  return OPEN.some((q) => before.endsWith(q)) && CLOSE.some((q) => after.startsWith(q))
}

export function ahpraAssertions(src: string): string[] {
  const code = strip(src)
  const out: string[] = []
  for (const raw of code.split(/(?<=[.!?])\s+|\n/)) {
    const sentence = raw.trim()
    const m = sentence.match(AHPRA_ASSERTION)
    if (!m) continue
    if (sentence.includes('?')) continue // the FAQ question itself
    if (AHPRA_DENIAL.test(sentence)) continue // the rebuttal
    if (isQuotedMention(sentence, m[0], m.index!)) continue // named, not claimed
    if (/AHPRA[\s-]*aligned/i.test(sentence) && !/AHPRA\s+CPD\s+(hours?|points?)/i.test(sentence)) continue
    out.push(sentence.slice(0, 160))
  }
  return out
}

describe('5. no surface asserts AHPRA accreditation', () => {
  /** Course content ships as markdown a paying customer reads — same rule. */
  function markdown(dir: string, out: string[] = []): string[] {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) markdown(p, out)
      else if (/\.mdx?$/.test(e.name)) out.push(p)
    }
    return out
  }

  it('no rendered file claims AHPRA accredits, approves or awards CPD', () => {
    const offenders: string[] = []
    const scanned = [
      ...ALL_TS,
      ...walk(path.join(ROOT, 'lib')),
      ...walk(path.join(ROOT, 'data')),
      ...markdown(path.join(ROOT, 'content')),
    ]
    expect(scanned.length, 'the scan found files (guards the guard)').toBeGreaterThan(300)
    for (const f of scanned) {
      for (const s of ahpraAssertions(fs.readFileSync(f, 'utf8'))) {
        offenders.push(`${rel(f)}: ${s}`)
      }
    }
    expect(
      offenders,
      'AHPRA accredits no CPD and awards no hours — "AHPRA-aligned" is the only permissible framing:\n    ' +
        offenders.join('\n    '),
    ).toEqual([])
  })

  it('WOULD catch every phrasing that shipped, and spares the rebuttal (negative control)', () => {
    // The exact strings that were live on 12 surfaces.
    expect(ahpraAssertions('<p>16 AHPRA CPD hours</p>')).toHaveLength(1)
    expect(ahpraAssertions('<h2>An AHPRA-accredited concussion course</h2>')).toHaveLength(1)
    expect(ahpraAssertions('<p>This course is accredited by AHPRA.</p>')).toHaveLength(1)
    expect(ahpraAssertions('<span>AHPRA approved provider</span>')).toHaveLength(1)

    // The corrections and the rebuttal must survive, or the rule deletes the
    // only content that fights the myth.
    expect(ahpraAssertions('<p>16 AHPRA-aligned CPD hours</p>')).toEqual([])
    expect(ahpraAssertions('<h3>Is this course AHPRA-accredited?</h3>')).toEqual([])
    expect(ahpraAssertions('AHPRA does not accredit CPD courses.')).toEqual([])
    expect(ahpraAssertions('A vendor claiming "AHPRA-approved" is a red flag.')).toEqual([])
    // Named as a rejection reason, with no denial word in the sentence.
    expect(ahpraAssertions('Marketing uses "AHPRA-certified" language.')).toEqual([])
    // But quoting is not a loophole: a claim quoted as part of a larger
    // assertive span is still an assertion.
    expect(ahpraAssertions('<img alt="AHPRA-accredited concussion course" />')).toHaveLength(1)
  })
})

// ===========================================================================
// 6. NO AUTHORISATION CREDENTIAL COMES OUT OF Math.random()
// ===========================================================================

/**
 * RTP athlete share codes are the ONLY authorisation on a concussion record:
 * /api/rtp/state, /advance and /symptom-log take a `code` and return or mutate
 * whatever pathway it names, with no further ownership check. They were minted
 * with Math.random(), whose xorshift128+ state is recoverable from a handful of
 * consecutive outputs — and org codes came from the SAME generator, so anyone
 * who could register an org harvested six outputs and could predict other
 * clinics' athlete codes (86b0bbde).
 *
 * The preseason generator got this fix on 2026-08-04 and clinic-registry got
 * it too; this one was missed, twice, because each was found and fixed
 * individually. Class-wide: nothing that mints a credential may use a
 * non-cryptographic PRNG. Ids that are merely unique (install id, sync id,
 * analytics visitor id) are deliberately out of scope — they authorise
 * nothing, and the sweep recorded them as accepted.
 */
const CREDENTIAL_NAME = /(?:^|[a-z_])(codes?|keys?|tokens?|secrets?|nonces?|passwords?|credentials?)$/i

export function weakCredentialSources(src: string): string[] {
  const code = strip(src)
  const out: string[] = []
  for (const m of code.matchAll(/Math\.random\s*\(/g)) {
    // What is this random value BECOMING? The assignment target on the same
    // statement first (`const newAccessKey = …`, `viewKey: …`, `code +=`), and
    // only then the enclosing function's name (`function generateCode()`).
    // Looking at "any nearby identifier" instead picks up unrelated constants
    // — lib/analytics.ts declares `const KEY = 'cea_session_id'` two lines
    // above an `id = …Math.random()`, and flagging that is how a guard earns
    // an exemption list and dies.
    // `;` and newline only — NOT `{`, because `${` inside a template literal
    // would cut the statement off before its own assignment target and the
    // detector would silently see nothing.
    const stmtStart = Math.max(code.lastIndexOf(';', m.index!), code.lastIndexOf('\n', m.index!))
    const stmt = code.slice(stmtStart + 1, m.index!)
    const target =
      stmt.match(/(?:const|let|var)\s+(\w+)\s*=/)?.[1] ??
      stmt.match(/(\w+)\s*:\s*$/)?.[1] ??
      stmt.match(/(\w+)\s*(?:\+)?=[^=]*$/)?.[1] ??
      null
    const fn = [...code.slice(Math.max(0, m.index! - 900), m.index!).matchAll(/function\s+(\w+)\s*\(/g)]
      .map((d) => d[1])
      .pop() ?? null
    const offender = [target, fn].find((n) => n && CREDENTIAL_NAME.test(n))
    if (offender) out.push(`${offender} <- Math.random()`)
  }
  return out
}

describe('6. no authorisation credential comes out of Math.random()', () => {
  const dirs = [path.join(ROOT, 'lib'), path.join(ROOT, 'app', 'api')]
  const files = dirs.flatMap((d) => walk(d))

  it('the scan covers the generators (guards the guard)', () => {
    expect(files.length).toBeGreaterThan(100)
    expect(files.some((f) => f.endsWith(path.join('lib', 'rtp', 'store.ts')))).toBe(true)
  })

  it('every code / key / token generator uses a CSPRNG', () => {
    const offenders: string[] = []
    for (const f of files) {
      for (const hit of weakCredentialSources(fs.readFileSync(f, 'utf8'))) {
        offenders.push(`${rel(f)}: ${hit}`)
      }
    }
    expect(
      offenders,
      'use crypto.randomInt / crypto.randomBytes — a predictable code IS the authorisation:\n    ' +
        offenders.join('\n    '),
    ).toEqual([])
  })

  it('WOULD catch the RTP generator that shipped, and spares plain ids (negative control)', () => {
    const shipped = `
      export function generateCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
        return code
      }`
    expect(weakCredentialSources(shipped)).toHaveLength(1)
    expect(weakCredentialSources(`const viewKey = Math.random().toString(36)`)).toHaveLength(1)
    expect(weakCredentialSources(`const accessToken = Math.random().toString(36)`)).toHaveLength(1)
    // The live instance this guard found on its first run, in
    // app/api/admin/prospect-requeue-named — a template literal, which is why
    // the statement boundary must not stop at `${`.
    expect(
      weakCredentialSources('const newAccessKey = `${newSlug}-${Math.random().toString(36).slice(2, 10)}`'),
    ).toEqual(['newAccessKey <- Math.random()'])

    // Non-credential randomness must stay allowed, or the rule is unsatisfiable:
    // send jitter, an install id, an analytics visitor id.
    expect(weakCredentialSources(`const jitter = (Math.random() - 0.5) * JITTER_MS`)).toEqual([])
    expect(weakCredentialSources(`function generateInstallId() { return \`sst-\${Math.random()}\` }`)).toEqual([])
    expect(weakCredentialSources(`v = \`v-\${Math.random().toString(36)}\``)).toEqual([])
  })
})
