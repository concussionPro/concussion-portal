import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  detectThreshold,
  computePrescription,
  progressionDecision,
  safeCeilingBpm,
  SESSION_STOP_RISE,
  EXHAUSTION_RPE,
  PROVOCATION_RISE,
  type TestStage,
  type SessionLog,
} from '@/lib/sst-trainer/protocol'

/**
 * EVIDENCE ALIGNMENT — every number here is traceable to a primary source
 * read on 2026-10-07, not to a secondary summary.
 *
 * [1] Leddy JJ, Haider MN, Ellis MJ, et al. "Early Subthreshold Aerobic
 *     Exercise for Sport-Related Concussion: A Randomized Clinical Trial."
 *     JAMA Pediatr. 2019;173(4):319-325. Methods, Aerobic Exercise Group:
 *     "Participants were instructed to stop their home exercise session if
 *      their symptoms increased by 2 or more points from their preexercise
 *      symptom level (on a 10-point visual analog scale) or at 20 minutes,
 *      whichever came first."
 *     and: "The subsymptom threshold aerobic exercise prescription target HR
 *      was calculated as 80% of the HR achieved at symptom exacerbation on the
 *      BCTT at the first visit." / "A new target HR was determined by weekly
 *      clinic BCTT performance for as long as the participant remained
 *      symptomatic."
 * [2] Buffalo Concussion Treadmill Test Instruction Manual, Leddy, Haider &
 *     Willer (UB Concussion Management Clinic). Stopping Criteria:
 *     "Symptom exacerbation – defined as an increase of 3 or more points on
 *      the VAS scale from resting VAS score."
 *     "Voluntary exhaustion – defined as an RPE of > 17 without significant
 *      symptom exacerbation."
 *     Test Protocol step 2: "Remind participant that he/she will be asked to
 *      rate symptom severity and exertion each minute during exercise."
 *     Interpretation: "The maximum HR achieved on the BCTT at symptom
 *      exacerbation is called the Heart Rate threshold (HRt) and a safe level
 *      of exercise is considered to be below 90% of HRt."
 * [3] Haider MN, Leddy JJ, et al. Sports Health 2021: "Patients are advised to
 *     exercise for at least 20 minutes a day at 80% to 90% of the maximum
 *     heart rate achieved on symptom exacerbation." / "It is of paramount
 *     importance to caution patients to avoid sustained exercise above the
 *     symptom threshold because it may prolong symptoms."
 */

const stage = (minute: number, hr: number, sx: number, rpe?: number): TestStage => ({
  minute, heartRate: hr, symptomScore: sx, ...(rpe === undefined ? {} : { rpe }),
})
const clean = (over: Partial<SessionLog> = {}): SessionLog => ({
  date: 'd', avgHeartRate: 128, peakHeartRate: 134, preSymptom: 2, peakSymptom: 2,
  completedMinutes: 20, hrVerified: true, verifiedReadingPct: 100, ...over,
})

describe('[1] within-session stop rule is 2 OR MORE points', () => {
  it('the constant is 2 and every comparison site uses >=', () => {
    expect(SESSION_STOP_RISE).toBe(2)
    for (const f of [
      'lib/sst-trainer/flare.ts',
      'lib/sst-trainer/protocol.ts',
      'components/sst-trainer/TrainingSession.tsx',
      'components/sst-trainer/ProgressDashboard.tsx',
      'app/clinical-hub/page.tsx',
    ]) {
      const src = readFileSync(f, 'utf8')
      expect(src, `${f} still uses a > comparison`).not.toMatch(/[^>=]> SESSION_STOP_RISE/)
    }
  })

  it('a 2-point rise is a provocation, so it blocks an advance', () => {
    const rx = { ...computePrescription(150, 'concussion'), upperBpm: 125 }
    const twoPointRise = clean({ preSymptom: 2, peakSymptom: 4 })
    const r = progressionDecision(rx, [twoPointRise, clean(), clean()])
    expect(r.decision).not.toBe('advance')
  })

  it('a 1-point rise is still tolerated', () => {
    const rx = { ...computePrescription(150, 'concussion'), upperBpm: 125 }
    const onePoint = clean({ preSymptom: 2, peakSymptom: 3 })
    expect(progressionDecision(rx, [onePoint, onePoint, onePoint]).decision).toBe('advance')
  })

  it('patient-facing copy states the same rule the engine applies', () => {
    const email = readFileSync('lib/sst-trainer/patient-welcome-email.ts', 'utf8')
    expect(email).toContain('rise 2 points or more')
    expect(email).not.toContain('more than 2 points')
  })
})

describe('[2][3] the prescribed ceiling never exceeds 90% of HRt', () => {
  it('safeCeilingBpm is the prescription ceiling, not the threshold', () => {
    expect(safeCeilingBpm(150, 'concussion')).toBe(135)
    expect(safeCeilingBpm(150, 'concussion')).toBeLessThan(150)
  })

  it('no run of clean sessions can ever prescribe the provoking heart rate', () => {
    let rx = { ...computePrescription(150, 'concussion'), upperBpm: 120 }
    for (let i = 0; i < 20; i++) {
      const r = progressionDecision(rx, [clean(), clean(), clean()], { condition: 'concussion' })
      if (r.decision !== 'advance') break
      rx = { ...rx, upperBpm: r.newCeilingBpm! }
    }
    expect(rx.upperBpm).toBeLessThanOrEqual(135)
    expect(rx.upperBpm).toBeLessThan(150)
  })
})

describe('[2] the BCTT endpoints match the manual', () => {
  it('symptom exacerbation is 3 or more points', () => {
    expect(PROVOCATION_RISE).toBe(3)
    const r = detectThreshold({
      restingSymptomScore: 1,
      stages: [stage(1, 120, 1), stage(2, 140, 4)],
      termination: 'symptom-limited',
    })
    expect(r.interpretation).toBe('physiologic')
    expect(r.hrt).toBe(140)
  })

  it('voluntary exhaustion needs RPE ABOVE 17 — 17 itself is not an endpoint', () => {
    const at17 = detectThreshold({
      restingSymptomScore: 0,
      stages: [stage(1, 120, 0, 10), stage(2, 170, 0, EXHAUSTION_RPE)],
      termination: 'exhaustion-limited',
    })
    expect(at17.interpretation).toBe('invalid')

    const at18 = detectThreshold({
      restingSymptomScore: 0,
      stages: [stage(1, 120, 0, 10), stage(2, 170, 0, EXHAUSTION_RPE + 1)],
      termination: 'exhaustion-limited',
    })
    expect(at18.interpretation).toBe('no-intolerance')
  })
})

describe('[2] a ramp the patient never rated cannot read as "no symptoms"', () => {
  it('an entirely unrated 20-minute ramp is invalid, not clearance-grade', () => {
    const unrated = Array.from({ length: 20 }, (_, i) => ({
      ...stage(i + 1, 110 + i * 3, 1, 12), symptomRated: false,
    }))
    const r = detectThreshold({ restingSymptomScore: 1, stages: unrated, termination: 'exhaustion-limited' })
    expect(r.interpretation).toBe('invalid')
    expect(r.message).toContain('No symptom ratings')
  })

  it('one rated stage is enough to read the test normally', () => {
    const stages = Array.from({ length: 20 }, (_, i) => ({
      ...stage(i + 1, 110 + i * 3, 1, 12), symptomRated: i === 7,
    }))
    const r = detectThreshold({ restingSymptomScore: 1, stages, termination: 'exhaustion-limited' })
    expect(r.interpretation).toBe('no-intolerance')
  })

  it('legacy and watch rows with no flag at all are unaffected', () => {
    const legacy = Array.from({ length: 20 }, (_, i) => stage(i + 1, 110 + i * 3, 1, 12))
    const r = detectThreshold({ restingSymptomScore: 1, stages: legacy, termination: 'exhaustion-limited' })
    expect(r.interpretation).toBe('no-intolerance')
  })

  it('the guided test no longer resets the rating to resting each minute', () => {
    const src = readFileSync('components/sst-trainer/GuidedTest.tsx', 'utf8')
    expect(src).toContain('SYMPTOM SCORE CARRIES FORWARD')
    expect(src).toContain('symptomRated: ratedRef.current')
  })
})
