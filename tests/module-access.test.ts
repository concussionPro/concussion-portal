import { describe, it, expect } from 'vitest'
import { resolveModuleForAccess, resolveFlagshipCallerAccessLevel, PREVIEW_SECTION_COUNT, isScatModuleId } from '../lib/module-access'
import { DEMO_KEY, CLINIC_DEMO_KEY } from '../lib/demo-key'

/**
 * MODULE ACCESS GATING.
 *
 * This resolver is now used in TWO places: the /api/modules/[id] route and the
 * server-rendered /modules/[id] page. Server rendering means a mistake here no
 * longer just leaks over an API — it bakes paid content straight into HTML that
 * ships to an unentitled browser. These assertions are the guard.
 */
describe('paid content never reaches the free tier', () => {
  it('free tier gets only the first sections of Module 1, with quiz answers stripped', () => {
    const r = resolveModuleForAccess(1, 'preview')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.module.sections.length).toBe(PREVIEW_SECTION_COUNT)
    // The locked banner needs every title, but no further CONTENT.
    expect(r.allSectionTitles!.length).toBeGreaterThan(PREVIEW_SECTION_COUNT)
    // The module QUIZ is the graded assessment — its answers are stripped.
    const quiz = JSON.stringify(r.module.quiz)
    expect(quiz).not.toContain('correctAnswer')
    expect(quiz).not.toContain('explanation')

    // Section INTERACTIVES are a different thing: the myths quiz on Module 1's
    // opening section IS the public trial, and has always rendered for free
    // users (it used to reach them through a public JS chunk instead of this
    // payload — see tests/course-answer-key-exposure). What must hold is that
    // the free tier receives ONLY the trial sections' interactives, never one
    // belonging to a section it cannot read.
    const paid = resolveModuleForAccess(1, 'full-course')
    expect(paid.ok).toBe(true)
    if (!paid.ok) return
    const freeIds = new Set(r.module.sections.map((s: { id: string }) => s.id))
    const withheldQuestions = paid.module.sections
      .filter((s: { id: string }) => !freeIds.has(s.id))
      .flatMap((s) => s.interactives ?? [])
      .map((spec) => ('question' in spec ? spec.question : spec.title))
    expect(withheldQuestions.length).toBeGreaterThan(0)

    const payload = JSON.stringify(r.module)
    for (const q of withheldQuestions) expect(payload).not.toContain(q)
  })

  it('the truncated payload contains no withheld section CONTENT', () => {
    const free = resolveModuleForAccess(1, 'preview')
    const paid = resolveModuleForAccess(1, 'online-only')
    expect(free.ok && paid.ok).toBe(true)
    if (!free.ok || !paid.ok) return
    const freeIds = new Set(free.module.sections.map((s: { id: string }) => s.id))
    const withheld = paid.module.sections.filter((s: { id: string }) => !freeIds.has(s.id))
    expect(withheld.length).toBeGreaterThan(0)

    const freePayload = JSON.stringify(free.module)
    for (const s of withheld as Array<{ id: string; content: string[] }>) {
      for (const line of s.content) {
        // Section IDS and TITLES are exposed on purpose (the locked banner and
        // the parts table-of-contents advertise what's behind the paywall).
        // The prose is what must never ship. Compare on a distinctive slice so
        // shared boilerplate can't produce a false pass.
        const probe = line.trim().slice(0, 80)
        if (probe.length < 40) continue
        expect(freePayload, `content from withheld section '${s.id}' leaked`).not.toContain(probe)
      }
    }
  })

  it('free tier is refused modules 2-8 with an upgrade flag, not content', () => {
    for (const id of [2, 3, 4, 5, 6, 7, 8]) {
      const r = resolveModuleForAccess(id, 'preview')
      expect(r.ok, `module ${id} must not resolve for the free tier`).toBe(false)
      if (r.ok) continue
      expect(r.status).toBe(403)
      expect(r.upgrade).toBe(true)
    }
  })

  it('unauthenticated callers get nothing', () => {
    for (const id of [1, 4, 101]) {
      const r = resolveModuleForAccess(id, null)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.status).toBe(401)
    }
  })
})

describe('entitled users get the whole module', () => {
  it.each(['online-only', 'full-course'] as const)('%s gets full content + answers', (level) => {
    const r = resolveModuleForAccess(1, level)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.module.sections.length).toBeGreaterThan(PREVIEW_SECTION_COUNT)
    expect(r.allSectionTitles).toBeUndefined() // no locked banner for paid users
    expect(JSON.stringify(r.module)).toContain('correctAnswer')
  })
})

describe('the public trial stays a TRIAL', () => {
  // The whole commercial model rests on the trial being a taste, not the course.
  // These are hard ceilings, asserted on the real content — if a change ever
  // widens the unlock (or a renderer change starts mounting locked sections),
  // this fails rather than quietly giving the course away.
  it('unlocks 3 sections of Module 1 and exactly 1 of every other module', async () => {
    const { getPreviewContent, MODULE_1_PREVIEW_COUNT } = await import('../lib/preview-content')
    for (const course of ['ccm', 'crm'] as const) {
      const data = getPreviewContent(course)
      expect(data.length).toBe(8)
      for (const m of data) {
        const limit = m.id === 1 ? MODULE_1_PREVIEW_COUNT : 1
        expect(m.previewSections.length, `${course} module ${m.id} unlocked too many sections`).toBe(limit)
        // Every module must still be MOSTLY locked.
        expect(m.previewSections.length, `${course} module ${m.id} is barely locked`).toBeLessThan(
          m.totalSections,
        )
      }
    }
  })

  it('exposes only a small fraction of the paid course', async () => {
    const { getPreviewContent } = await import('../lib/preview-content')
    const { getAllModules } = await import('../data/modules')
    const words = (a: string[]) => a.join(' ').split(/\s+/).filter(Boolean).length
    const exposed = getPreviewContent('ccm').reduce(
      (n, m) => n + m.previewSections.reduce((k, s) => k + words(s.content), 0),
      0,
    )
    const total = getAllModules().reduce(
      (n, m) => n + m.sections.reduce((k, s) => k + words(s.content), 0),
      0,
    )
    const pct = (exposed / total) * 100
    // Currently ~2.8%. A generous ceiling that still catches "the trial now
    // serves whole modules" — which is exactly the mistake a rendering change
    // could introduce without touching the unlock counts.
    expect(pct, `public trial exposes ${pct.toFixed(1)}% of the paid course`).toBeLessThan(8)
  })
})

describe('the free SCAT course stays free', () => {
  it('SCAT modules resolve in FULL for the free tier, answers included', () => {
    for (const id of [101, 102, 103]) {
      expect(isScatModuleId(id)).toBe(true)
      const r = resolveModuleForAccess(id, 'preview')
      expect(r.ok, `SCAT module ${id} must be free`).toBe(true)
      if (!r.ok) continue
      // Never truncated, and answers must be present so free users can complete
      // the quiz and earn their CPD hour.
      expect(r.allSectionTitles).toBeUndefined()
      expect(JSON.stringify(r.module)).toContain('correctAnswer')
    }
  })
})

describe('per-module trial pages carry no extra content', () => {
  // /preview/[module] renders straight from getPreviewContent, so it can only
  // ever show what the hub page and the API already expose. This asserts the
  // page adds URLS, never CONTENT — the exact thing a "make it more indexable"
  // change could get wrong.
  it('each module page would render only that module’s unlocked sections', async () => {
    const { getPreviewContent, MODULE_1_PREVIEW_COUNT } = await import('../lib/preview-content')
    for (const course of ['ccm', 'crm'] as const) {
      const data = getPreviewContent(course)
      for (let id = 1; id <= 8; id++) {
        const m = data.find((x) => x.id === id)
        expect(m, `${course} module ${id} missing`).toBeTruthy()
        expect(m!.previewSections.length).toBe(id === 1 ? MODULE_1_PREVIEW_COUNT : 1)
      }
    }
  })
})


describe('resolveFlagshipCallerAccessLevel — demo vs clinic vs anonymous', () => {
  // Same file as the content resolver — same regression surface for the
  // cookie → AccessLevel mapping used by /modules/[id] and /api/modules/[id].
  it('DEMO_KEY alone is full-course (reviewer /demo/essa)', () => {
    expect(
      resolveFlagshipCallerAccessLevel({
        demoKeyCookie: DEMO_KEY,
        nodeEnv: 'production',
      }),
    ).toBe('full-course')
  })

  it('clinic_demo alone stays preview — never opens paid CCM', () => {
    expect(
      resolveFlagshipCallerAccessLevel({
        clinicDemoCookie: CLINIC_DEMO_KEY,
        nodeEnv: 'production',
      }),
    ).toBe('preview')
  })

  it('DEMO_KEY wins over clinic_demo when both cookies are present', () => {
    expect(
      resolveFlagshipCallerAccessLevel({
        demoKeyCookie: DEMO_KEY,
        clinicDemoCookie: CLINIC_DEMO_KEY,
        nodeEnv: 'production',
      }),
    ).toBe('full-course')
  })

  it('anonymous production callers get null (401 Authentication required)', () => {
    expect(
      resolveFlagshipCallerAccessLevel({
        nodeEnv: 'production',
      }),
    ).toBeNull()
  })

  it('a wrong demo_key value never grants full-course', () => {
    expect(
      resolveFlagshipCallerAccessLevel({
        demoKeyCookie: 'guessed-key',
        nodeEnv: 'production',
      }),
    ).toBeNull()
  })

  it('a real session claim still applies when there is no demo_key', () => {
    expect(
      resolveFlagshipCallerAccessLevel({
        sessionAccessLevel: 'online-only',
        nodeEnv: 'production',
      }),
    ).toBe('online-only')
    expect(
      resolveFlagshipCallerAccessLevel({
        sessionAccessLevel: 'preview',
        clinicDemoCookie: CLINIC_DEMO_KEY,
        nodeEnv: 'production',
      }),
    ).toBe('preview')
  })
})
