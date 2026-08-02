import { describe, it, expect } from 'vitest'
import { computeStatus, computeWindow, type CpdActivityInput } from '@/lib/cpd/rules'
import { getPack, CPD_PACKS } from '@/lib/cpd/packs'

// Hand-computed fixtures per jurisdiction pack (spec §4: "unit-test every
// pack against hand-computed fixtures"). `today` is injected everywhere —
// no clock dependence.

function act(
  date: string,
  hours: number,
  categories: string[] = [],
  status: 'draft' | 'confirmed' = 'confirmed',
  points?: number,
): CpdActivityInput {
  return { date, hours, categories, status, points: points ?? null }
}

describe('cycle windows', () => {
  it('AHPRA year runs 1 Dec – 30 Nov', () => {
    const pack = getPack('au-physio')!
    const w = computeWindow(pack, '2026-08-03')
    expect(w.start).toBe('2025-12-01')
    expect(w.end).toBe('2026-12-01')
    // Just after the anchor
    const w2 = computeWindow(pack, '2026-12-01')
    expect(w2.start).toBe('2026-12-01')
  })

  it('ESSA cycle is the calendar year', () => {
    const w = computeWindow(getPack('au-essa')!, '2026-08-03')
    expect(w.start).toBe('2026-01-01')
    expect(w.end).toBe('2027-01-01')
  })

  it('NZ physio window is rolling 3 years; renewal is APC year end', () => {
    const w = computeWindow(getPack('nz-physio')!, '2026-08-03')
    expect(w.start).toBe('2023-08-03')
    expect(w.end).toBe('2026-08-03')
    expect(w.renewalDate).toBe('2027-04-01')
  })

  it('OCNZ 2-year cycle phases from 1 Apr 2025', () => {
    const w = computeWindow(getPack('nz-osteo')!, '2026-08-03')
    expect(w.start).toBe('2025-04-01')
    expect(w.end).toBe('2027-04-01')
    // In the second cycle year, the per-year sub-window is 2026–27
    expect(w.yearStart).toBe('2026-04-01')
  })
})

describe('AU physio (20 hrs/yr)', () => {
  const pack = getPack('au-physio')!
  it('counts only confirmed activities inside the registration year', () => {
    const s = computeStatus(
      pack,
      [
        act('2026-02-10', 8),
        act('2026-06-01', 6),
        act('2025-11-30', 10), // previous registration year — excluded
        act('2026-07-01', 4, [], 'draft'), // draft — excluded
      ],
      '2026-08-03',
    )
    expect(s.lines[0].logged).toBe(14)
    expect(s.lines[0].shortfall).toBe(6)
    expect(s.overall).toBe('amber')
  })
})

describe('AU osteo (25 hrs incl. 4 mandated)', () => {
  const pack = getPack('au-osteo')!
  it('mandated hours satisfy both the total and the mandated line', () => {
    const s = computeStatus(
      pack,
      [act('2026-03-01', 21), act('2026-05-01', 4, ['mandated-topics'])],
      '2026-08-03',
    )
    expect(s.lines.find((l) => l.id === 'total')!.logged).toBe(25)
    expect(s.lines.find((l) => l.id === 'mandated')!.logged).toBe(4)
    expect(s.overall).toBe('green')
  })
  it('25 untagged hours still fail the mandated line', () => {
    const s = computeStatus(pack, [act('2026-03-01', 25)], '2026-08-03')
    expect(s.lines.find((l) => l.id === 'mandated')!.shortfall).toBe(4)
    expect(s.overall).toBe('amber')
  })
})

describe('AU psych (30 hrs incl. 10 peer consultation + annual learning plan)', () => {
  const pack = getPack('au-psych')!
  it('artifact missing keeps status amber even when hours complete', () => {
    const s = computeStatus(
      pack,
      [act('2026-02-01', 20), act('2026-03-01', 10, ['peer-consultation'])],
      '2026-08-03',
    )
    expect(s.totalShortfall).toBe(0)
    expect(s.artifacts[0].done).toBe(false)
    expect(s.overall).toBe('amber')
  })
  it('learning-plan activity greens the artifact', () => {
    const s = computeStatus(
      pack,
      [
        act('2026-02-01', 20),
        act('2026-03-01', 10, ['peer-consultation']),
        act('2026-01-15', 1, ['learning-plan']),
      ],
      '2026-08-03',
    )
    expect(s.overall).toBe('green')
  })
})

describe('ESSA (20 points, ≥15 Further Education)', () => {
  const pack = getPack('au-essa')!
  it('uses explicit points over hours where provided', () => {
    const s = computeStatus(
      pack,
      [
        act('2026-02-01', 8, ['further-education'], 'confirmed', 16), // 16 pts
        act('2026-04-01', 5), // 5 hrs → 5 pts self-education
      ],
      '2026-08-03',
    )
    expect(s.lines.find((l) => l.id === 'total')!.logged).toBe(21)
    expect(s.lines.find((l) => l.id === 'further-ed')!.logged).toBe(16)
    expect(s.overall).toBe('green')
  })
})

describe('NZ physio (100 hrs rolling 3 years + annual artifacts)', () => {
  const pack = getPack('nz-physio')!
  it('rolling window counts three years of activity; old hours fall off', () => {
    const s = computeStatus(
      pack,
      [
        act('2023-06-01', 40), // > 3 years before today — outside rolling window
        act('2024-06-01', 40),
        act('2025-06-01', 40),
        act('2026-06-01', 30),
      ],
      '2026-08-03',
    )
    expect(s.lines[0].logged).toBe(110)
    expect(s.lines[0].shortfall).toBe(0)
  })
  it('annual artifacts reset each APC year (1 Apr)', () => {
    const s = computeStatus(
      pack,
      [
        act('2026-03-20', 1, ['pdp']), // previous APC year — does not count
        act('2026-05-10', 1, ['peer-review']),
      ],
      '2026-08-03',
    )
    expect(s.artifacts.find((a) => a.id === 'pdp')!.done).toBe(false)
    expect(s.artifacts.find((a) => a.id === 'peer-review')!.done).toBe(true)
  })
})

describe('OCNZ (50 hrs / 2-yr cycle, min 10/yr)', () => {
  const pack = getPack('nz-osteo')!
  it('per-year minimum evaluates the current cycle year only', () => {
    const s = computeStatus(
      pack,
      [
        act('2025-06-01', 30), // cycle year 1
        act('2026-05-01', 6), // cycle year 2 (current) — under the 10/yr minimum
      ],
      '2026-08-03',
    )
    expect(s.lines.find((l) => l.id === 'total')!.logged).toBe(36)
    expect(s.lines.find((l) => l.id === 'annual-min')!.logged).toBe(6)
    expect(s.lines.find((l) => l.id === 'annual-min')!.shortfall).toBe(4)
  })
})

describe('red escalation', () => {
  it('shortfall inside 28 days of renewal goes red', () => {
    const pack = getPack('au-physio')!
    const s = computeStatus(pack, [act('2026-06-01', 5)], '2026-11-20') // 11 days to 1 Dec
    expect(s.overall).toBe('red')
  })
})

describe('pack integrity', () => {
  it('every pack has a total line, source URLs and a verifier', () => {
    for (const p of CPD_PACKS) {
      expect(p.lines.some((l) => l.category === null)).toBe(true)
      for (const l of p.lines) expect(l.sourceUrl).toMatch(/^https:\/\//)
      for (const a of p.artifacts) expect(a.sourceUrl).toMatch(/^https:\/\//)
      expect(p.verifiedBy.length).toBeGreaterThan(0)
    }
  })
})
