import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { isTrainingFlare } from '@/lib/sst-trainer/flare'
import { SESSION_STOP_RISE } from '@/lib/sst-trainer/protocol'

/**
 * CORRECTED 2026-10-07 against the primary source.
 *
 * This file previously asserted that a rise of exactly 2 points is NOT a
 * flare, on the reading that Amsterdam 2023 tolerates a 2-point rise.
 * Patricios et al. endorse sub-symptom-threshold aerobic exercise without
 * specifying a within-session symptom tolerance, so there was no consensus
 * number to weigh against the protocol of the trial this product implements:
 *
 *   "Participants were instructed to stop their home exercise session if their
 *    symptoms increased by 2 or more points from their preexercise symptom
 *    level (on a 10-point visual analog scale) or at 20 minutes, whichever
 *    came first."
 *   — Leddy JJ, Haider MN, Ellis MJ, et al. JAMA Pediatr. 2019;173(4):319-325,
 *     Methods, Aerobic Exercise Group.
 *
 * The GP/payer report rule and the in-session stop rule must agree with that,
 * and with the four product surfaces that already stated ≥2 (GP PDF footer,
 * medicolegal record, EP toolkit, trainer demo).
 */
describe('GP/payer report flare rule matches the in-session stop rule (>=2 points)', () => {
  it('uses the shared stop-rise constant of 2', () => {
    expect(SESSION_STOP_RISE).toBe(2)
  })

  it('FLAGS a rise of exactly 2 points — "2 or more points" (Leddy 2019)', () => {
    expect(isTrainingFlare({ preSymptom: 3, peakSymptom: 5 })).toBe(true)
  })

  it('flags a rise of more than 2 points', () => {
    expect(isTrainingFlare({ preSymptom: 3, peakSymptom: 6 })).toBe(true)
  })

  it('does not flag a rise of 1 point — below the trial threshold', () => {
    expect(isTrainingFlare({ preSymptom: 3, peakSymptom: 4 })).toBe(false)
  })

  it('does not flag an unchanged or falling score', () => {
    expect(isTrainingFlare({ preSymptom: 4, peakSymptom: 4 })).toBe(false)
    expect(isTrainingFlare({ preSymptom: 4, peakSymptom: 2 })).toBe(false)
  })

  it('flags explicit flare and next-day flare markers', () => {
    expect(isTrainingFlare({ flare: true })).toBe(true)
    expect(isTrainingFlare({ nextDayFlare: true, preSymptom: 1, peakSymptom: 1 })).toBe(true)
  })

  it('does not flag when symptom scores are missing', () => {
    expect(isTrainingFlare({ preSymptom: 2 })).toBe(false)
    expect(isTrainingFlare(null)).toBe(false)
  })

  it('report builders delegate to the shared rule rather than inlining a number', () => {
    for (const f of ['lib/sst-trainer/gp-report-pdf.ts', 'lib/sst-trainer/gp-report-html.ts']) {
      const src = readFileSync(f, 'utf8')
      expect(src).not.toMatch(/peak\s*-\s*pre\s*>\s*2/)
      expect(src).toContain('isTrainingFlare(')
    }
  })
})
