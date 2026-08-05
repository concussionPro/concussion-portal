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
