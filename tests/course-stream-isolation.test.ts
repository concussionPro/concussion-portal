import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * STREAM ISOLATION — CCM ⇆ CRM.
 *
 * CCM entitlement lives in `users.access_level`; CRM (the exercise-physiology
 * stream) lives in `course_purchases` slug 'crm'. They are deliberately
 * isolated, which has a non-obvious consequence: a CRM buyer's access_level
 * stays 'preview'.
 *
 * That single fact broke the dashboard in BOTH directions and will keep doing so
 * unless it is asserted:
 *   - test as `accessLevel === 'preview'`   → a PAYING EP customer is treated as
 *     a free-trial lead (SCAT stats, SCAT module targets, 'scat-mastery'
 *     certificate, the free-course conversion cron, /modules/101 on login).
 *   - drop the preview check entirely       → they are handed the CCM paid tools
 *     they never bought.
 *
 * The answer is three tiers (free / ccm / crm). These are source-level guards:
 * the surfaces involved are client React or raw SQL, so this asserts the
 * INVARIANTS at the places they were actually violated.
 */

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('CRM buyers are not swept into the free-course funnel', () => {
  // Every lane that targets free-course leads by access_level. A CRM buyer sits
  // in this exact predicate, so each must exclude CRM owners or it emails a
  // paying customer a free-course pitch.
  const FREE_FUNNEL_LANES = [
    'app/api/cron/completer-conversion/route.ts',
    'app/api/cron/lead-scoring/route.ts',
    'app/api/admin/followup-scat-completers/route.ts',
    'app/api/admin/send-outreach/route.ts',
    'app/api/admin/melbourne-warming-push/route.ts',
    'app/api/admin/activate-stuck-free/route.ts',
  ]

  it.each(FREE_FUNNEL_LANES)('%s excludes CRM owners from its preview cohort', (file) => {
    const src = read(file)
    expect(src).toMatch(/access_level = 'preview'/)
    // Must exclude CRM owners in the same query.
    expect(src).toMatch(/course_purchases cp/)
    expect(src).toMatch(/cp\.course_slug = 'crm'/)
  })

  it('every access_level=preview SQL clause carries its own exclusion', () => {
    for (const file of FREE_FUNNEL_LANES) {
      const src = read(file)
      // Only real SQL WHERE/AND clauses — a docblock line describing the cohort
      // (" *  - access_level = 'preview'") is prose, not a query.
      const previewClauses =
        src.match(/(?:WHERE|AND)\s+(?:\w+\.)?access_level = 'preview'/g) ?? []
      const exclusions = src.match(/cp\.course_slug = 'crm'/g) ?? []
      expect(previewClauses.length, `${file}: expected at least one SQL preview clause`).toBeGreaterThan(0)
      expect(
        exclusions.length,
        `${file}: ${previewClauses.length} SQL preview clause(s) but ${exclusions.length} CRM exclusion(s)`,
      ).toBeGreaterThanOrEqual(previewClauses.length)
    }
  })
})

describe('CRM buyers land on their own course, never the free SCAT funnel', () => {
  it('magic-link verify routes CRM owners to /ep-course, not /modules/101', () => {
    const src = read('app/api/auth/verify/route.ts')
    expect(src).toMatch(/userOwnsCrm/)
    // The free-tier landing must be conditioned on NOT owning CRM. (Assertion
    // refreshed 2026-08-05: the resolver was refactored into
    // resolveLandingTarget with an SST door, so the old `isFreeTier ? …`
    // literal no longer existed and this test could never pass.)
    expect(src).toMatch(/ownsCrm \? '\/ep-course'/)
    expect(src).toMatch(/: '\/modules\/101'/)
  })

  it('the public nav sends a CRM owner to /ep-course under "My Course"', () => {
    const src = read('components/SiteNav.tsx')
    expect(src).toMatch(/auth\.ownsCrm \? '\/ep-course' : '\/scat-course'/)
  })

  it('the welcome modal does not push CRM owners into free module 101', () => {
    const src = read('components/dashboard/WelcomeModal.tsx')
    expect(src).toMatch(/ownsCrm \? '\/ep-course'/)
  })
})

describe('CRM buyers stay locked out of CCM paid surfaces', () => {
  it('the sidebar locks paidOnly items on CCM ownership, not on "is paying"', () => {
    const src = read('components/dashboard/Sidebar.tsx')
    // Must gate on CCM specifically — `!isPreview` would have unlocked the CCM
    // toolkit/references/outreach kit for CRM buyers.
    expect(src).toMatch(/const isLocked = item\.paidOnly && !isCcmPaid/)
    expect(src).toMatch(/isCcmPaid = user\?\.accessLevel === 'online-only' \|\| user\?\.accessLevel === 'full-course'/)
  })

  it('the free-tier upsell carrot is shown only to users owning neither stream', () => {
    const src = read('components/dashboard/Sidebar.tsx')
    expect(src).toMatch(/isFreeTier = !isCcmPaid && !ownsCrm/)
    expect(src).toMatch(/\{isFreeTier && \(/)
  })

  it('the CRM sidebar entry is gated on CRM ownership', () => {
    const src = read('components/dashboard/Sidebar.tsx')
    expect(src).toMatch(/crmOnly: true/)
    expect(src).toMatch(/!item\.crmOnly \|\| ownsCrm/)
  })

  it('the CCM learning card stays gated on CCM access', () => {
    const src = read('app/learning/page.tsx')
    expect(src).toMatch(/accessible: isPaidCcm/)
    expect(src).toMatch(/isPaidCcm = accessLevel === 'online-only' \|\| accessLevel === 'full-course'/)
  })

  it('the CCM completion card does not render for CRM-only buyers', () => {
    const src = read('components/dashboard/NextActionCard.tsx')
    // Would otherwise offer an 'online-course' certificate they never earned.
    expect(src).toMatch(/if \(ownsCrm && accessLevel !== 'online-only' && accessLevel !== 'full-course'\)/)
  })
})

describe('CRM buyers see their own course, unlocked', () => {
  it('the learning CRM card opens /ep-course when owned', () => {
    const src = read('app/learning/page.tsx')
    expect(src).toMatch(/accessible: ownsCrm/)
    expect(src).toMatch(/ownsCrm \? '\/ep-course' : '\/concussion-rehab-mastery'/)
    // Was hardcoded `completed: 0` — must read real CRM progress.
    expect(src).not.toMatch(/completed: 0,/)
  })

  it('CRM progress is counted from the 201-208 namespace, not CCM 1-8', () => {
    for (const file of [
      'components/dashboard/Sidebar.tsx',
      'app/learning/page.tsx',
      'components/dashboard/BentoGrid.tsx',
    ]) {
      expect(read(file), file).toMatch(/moduleId >= 201 && p\.moduleId <= 208/)
    }
  })

  it('the session API exposes ownsCrm (the client cannot infer it)', () => {
    const src = read('app/api/auth/session/route.ts')
    // Sourced from course_purchases, never inferred from access_level.
    expect(src).toMatch(/crmEntitlementsFor\(user\.email\)/)
    // Both real-user response paths, not just one.
    expect((src.match(/ownsCrm: crm\.ownsCrm/g) ?? []).length).toBe(2)
  })

  it('the session API also exposes ownsCrmPractical (the CRM upgrade signal)', () => {
    // Without it no client can tell "CRM online" from "CRM complete", and the
    // EP course cannot render a practical-day upsell without mis-selling a
    // seat the buyer already holds.
    const src = read('app/api/auth/session/route.ts')
    expect((src.match(/ownsCrmPractical: crm\.ownsCrmPractical/g) ?? []).length).toBe(2)
  })
})

describe('online-only buyers get an in-person upgrade path', () => {
  it('the sidebar carries a persistent upgrade CTA for online-only buyers', () => {
    const src = read('components/dashboard/Sidebar.tsx')
    // Widened 2026-08-06 from a bare accessLevel check to the shared
    // predicate: Clinic Hub Pack seats read as 'full-course' but bought ONLINE
    // seats only, so they belong in this same audience (lib/practical-day-seat.ts).
    // Online-only buyers still qualify — asserted directly against the predicate
    // in tests/hub-pack-practical-day.test.ts.
    expect(src).toMatch(/holdsOnlineWithoutPracticalDay\(\{/)
    expect(src).toMatch(/accessLevel: user\?\.accessLevel/)
    expect(src).toMatch(/'\/upgrade'/)
  })

  it('the upgrade price is derived from config, never hardcoded', () => {
    const src = read('components/dashboard/Sidebar.tsx')
    expect(src).toMatch(/upgradePriceFor\(/)
    // No literal dollar figure for the upgrade.
    expect(src).not.toMatch(/A\$693|A\$903|A\$600\b/)
  })
})
