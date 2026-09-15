import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { isTrainingFlare } from '@/lib/sst-trainer/flare'
import { SESSION_STOP_RISE } from '@/lib/sst-trainer/protocol'

describe('GP/payer report flare rule matches the in-session stop rule (>2 points)', () => {
  it('uses the shared stop-rise constant of 2', () => {
    expect(SESSION_STOP_RISE).toBe(2)
  })
  it('does not flag a rise of exactly 2 points', () => {
    expect(isTrainingFlare({ preSymptom: 3, peakSymptom: 5 })).toBe(false)
  })
  it('flags a rise of more than 2 points', () => {
    expect(isTrainingFlare({ preSymptom: 3, peakSymptom: 6 })).toBe(true)
  })
  it('flags explicit flare and next-day flare markers', () => {
    expect(isTrainingFlare({ flare: true })).toBe(true)
    expect(isTrainingFlare({ nextDayFlare: true, preSymptom: 1, peakSymptom: 1 })).toBe(true)
  })
  it('does not flag when symptom scores are missing', () => {
    expect(isTrainingFlare({ preSymptom: 2 })).toBe(false)
    expect(isTrainingFlare(null)).toBe(false)
  })
  it('report builders no longer contain a >= 2 point rise rule', () => {
    for (const f of ['lib/sst-trainer/gp-report-pdf.ts', 'lib/sst-trainer/gp-report-html.ts']) {
      const src = readFileSync(f, 'utf8')
      expect(src).not.toMatch(/peak\s*-\s*pre\s*>=\s*2/)
      expect(src).toContain('isTrainingFlare(')
    }
  })
})
