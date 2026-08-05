import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * CRM ↔ CCM ENTITLEMENT PARITY.
 *
 * WHY THIS FILE EXISTS (2026-08-05): a paying CRM buyer was locked out of
 * modules 2-8 of the course they bought — forever — and could never earn their
 * certificate. The whole 587-test suite was green throughout, because nothing
 * asserted the one thing that mattered: "a paying CRM buyer can open module 2".
 *
 * THE DEFECT CLASS. CCM entitlement lives in `users.access_level`
 * ('online-only' | 'full-course'). CRM entitlement lives in `course_purchases`
 * and is surfaced as `ownsCrm` — a CRM buyer's access_level stays 'preview'.
 * So ANY gate written as `accessLevel === 'preview' → deny` treats a paying
 * customer as a free one. CCM was the reference implementation and never hit
 * it, because CCM buyers do have an access_level. Every cloned gate inherited
 * the check without the second entitlement source.
 *
 * These assertions read the real gate sources and fail if a `preview` denial
 * is reintroduced without a CRM ownership escape. They are deliberately
 * source-level: the gates live in client components and server pages that
 * cannot be invoked in this environment, and a grep that encodes the EXACT
 * defect shape still catches the regression that shipped.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

/** Strip comments so prose about the rule can't satisfy an assertion. */
function code(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
}

/**
 * Every line that denies on a bare 'preview' access level, ignoring lines that
 * also consult CRM ownership. A hit is a paying CRM buyer being turned away.
 */
function barePreviewDenials(src: string): string[] {
  return code(src)
    .split('\n')
    .filter((l) => /accessLevel\s*===\s*['"]preview['"]/.test(l))
    .filter((l) => !/ownsCrm|userOwnsCrm|crm/i.test(l))
}

describe('a paying CRM buyer is never treated as a free user', () => {
  it('the shared module player admits CRM owners to modules 2-8', () => {
    const src = code(read('components/course/CourseModulePage.tsx'))
    // The redirect that locked CRM buyers out of the course they bought.
    const gate = src
      .split('\n')
      .find((l) => /accessLevel\s*===\s*['"]preview['"]/.test(l) && /moduleId/.test(l))
    expect(gate, 'module redirect gate not found — has it been refactored?').toBeTruthy()
    expect(
      gate,
      'the module gate denies on access_level alone; CRM buyers carry preview and would be locked out of the course they bought',
    ).toMatch(/ownsCrm/)
  })

  it('the account page recognises CRM buyers as paying customers', () => {
    const src = read('app/settings/page.tsx')
    expect(src, 'settings must consult ownsCrm or it labels a CRM buyer "Free Preview"').toContain('ownsCrm')
    // It declared its own SessionUser once and dropped the field.
    const localType = src.match(/interface SessionUser \{[\s\S]*?\n\}/)?.[0] ?? ''
    if (localType) {
      expect(
        localType,
        'the local SessionUser shadows the shared one — it must keep ownsCrm or the page reads a paying CRM buyer as free',
      ).toContain('ownsCrm')
    }
  })

  it('CRM completion is counted from the CRM module ids, not CCM 1-8', () => {
    const src = code(read('app/settings/page.tsx'))
    // getTotalCompletedModules only counts 1-8; a CRM buyer sits at 0/8 forever
    // and their certificate button never renders.
    expect(
      /20[1-8]/.test(src),
      'settings must count CRM module ids (201-208) or a CRM buyer can never reach their certificate',
    ).toBe(true)
  })

  it('the dashboard next-action card offers CRM buyers a real action', () => {
    const src = code(read('components/dashboard/NextActionCard.tsx'))
    const crmBranch = src.includes('ownsCrm')
    expect(crmBranch, 'the card must branch on ownsCrm').toBe(true)
    // It used to `return null`, leaving their dashboard with no affordance.
    const nullReturn = /if \(ownsCrm[^)]*\) \{\s*return null\s*\}/.test(src)
    expect(nullReturn, 'returning null for CRM buyers leaves their dashboard with no continue affordance').toBe(false)
  })

  it('no client course/account surface denies on access_level alone', () => {
    const surfaces = [
      'components/course/CourseModulePage.tsx',
      'app/settings/page.tsx',
      'app/learning/page.tsx',
    ]
    for (const f of surfaces) {
      const denials = barePreviewDenials(read(f))
      expect(
        denials,
        `${f} denies on access_level without a CRM ownership escape — a paying CRM buyer is turned away:\n${denials.join('\n')}`,
      ).toEqual([])
    }
  })
})

describe('CRM entitlement is checked at its real source', () => {
  it('the CRM module API gates on ownership, not access level', () => {
    const src = code(read('app/api/ep-course/modules/[id]/route.ts'))
    expect(src).toContain('userOwnsCrm')
  })

  it('the certificate API gates the CRM certificate on ownership', () => {
    const src = code(read('app/api/certificate/route.ts'))
    expect(src).toMatch(/courseType === 'crm'[\s\S]{0,200}userOwnsCrm/)
  })

  it('the session payload carries ownsCrm so client gates can see it', () => {
    const src = code(read('app/api/auth/session/route.ts'))
    expect(src).toContain('ownsCrm')
  })

  it('the shared SessionUser type keeps ownsCrm', () => {
    const src = read('contexts/SessionContext.tsx')
    expect(src).toContain('ownsCrm')
  })
})

describe('CRM pass mark and CPD figures stay stream-correct', () => {
  it('CRM quiz verification uses the 80% threshold, CCM 75%', () => {
    const src = code(read('lib/quiz-verify.ts'))
    // Thresholds are fractions in this module (PASS_THRESHOLD = 0.75,
    // EP_PASS_THRESHOLD = 0.8) — assert the real literals, not "80"/"75",
    // which never appeared and made this assertion unsatisfiable.
    expect(src).toMatch(/0\.8\b/)
    expect(src).toMatch(/0\.75\b/)
    // …and that the EP threshold is applied to the namespaced CRM ids.
    expect(src).toMatch(/20[18]/)
  })

  it('the CRM certificate cites ESSA, not Osteopathy Australia', () => {
    const src = code(read('lib/certificate.ts'))
    // The CRM branch must name ESSA; OA endorsement belongs to CCM only.
    expect(src).toMatch(/ESSA/)
  })
})

/**
 * DEPTH PARITY (2026-08-05). The entitlement rows above are about a CRM buyer
 * being let IN. These are about what they find once inside: the course
 * machinery CCM has been wired into since launch that CRM was never connected
 * to — module resources, a searchable reference database, server-rendered
 * first paint, an in-portal upgrade path.
 */
describe('the CRM course is wired into the shared course machinery', () => {
  it('CRM modules render their OWN downloadable resources, never the flagship’s', () => {
    const src = read('components/course/DownloadableResources.tsx')
    // Keyed by (course, moduleId). Keying on moduleId alone is what made EP
    // suppress the section entirely — EP display ids are also 1-8.
    expect(src).toMatch(/RESOURCES_BY_COURSE/)
    expect(src).toMatch(/const EP_RESOURCES/)
    // The EP course must never be pointed at /api/download: those are CCM
    // binaries and that route's entitlement is access_level-shaped, so a CRM
    // buyer (access_level 'preview') would be refused their own resources.
    const epMap = src.match(/const EP_RESOURCES[\s\S]*?\n\}/)?.[0] ?? ''
    expect(epMap, 'EP_RESOURCES not found').not.toBe('')
    expect(epMap, 'EP resources must not be served by the CCM /api/download route').not.toContain('/api/download')
  })

  it('every CRM module resource points at a document that actually exists', async () => {
    const { EP_DOCUMENTS } = await import('../data/ep-documents')
    const slugs = new Set(EP_DOCUMENTS.map((d) => d.slug))
    const src = read('components/course/DownloadableResources.tsx')
    const epMap = src.match(/const EP_RESOURCES[\s\S]*?\n\}/)?.[0] ?? ''
    const linked = [...epMap.matchAll(/\/ep-course\/documents\/([a-z0-9-]+)/g)].map((m) => m[1])
    expect(linked.length, 'the EP resource map is empty').toBeGreaterThan(0)
    for (const slug of linked) {
      expect(slugs.has(slug), `EP resource links to /ep-course/documents/${slug}, which has no document`).toBe(true)
    }
  })

  it('a resources / apply-tomorrow step only appears when that module has content', () => {
    const src = code(read('components/course/CourseModulePage.tsx'))
    // An empty step in the stepper is worse than no step.
    expect(src).toMatch(/hasDownloadableResources\(course, moduleId\)/)
    expect(src).toMatch(/hasApplyTomorrow\(course, moduleId\)/)
  })

  it('the CRM module route is a server component with a first-paint payload', () => {
    const src = read('app/ep-course/modules/[id]/page.tsx')
    // CCM has had server-rendered first paint since app/modules/[id] was
    // converted; CRM buyers were still getting spinner → session → content.
    expect(src, 'the CRM module page must not be a client component').not.toMatch(/^'use client'/m)
    expect(src).toContain('initialModuleData')
    // …resolved through the SAME gate the content API uses.
    expect(src).toContain('checkCrmServerAccess')
  })

  it('the CRM reference repository is searchable, not a flat list', () => {
    const page = read('app/ep-course/references/page.tsx')
    expect(page).toContain('EpReferenceSearch')
    const lib = read('lib/ep-references.ts')
    // Derived from the modules' own citations — no second list to drift.
    expect(lib).toContain('getEpModules')
  })

  it('the reference repository loses no citation and invents none', async () => {
    const { getEpReferences } = await import('../lib/ep-references')
    const { getEpModules } = await import('../data/ep-modules')
    // Compared on the same normalised key the repository dedupes by, so the
    // SAME paper written with an en-dash in one module and a hyphen in another
    // counts as present (it is one row, showing the text as first authored).
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim()
    const authored = getEpModules().flatMap((m) => (m.clinicalReferences ?? []).map((r) => norm(r)))
    const derived = getEpReferences()
    const rendered = new Set(derived.map((r) => norm(r.citation)))
    for (const ref of authored) {
      expect(rendered.has(ref), `citation dropped by the repository: ${ref.slice(0, 80)}`).toBe(true)
    }
    // Nothing may be added that no module cites.
    const authoredSet = new Set(authored)
    for (const r of derived) {
      expect(authoredSet.has(norm(r.citation)), `repository invented a citation: ${r.citation.slice(0, 80)}`).toBe(true)
    }
    // Every module that cites a paper is tagged on it.
    const giza = derived.find((r) => r.citation.includes('Giza') && r.citation.includes('2014'))
    expect(giza?.modules.length, 'multi-module citations must carry every citing module').toBeGreaterThan(1)
  })

  it('the EP course has an in-portal practical-day upgrade path', () => {
    const src = read('components/ep-course/CrmPracticalUpsell.tsx')
    // The CRM analogue of CCM's accessLevel === 'online-only'.
    for (const surface of ['app/ep-course/dashboard/page.tsx', 'components/ep-course/EpCourseNavigation.tsx']) {
      const s = code(read(surface))
      expect(s, `${surface} must gate the upsell on ownsCrm && !ownsCrmPractical`).toMatch(
        /ownsCrm && !user\.ownsCrmPractical/,
      )
    }
    // Price derived from config, never a literal — same rule CCM's sidebar has.
    expect(src).toMatch(/upgradePriceFor\(/)
    expect(src).not.toMatch(/\$693|\$903|\$600\b|\$1,190|\$1,400/)
    // It must sell the CRM upgrade tier, not bounce into the CCM /upgrade page
    // (which redirects a CRM buyer to the CCM sales page).
    expect(src).toContain("tier: 'upgrade'")
    expect(src).toContain('/api/crm/checkout')
    expect(src, 'the CCM upgrade route rejects CRM buyers').not.toMatch(/href="\/upgrade"/)
  })

  it('the EP dashboard carries the cross-course search CCM has at /learning', () => {
    const src = code(read('app/ep-course/dashboard/page.tsx'))
    expect(src).toContain('CourseSearch')
  })
})

describe('interactive elements can be authored as course content, not code', () => {
  it('sections accept data-authored interactives and the player renders them', () => {
    // CCM's ~150 interactive elements are hardcoded JSX keyed by
    // (moduleId, sectionId); CRM has no such file and gained interactivity
    // only by someone writing more JSX. Specs on the section travel inside the
    // ENTITLEMENT-GATED module payload instead, so a paid answer key never
    // reaches an unentitled visitor and adding one is a content edit.
    const types = read('data/modules.ts')
    expect(types).toMatch(/export type SectionInteractive/)
    expect(types).toMatch(/interactives\?: SectionInteractive\[\]/)

    const renderer = read('components/course/SectionDataInteractives.tsx')
    // Same widgets the flagship course uses — not a parallel implementation.
    for (const widget of ['QuickCheck', 'ClinicalScenario', 'OrderingExercise', 'MatchingExercise', 'MultiSelectQuiz']) {
      expect(renderer, `${widget} must render through the shared component`).toContain(widget)
    }

    const player = code(read('components/course/CourseModulePage.tsx'))
    expect(player).toMatch(/<SectionDataInteractives specs=\{section\.interactives\}/)
  })

  it('the flagship course keeps every resources / apply-tomorrow step it had', async () => {
    // The (course, moduleId) rekey must not quietly drop a CCM step.
    const resources = read('components/course/DownloadableResources.tsx')
    const flagshipResources = resources.match(/const FLAGSHIP_RESOURCES[\s\S]*?\n\}/)?.[0] ?? ''
    const apply = read('components/course/ApplyTomorrow.tsx')
    const flagshipActions = apply.match(/const FLAGSHIP_ACTIONS[\s\S]*?\n\}/)?.[0] ?? ''
    for (let id = 1; id <= 8; id++) {
      expect(new RegExp(`^  ${id}: \\[`, 'm').test(flagshipResources), `CCM module ${id} lost its resources`).toBe(true)
      expect(new RegExp(`^  ${id}: \\[`, 'm').test(flagshipActions), `CCM module ${id} lost its apply-tomorrow`).toBe(true)
    }
  })
})
