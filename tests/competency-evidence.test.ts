import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  COMPETENCY_FINDINGS,
  COMPETENCY_HEADLINE,
  competencyCitations,
  formatCitation,
} from '../lib/competency-evidence'

/**
 * THE COMPETENCY-GAP EVIDENCE IS A COMMERCIAL CLAIM ABOUT OTHER CLINICIANS.
 *
 * It goes in front of ACC contract holders, Guild and clinic groups. Under
 * AHPRA/TGA advertising rules and the ACL, every figure has to be traceable to
 * a primary source and stated without exaggeration — and the failure mode here
 * is subtle: a secondary summary attributed Yorke's vestibular figures to
 * Dobney & Gagnon, and mis-stated Dobney's finding as "one third DISCHARGED
 * patients" when the paper says just over one third PRESCRIBED aerobic exercise.
 * Both were caught by reading the papers. These tests stop either drifting back.
 */
describe('every finding carries a complete, resolvable citation', () => {
  it.each(COMPETENCY_FINDINGS.map((f, i) => [i, f] as const))('finding %i', (_i, f) => {
    expect(f.stat.trim().length).toBeGreaterThan(20)
    expect(f.framing.trim().length).toBeGreaterThan(20)
    expect(['education', 'tooling', 'both']).toContain(f.answeredBy)
    const c = f.citation
    expect(c.authors).toMatch(/[A-Z]/)
    expect(c.year).toBeGreaterThan(2000)
    expect(c.year).toBeLessThanOrEqual(new Date().getFullYear())
    expect(c.journal.length).toBeGreaterThan(3)
    // A DOI, not a bare URL — this is what makes the claim checkable.
    expect(c.doi, `${c.authors} has no valid DOI`).toMatch(/^10\.\d{4,}\/\S+$/)
    expect(c.url).toContain(c.doi)
  })
})

describe('the verified figures are exactly as published', () => {
  const byDoi = (doi: string) => COMPETENCY_FINDINGS.filter((f) => f.citation.doi === doi)

  it('Dobney & Gagnon 2021 — PRESCRIBED aerobic exercise, not "discharged"', () => {
    const dobney = byDoi('10.3138/ptc-2019-0048')
    expect(dobney.length).toBeGreaterThan(0)
    const text = dobney.map((f) => `${f.stat} ${f.framing}`).join(' ')
    // The real finding: ~one third PRESCRIBED it. The mis-reading to guard
    // against is any claim that clinicians discharged patients.
    expect(text).toMatch(/prescrib/i)
    expect(text, 'the "discharged" mis-reading has come back').not.toMatch(/discharg/i)
    expect(text).toMatch(/36%/)
    expect(text).toMatch(/35%/)
    expect(text).toMatch(/n = 555|555/)
    expect(dobney[0].citation.journal).toBe('Physiotherapy Canada')
    expect(dobney[0].citation.year).toBe(2021)
  })

  it('Yorke 2016 — return-to-play confidence and the vestibular figures are ITS findings', () => {
    const yorke = byDoi('10.2522/ptj.20140598')
    expect(yorke.length).toBeGreaterThan(0)
    const text = yorke.map((f) => `${f.stat} ${f.framing}`).join(' ')
    expect(text).toMatch(/return-to-play/i)
    expect(text).toMatch(/1,272/)
    expect(text).toMatch(/43%/)
    expect(yorke[0].citation.journal).toBe('Physical Therapy')
    expect(yorke[0].citation.year).toBe(2016)
  })

  it('the vestibular figures are NOT attributed to the Canadian study', () => {
    const dobneyText = COMPETENCY_FINDINGS.filter((f) => f.citation.doi === '10.3138/ptc-2019-0048')
      .map((f) => `${f.stat} ${f.framing}`)
      .join(' ')
    expect(dobneyText, 'vestibular findings mis-attributed to Dobney & Gagnon').not.toMatch(/vestibular/i)
  })
})

describe('the framing stays defensible', () => {
  it('never accuses clinicians of negligence', () => {
    const all = [COMPETENCY_HEADLINE, ...COMPETENCY_FINDINGS.map((f) => `${f.stat} ${f.framing}`)].join(' ')
    for (const word of ['negligent', 'negligence', 'incompetent', 'malpractice', 'dangerous clinicians', 'failing patients']) {
      expect(all.toLowerCase(), `pejorative framing: "${word}"`).not.toContain(word)
    }
  })

  it('the headline is verifiable against the findings it summarises', () => {
    // "around two thirds do not prescribe" is the inverse of the ~35% who do.
    expect(COMPETENCY_HEADLINE).toMatch(/two thirds/i)
    expect(COMPETENCY_HEADLINE).toMatch(/return-to-play/i)
  })

  it('formatCitation produces a complete reference', () => {
    for (const c of competencyCitations()) {
      const s = formatCitation(c)
      expect(s).toContain(c.authors)
      expect(s).toContain(String(c.year))
      expect(s).toContain(c.journal)
      expect(s).toContain(c.doi)
    }
  })
})

describe('the evidence is actually rendered where it sells', () => {
  const read = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8')

  it('appears on the ACC supplier pitch', () => {
    expect(read('app/acc/page.tsx')).toMatch(/CompetencyGapEvidence/)
  })

  it('appears on the shared clinics / ACC / Guild pitch', () => {
    expect(read('components/platform/SstPitch.tsx')).toMatch(/CompetencyGapEvidence/)
  })

  it('the component renders every citation, not just the stats', () => {
    const src = read('components/clinical/CompetencyGapEvidence.tsx')
    expect(src).toMatch(/competencyCitations\(\)/)
    expect(src).toMatch(/doi:/)
  })
})
