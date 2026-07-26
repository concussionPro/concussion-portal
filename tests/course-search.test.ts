import { describe, it, expect } from 'vitest'
import { corporaFor, searchCourses } from '../lib/course-search'

/**
 * SEARCH MUST NOT BECOME A PAYWALL BYPASS.
 *
 * Search reads the full course content server-side. If the corpus were built
 * from everything and filtered afterwards, one forgotten filter would leak paid
 * prose to a free-tier user as a "snippet". The design makes that impossible —
 * the corpus is built from what the viewer owns — and these tests hold that
 * line, because it is the kind of thing a later refactor quietly breaks.
 */
describe('search scope follows entitlement', () => {
  it('a free-tier viewer searches only the free SCAT course', () => {
    const corpora = corporaFor({ ccm: false, crm: false })
    expect(corpora.map((c) => c.course)).toEqual(['scat'])
  })

  it('a CCM buyer gets the flagship modules, a CRM buyer gets the EP modules', () => {
    expect(corporaFor({ ccm: true, crm: false }).map((c) => c.course).sort()).toEqual(['ccm', 'scat'])
    expect(corporaFor({ ccm: false, crm: true }).map((c) => c.course).sort()).toEqual(['crm', 'scat'])
    expect(corporaFor({ ccm: true, crm: true }).map((c) => c.course).sort()).toEqual(['ccm', 'crm', 'scat'])
  })

  it('free-tier results never contain paid CCM content', () => {
    // A term that appears in the paid flagship course.
    const paidHits = searchCourses(corporaFor({ ccm: true, crm: false }), 'neurometabolic')
    expect(paidHits.some((h) => h.course === 'ccm')).toBe(true)

    const freeHits = searchCourses(corporaFor({ ccm: false, crm: false }), 'neurometabolic')
    expect(freeHits.every((h) => h.course === 'scat'), 'paid content surfaced to a free-tier search').toBe(true)
  })

  it('free-tier results never contain CRM content either', () => {
    const freeHits = searchCourses(corporaFor({ ccm: false, crm: false }), 'threshold')
    expect(freeHits.every((h) => h.course === 'scat')).toBe(true)
  })
})

describe('search behaviour', () => {
  const all = corporaFor({ ccm: true, crm: true })

  it('ignores queries shorter than two characters', () => {
    expect(searchCourses(all, '')).toEqual([])
    expect(searchCourses(all, 'a')).toEqual([])
  })

  it('finds real clinical terms and returns usable links', () => {
    const hits = searchCourses(all, 'concussion')
    expect(hits.length).toBeGreaterThan(0)
    for (const h of hits) {
      expect(h.href).toMatch(/^\/(modules|ep-course\/modules)\/\d+/)
      expect(h.snippet.length).toBeGreaterThan(0)
      // Snippets are prose for a human — the content DSL must be stripped.
      expect(h.snippet).not.toMatch(/\[(CALLOUT|INFOGRAPHIC|VIDEO|POLL|REVEAL):/)
    }
  })

  it('ranks a title match above a body-only match', () => {
    const hits = searchCourses(all, 'learning objectives')
    if (hits.length > 1) {
      const titled = hits.findIndex((h) => (h.sectionTitle ?? '').toLowerCase().includes('learning objectives'))
      const bodyOnly = hits.findIndex((h) => !(h.sectionTitle ?? '').toLowerCase().includes('learning objectives'))
      if (titled >= 0 && bodyOnly >= 0) expect(titled).toBeLessThan(bodyOnly)
    }
  })

  it('is case-insensitive and bounded', () => {
    const lower = searchCourses(all, 'bess')
    const upper = searchCourses(all, 'BESS')
    expect(upper.length).toBe(lower.length)
    expect(searchCourses(all, 'e', 5).length).toBe(0) // too short
    expect(searchCourses(all, 'the', 5).length).toBeLessThanOrEqual(5)
  })
})
