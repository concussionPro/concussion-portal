import { describe, it, expect } from 'vitest'
import { resolveModuleForAccess, PREVIEW_SECTION_COUNT, isScatModuleId } from '../lib/module-access'

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
    const payload = JSON.stringify(r.module)
    expect(payload).not.toContain('correctAnswer')
    expect(payload).not.toContain('explanation')
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
