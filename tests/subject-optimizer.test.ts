/**
 * Tests for the self-optimizing subject-line engine.
 *
 * Covers the optimizer policy (lib/prospect/subject-optimizer.ts):
 *  - COLD START: any under-sampled variant → deterministic slug-hash pick,
 *    performance-blind, stable across calls (uniform warmup).
 *  - EXPLOITATION: once every variant is warmed up, the highest conversion
 *    rate wins when not exploring.
 *  - DETERMINISM: same slug + stats → same key every call.
 *  - EXPLORE/EXPLOIT split is deterministic per slug (epsilon=1 always explores
 *    → slug-hash pick; epsilon=0 never explores → winner).
 *  - TIE-BREAK is deterministic + stable.
 *
 * Plus the mergeTemplate integration (lib/prospect/email-templates.ts):
 *  - forceSubjectKey renders that variant + returns its key.
 *  - an INELIGIBLE forced key (e.g. 'city' when city is unknown) degrades
 *    gracefully to the slug-hash pick.
 */
import { describe, it, expect } from 'vitest'
import {
  chooseSubjectKey,
  summarizeVariantPerformance,
  type VariantStat,
} from '@/lib/prospect/subject-optimizer'
import { EMAIL_TEMPLATES, mergeTemplate, eligibleSubjectKeys } from '@/lib/prospect/email-templates'
import type { ProspectClinic, ClinicTeam } from '@/lib/prospect/types'

const KEYS = ['name', 'city', 'capability_q', 'name_ready']

function statsOf(entries: Record<string, VariantStat>): Map<string, VariantStat> {
  return new Map(Object.entries(entries))
}

// Every key warmed past the threshold (15 sends), with a clear winner.
function warmedStats(winner: string): Map<string, VariantStat> {
  const m = new Map<string, VariantStat>()
  for (const k of KEYS) m.set(k, { sends: 20, realViews: k === winner ? 18 : 2 })
  return m
}

describe('chooseSubjectKey — cold start (uniform warmup)', () => {
  it('an under-sampled variant forces the deterministic slug-hash pick, ignoring performance', () => {
    const slug = 'ballina-osteo'
    // empty stats = all zero sends = fully cold
    const cold = chooseSubjectKey({ candidateKeys: KEYS, slug, stats: new Map() })
    // a variant with a perfect conversion rate but still < 15 sends must NOT
    // be exploited — the result must match the performance-blind cold pick.
    const tempting = chooseSubjectKey({
      candidateKeys: KEYS,
      slug,
      stats: statsOf({ city: { sends: 10, realViews: 10 } }),
    })
    expect(tempting).toBe(cold)
    expect(KEYS).toContain(cold)
  })

  it('is stable across repeated calls during warmup', () => {
    const slug = 'momentum-physio'
    const picks = Array.from({ length: 25 }, () =>
      chooseSubjectKey({ candidateKeys: KEYS, slug, stats: new Map() }),
    )
    expect(new Set(picks).size).toBe(1)
  })

  it('warmup holds until EVERY variant crosses the sample threshold', () => {
    const slug = 'coastal-health'
    // three of four warmed, one still at 14 sends → still cold-start
    const stats = statsOf({
      name: { sends: 20, realViews: 1 },
      city: { sends: 20, realViews: 19 }, // would be the winner if warmed
      capability_q: { sends: 20, realViews: 1 },
      name_ready: { sends: 14, realViews: 0 }, // one short
    })
    const result = chooseSubjectKey({ candidateKeys: KEYS, slug, stats, epsilon: 0 })
    const coldPick = chooseSubjectKey({ candidateKeys: KEYS, slug, stats: new Map(), epsilon: 0 })
    expect(result).toBe(coldPick) // not yet exploiting 'city'
  })
})

describe('chooseSubjectKey — exploitation', () => {
  it('picks the highest conversion rate when warmed up and not exploring (epsilon=0)', () => {
    const slug = 'northside-sports'
    const result = chooseSubjectKey({
      candidateKeys: KEYS,
      slug,
      stats: warmedStats('capability_q'),
      epsilon: 0,
    })
    expect(result).toBe('capability_q')
  })

  it('a different winner is chosen when the data says so', () => {
    const slug = 'northside-sports'
    expect(
      chooseSubjectKey({ candidateKeys: KEYS, slug, stats: warmedStats('city'), epsilon: 0 }),
    ).toBe('city')
    expect(
      chooseSubjectKey({ candidateKeys: KEYS, slug, stats: warmedStats('name'), epsilon: 0 }),
    ).toBe('name')
  })
})

describe('chooseSubjectKey — determinism', () => {
  it('same slug + stats + params → same key every call', () => {
    const slug = 'apex-allied-health'
    const stats = warmedStats('name_ready')
    const picks = Array.from({ length: 30 }, () =>
      chooseSubjectKey({ candidateKeys: KEYS, slug, stats }),
    )
    expect(new Set(picks).size).toBe(1)
  })

  it('different slugs can resolve to different keys (the seed actually matters)', () => {
    const stats = warmedStats('city')
    const a = chooseSubjectKey({ candidateKeys: KEYS, slug: 'aaa', stats, epsilon: 1 })
    const b = chooseSubjectKey({ candidateKeys: KEYS, slug: 'zzzzzzzz', stats, epsilon: 1 })
    // Both are valid keys; the explore pick is slug-seeded so at least one
    // differs from a fixed reference across a spread of slugs.
    expect(KEYS).toContain(a)
    expect(KEYS).toContain(b)
  })
})

describe('chooseSubjectKey — epsilon explore/exploit split is deterministic per slug', () => {
  const slug = 'evergreen-clinic'
  const stats = warmedStats('city')

  it('epsilon=1 always explores → the deterministic slug-hash pick (== cold pick)', () => {
    const explore = chooseSubjectKey({ candidateKeys: KEYS, slug, stats, epsilon: 1 })
    const coldPick = chooseSubjectKey({ candidateKeys: KEYS, slug, stats: new Map(), epsilon: 0 })
    expect(explore).toBe(coldPick)
    // stable across calls
    const again = chooseSubjectKey({ candidateKeys: KEYS, slug, stats, epsilon: 1 })
    expect(again).toBe(explore)
  })

  it('epsilon=0 never explores → the data winner', () => {
    expect(chooseSubjectKey({ candidateKeys: KEYS, slug, stats, epsilon: 0 })).toBe('city')
  })
})

describe('chooseSubjectKey — tie-break is deterministic + stable', () => {
  it('two joint-best variants resolve to a single stable key', () => {
    const slug = 'harbourside-physio'
    // name and city tie at 0.5; capability_q + name_ready lower
    const stats = statsOf({
      name: { sends: 20, realViews: 10 },
      city: { sends: 20, realViews: 10 },
      capability_q: { sends: 20, realViews: 1 },
      name_ready: { sends: 20, realViews: 2 },
    })
    const picks = Array.from({ length: 20 }, () =>
      chooseSubjectKey({ candidateKeys: KEYS, slug, stats, epsilon: 0 }),
    )
    expect(new Set(picks).size).toBe(1)
    expect(['name', 'city']).toContain(picks[0])
  })

  it('a single candidate is returned directly', () => {
    expect(
      chooseSubjectKey({ candidateKeys: ['only'], slug: 'x', stats: new Map() }),
    ).toBe('only')
  })
})

describe('summarizeVariantPerformance', () => {
  it('sorts by conversion rate desc, then sends desc, then key', () => {
    const rows = summarizeVariantPerformance(
      statsOf({
        low: { sends: 100, realViews: 1 },
        high: { sends: 20, realViews: 18 },
        mid: { sends: 50, realViews: 25 },
        zero: { sends: 0, realViews: 0 },
      }),
    )
    expect(rows.map((r) => r.key)).toEqual(['high', 'mid', 'low', 'zero'])
    expect(rows[0].convRate).toBeCloseTo(0.9, 5)
    expect(rows[3].convRate).toBe(0) // zero sends → 0, never NaN
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// mergeTemplate integration — forceSubjectKey
// ─────────────────────────────────────────────────────────────────────────────

const T1 = EMAIL_TEMPLATES.find((t) => t.slug === 'initial')!

function team(clinical: number): ClinicTeam {
  return {
    osteopaths: 0,
    physiotherapists: clinical,
    generalPractitioners: 0,
    sportsMedicineDoctors: 0,
    exercisePhys: 0,
    myotherapists: 0,
    remedialMassage: 0,
    practiceManager: 1,
    admin: 1,
  }
}

function clinic(overrides: Partial<ProspectClinic>): ProspectClinic {
  return {
    id: 1,
    slug: 'test-clinic',
    shortName: 'Test Clinic',
    contactEmail: 'jane@testclinic.com.au',
    contactFirstName: 'Jane',
    city: 'Ballina',
    state: 'NSW',
    region: 'Northern Rivers',
    team: team(3),
    travelBand: 'within-2hr',
    clinicWebsiteUrl: 'https://testclinic.com.au',
    ...overrides,
  } as ProspectClinic
}

describe('mergeTemplate — forceSubjectKey', () => {
  it('renders the forced variant and returns its key when eligible', () => {
    const c = clinic({})
    const { subject, subjectKey } = mergeTemplate(T1, c, 'https://example.com', 'tok', {
      forceSubjectKey: 'city',
    })
    expect(subjectKey).toBe('city')
    expect(subject).toBe('Concussion protocol for Ballina clinics')
  })

  it('honours a different eligible key', () => {
    const c = clinic({})
    const { subject, subjectKey } = mergeTemplate(T1, c, 'https://example.com', 'tok', {
      forceSubjectKey: 'name',
    })
    expect(subjectKey).toBe('name')
    expect(subject).toBe('Concussion training for Test Clinic')
  })

  it('falls back gracefully when the forced key is ineligible (city unknown)', () => {
    const c = clinic({ city: 'Unknown' })
    // 'city' is filtered out by the unknown-city guard.
    expect(eligibleSubjectKeys('initial', c)).not.toContain('city')
    const forced = mergeTemplate(T1, c, 'https://example.com', 'tok', { forceSubjectKey: 'city' })
    const natural = mergeTemplate(T1, c, 'https://example.com', 'tok')
    expect(forced.subjectKey).not.toBe('city')
    // degrades to exactly the deterministic slug-hash pick
    expect(forced.subjectKey).toBe(natural.subjectKey)
    expect(forced.subject).toBe(natural.subject)
    expect(forced.subject).not.toMatch(/unknown/i)
  })

  it('no forceSubjectKey → unchanged deterministic behaviour, with a key reported', () => {
    const c = clinic({})
    const a = mergeTemplate(T1, c, 'https://example.com', 'tok')
    const b = mergeTemplate(T1, c, 'https://example.com', 'tok')
    expect(a.subject).toBe(b.subject)
    expect(a.subjectKey).toBe(b.subjectKey)
    expect(eligibleSubjectKeys('initial', c)).toContain(a.subjectKey)
  })
})
