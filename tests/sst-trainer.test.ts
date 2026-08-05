import { describe, it, expect } from 'vitest'
import {
  detectThreshold, computePrescription, progressionDecision,
  type TestInput, type SessionLog, PROVOCATION_RISE,
} from '@/lib/sst-trainer/protocol'

const stage = (minute: number, hr: number, sym: number, rpe?: number) => ({ minute, heartRate: hr, symptomScore: sym, rpe })

describe('detectThreshold — HRt = first stage with >=3-point symptom rise', () => {
  it('symptom-limited: flags HRt at the provoking stage', () => {
    const input: TestInput = {
      restingSymptomScore: 1,
      stages: [stage(1, 110, 1), stage(2, 125, 2), stage(3, 140, 4), stage(4, 150, 6)],
      termination: 'symptom-limited',
    }
    const r = detectThreshold(input)
    expect(r.hrtFound).toBe(true)
    expect(r.hrt).toBe(140)          // first stage where 4 - 1 >= 3
    expect(r.thresholdStage).toBe(3)
    expect(r.interpretation).toBe('physiologic')
  })

  it('exhaustion-limited with no provocation → no intolerance, refer', () => {
    // The terminal Borg is what makes this exhaustion-limited: 'no-intolerance'
    // is clearance-grade, so detectThreshold requires an endpoint to have been
    // reached (RPE >= 17, or the full stage cap). Without it the same stages
    // are an incomplete test — see tests/sst-clinical-integrity.test.ts.
    const input: TestInput = {
      restingSymptomScore: 0,
      stages: [stage(1, 120, 0), stage(2, 150, 1), stage(3, 175, 1, 17)],
      termination: 'exhaustion-limited',
    }
    const r = detectThreshold(input)
    expect(r.hrtFound).toBe(false)
    expect(r.interpretation).toBe('no-intolerance')
  })

  it('red-flag termination → stop + medical review, no HRt', () => {
    const r = detectThreshold({ restingSymptomScore: 2, stages: [stage(1, 130, 2)], termination: 'red-flag' })
    expect(r.interpretation).toBe('red-flag')
    expect(r.hrt).toBeNull()
  })

  it('rise must be >= 3 (a 2-point rise does not trip it)', () => {
    const r = detectThreshold({ restingSymptomScore: 2, stages: [stage(1, 130, 4)], termination: 'exhaustion-limited' })
    expect(r.hrtFound).toBe(false)
    expect(PROVOCATION_RISE).toBe(3)
  })
})

describe('computePrescription — 80-90% HRt band (concussion)', () => {
  it('HRt 150 → 120-135 bpm band', () => {
    const rx = computePrescription(150, 'concussion')
    expect(rx.lowerBpm).toBe(120)
    expect(rx.upperBpm).toBe(135)
    expect(rx.daysPerWeek).toBe(6)
  })
  it('TBI preset is more conservative (70-80%)', () => {
    const rx = computePrescription(150, 'tbi')
    expect(rx.lowerBpm).toBe(105)
    expect(rx.upperBpm).toBe(120)
  })
})

describe('progressionDecision', () => {
  const rx = computePrescription(150, 'concussion')
  const clean: SessionLog = { date: 'd', avgHeartRate: 128, peakHeartRate: 134, preSymptom: 2, peakSymptom: 2, nextDayFlare: false, completedMinutes: 20 }
  const flare: SessionLog = { ...clean, peakSymptom: 5, nextDayFlare: true }

  it('advances after 3 clean sessions', () => {
    const r = progressionDecision(rx, [clean, clean, clean])
    expect(r.decision).toBe('advance')
    expect(r.newCeilingBpm).toBe(rx.upperBpm + 5)
  })
  it('rests + eases the ceiling after two flares in a row', () => {
    const r = progressionDecision(rx, [flare, flare])
    expect(r.decision).toBe('rest')
    expect(r.newCeilingBpm).toBe(rx.upperBpm - 5)
  })
  it('regresses on non-consecutive repeated flares', () => {
    const r = progressionDecision(rx, [flare, clean, flare])
    expect(r.decision).toBe('regress')
    expect(r.newCeilingBpm).toBe(rx.upperBpm - 5)
  })
  it('holds with a mixed/short history', () => {
    expect(progressionDecision(rx, [clean]).decision).toBe('hold')
  })
})
