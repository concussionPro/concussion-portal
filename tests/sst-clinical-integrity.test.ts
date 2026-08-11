/**
 * SST Trainer — CLINICAL INTEGRITY tests.
 *
 * Complements tests/sst-protocol.test.ts (band math, progression, spacing) and
 * tests/sst-trainer.test.ts (threshold detection basics). This file proves the
 * two properties those don't:
 *
 *   1. The published NUMBERS are the numbers the engine computes — the 80–90%
 *      band, the condition presets, the Haider HRt<135 / ΔHR≤50 flag, and the
 *      BCTT constants the protocol comment cites (>=3-point provocation rise,
 *      >=2-point in-session stop, RPE 17 exhaustion endpoint).
 *   2. An ABORTED / INCOMPLETE / NO-HR / ERRORED test can never derive as a
 *      pass — no HRt, no prescription, and above all no 'no-intolerance',
 *      which is the clearance-grade read that drives the clinician hub's
 *      clearance banner and the GP report's "tolerance recovered" line.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  detectThreshold,
  computePrescription,
  progressionDecision,
  sessionVerification,
  isVerifiedReading,
  EXHAUSTION_RPE,
  BORG_MAX,
  PROTOCOL_STAGE_CAP,
  PROVOCATION_RISE,
  SESSION_STOP_RISE,
  type SessionLog,
  type TestInput,
  type TestStage,
} from '@/lib/sst-trainer/protocol'

const stage = (minute: number, heartRate: number, symptomScore: number, rpe?: number): TestStage => ({
  minute,
  heartRate,
  symptomScore,
  ...(rpe === undefined ? {} : { rpe }),
})

// ─────────────────────────────────────────────────────────────────────────────
// 1. THE ARITHMETIC — recomputed by hand against the cited constants.
// ─────────────────────────────────────────────────────────────────────────────

describe('HR threshold arithmetic — hand-checked against the cited constants', () => {
  it('the BCTT constants match the protocol the engine cites', () => {
    expect(PROVOCATION_RISE).toBe(3) // symptom exacerbation endpoint
    // Maximum ACCEPTABLE in-session rise — the stop fires when the rise
    // EXCEEDS this (Amsterdam 2023: a <=2-pt exacerbation is tolerated).
    expect(SESSION_STOP_RISE).toBe(2)
    expect(EXHAUSTION_RPE).toBe(17) // voluntary-exhaustion endpoint (Borg 6–20)
  })

  it('concussion band = 80% / 90% of HRt, rounded — checked by hand', () => {
    // 135 * 0.8 = 108.0 → 108 ; 135 * 0.9 = 121.5 → 122 (Math.round, half-up)
    expect(computePrescription(135)).toMatchObject({ lowerBpm: 108, upperBpm: 122 })
    // 145 * 0.8 = 116.0 → 116 ; 145 * 0.9 = 130.5 → 131
    expect(computePrescription(145)).toMatchObject({ lowerBpm: 116, upperBpm: 131 })
    // 173 * 0.8 = 138.4 → 138 ; 173 * 0.9 = 155.7 → 156
    expect(computePrescription(173)).toMatchObject({ lowerBpm: 138, upperBpm: 156 })
  })

  it('the do-not-exceed ceiling is ALWAYS strictly under the measured HRt', () => {
    for (let hrt = 60; hrt <= 220; hrt++) {
      const rx = computePrescription(hrt)
      expect(rx.upperBpm, `ceiling reached HRt at ${hrt}`).toBeLessThan(hrt)
      expect(rx.lowerBpm).toBeLessThan(rx.upperBpm)
    }
  })

  it('the dose is evidence-fixed at 20 min / 6 d-wk for concussion & mTBI', () => {
    for (const c of ['concussion', 'mtbi'] as const) {
      const rx = computePrescription(150, c)
      expect(rx.sessionMinutes).toBe(20)
      expect(rx.daysPerWeek).toBe(6)
      expect(rx.stopRisePoints).toBe(SESSION_STOP_RISE)
    }
  })

  it('every condition preset stays inside its own documented %-band', () => {
    const bands: Record<string, [number, number]> = {
      concussion: [0.8, 0.9],
      mtbi: [0.8, 0.9],
      tbi: [0.7, 0.8],
      'neuro-other': [0.7, 0.85],
      cancer: [0.65, 0.8],
      'long-covid': [0.7, 0.8],
      cardiac: [0.6, 0.75],
    }
    for (const [condition, [lo, hi]] of Object.entries(bands)) {
      const rx = computePrescription(160, condition as Parameters<typeof computePrescription>[1])
      expect(rx.lowerBpm, condition).toBe(Math.round(160 * lo))
      expect(rx.upperBpm, condition).toBe(Math.round(160 * hi))
    }
  })

  it('the Haider 2019 prognostic flag fires exactly at HRt < 135 / ΔHR <= 50', () => {
    expect(computePrescription(134).prolongedRecoveryRisk).toBe(true)
    expect(computePrescription(135).prolongedRecoveryRisk).toBe(false) // boundary is strict <
    // ΔHR = HRt − resting; 50 flags, 51 does not
    expect(computePrescription(150, 'concussion', { restingHr: 100 }).prolongedRecoveryRisk).toBe(true)
    expect(computePrescription(150, 'concussion', { restingHr: 99 }).prolongedRecoveryRisk).toBe(false)
    // it is prognostic ONLY — the dose must not move
    expect(computePrescription(120).sessionMinutes).toBe(computePrescription(180).sessionMinutes)
  })

  it('the summary copy quotes the same numbers the object carries', () => {
    const rx = computePrescription(150)
    expect(rx.summary).toContain(`${rx.lowerBpm}-${rx.upperBpm} bpm`)
    expect(rx.summary).toContain('80-90%')
    expect(rx.summary).toContain(`${rx.sessionMinutes} minutes`)
    expect(rx.summary).toContain(`more than ${SESSION_STOP_RISE} points`)
  })

  it('HRt is the HR at the FIRST provoking stage, not the peak of the test', () => {
    const r = detectThreshold({
      restingSymptomScore: 2,
      stages: [stage(1, 110, 2, 9), stage(2, 128, 5, 11), stage(3, 152, 8, 13)],
      termination: 'symptom-limited',
    })
    expect(r.hrt).toBe(128) // first stage where 5 − 2 >= 3 — NOT 152
    expect(r.thresholdStage).toBe(2)
    expect(r.interpretation).toBe('physiologic')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 1b. PHYSIOLOGICAL VALIDITY GATE (owner, 2026-08-11) — a garbage HRt is
//     invalid, never a prescription. The motivating case: a demo run accepted
//     HRt 65 bpm beside a resting HR of 76 and prescribed a 52–59 band the
//     patient exceeded by sitting still.
// ─────────────────────────────────────────────────────────────────────────────

describe('physiological validity gate — an HRt below rest is artefact, not a result', () => {
  it('rejects a threshold-stage HR below the first stage (HR fell while effort ramped)', () => {
    const r = detectThreshold({
      restingSymptomScore: 0,
      // start at 76 bpm, "threshold" logged at 65 — the live demo case
      stages: [stage(1, 76, 0, 9), stage(2, 73, 1, 11), stage(3, 65, 3, 12)],
      termination: 'symptom-limited',
    })
    expect(r.interpretation).toBe('invalid')
    expect(r.hrt).toBeNull()
    expect(r.hrtFound).toBe(false)
    expect(r.message).toContain('65 bpm')
  })

  it('with resting HR known, rejects an HRt inside the MIN_HRT_ABOVE_RESTING margin', () => {
    const r = detectThreshold({
      restingSymptomScore: 0,
      restingHr: 76,
      // rises from stage 1, so the stage gate alone would pass — but 84 bpm is
      // only ΔHR 8 above rest, inside the 15 bpm margin
      stages: [stage(1, 80, 0, 9), stage(2, 84, 3, 11)],
      termination: 'symptom-limited',
    })
    expect(r.interpretation).toBe('invalid')
    expect(r.hrt).toBeNull()
  })

  it('with resting HR known, rejects a band whose floor sits at or below resting', () => {
    // HRt 116 clears resting 95 by 21 bpm (margin OK), but the 80% floor is
    // 93 bpm — below rest, so the band is exceeded sitting still.
    const r = detectThreshold({
      restingSymptomScore: 0,
      restingHr: 95,
      stages: [stage(1, 100, 0, 9), stage(2, 116, 3, 11)],
      termination: 'symptom-limited',
    })
    expect(r.interpretation).toBe('invalid')
  })

  it('passes a plausible result (resting 62, HRt 132 → band 106–119)', () => {
    const r = detectThreshold({
      restingSymptomScore: 0,
      restingHr: 62,
      stages: [stage(1, 95, 0, 9), stage(2, 118, 1, 11), stage(3, 132, 3, 13)],
      termination: 'symptom-limited',
    })
    expect(r.interpretation).toBe('physiologic')
    expect(r.hrt).toBe(132)
    const rx = computePrescription(132)
    expect(rx.lowerBpm).toBe(106)
    expect(rx.upperBpm).toBe(119)
  })

  it('a minute-1 threshold is not rejected by the stage gate (no earlier stage to fall below)', () => {
    const r = detectThreshold({
      restingSymptomScore: 0,
      stages: [stage(1, 118, 3, 11)],
      termination: 'symptom-limited',
    })
    expect(r.interpretation).toBe('physiologic')
    expect(r.hrt).toBe(118)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. ABORTED / INCOMPLETE / NO-HR / ERRORED → NEVER A PASS
// ─────────────────────────────────────────────────────────────────────────────

/** Everything downstream treats these two as "the test produced something". */
const isClearanceGrade = (interpretation: string) => interpretation === 'no-intolerance'
const yieldsPrescription = (r: ReturnType<typeof detectThreshold>) =>
  r.hrtFound && r.hrt !== null && r.interpretation === 'physiologic'

describe('an aborted / incomplete test can never derive as a pass', () => {
  it('NO stages at all (nothing captured) → invalid, no HRt, no prescription', () => {
    const r = detectThreshold({ restingSymptomScore: 3, stages: [], termination: 'exhaustion-limited' })
    expect(r.interpretation).toBe('invalid')
    expect(r.hrt).toBeNull()
    expect(isClearanceGrade(r.interpretation)).toBe(false)
    expect(yieldsPrescription(r)).toBe(false)
  })

  it('a walk-out at minute 2 (no symptom rise, RPE nowhere near the limit) is INVALID, not "no intolerance"', () => {
    // This is the false-clearance shape: a short test with no >=3-point rise
    // used to return 'no-intolerance' → clearanceReady → the GP report's
    // "recovered exercise tolerance on objective testing".
    const r = detectThreshold({
      restingSymptomScore: 1,
      stages: [stage(1, 96, 1, 8), stage(2, 108, 1, 8)],
      termination: 'exhaustion-limited',
    })
    expect(r.interpretation).toBe('invalid')
    expect(isClearanceGrade(r.interpretation)).toBe(false)
    expect(r.hrt).toBeNull()
    expect(r.message).toMatch(/before either stopping point/i)
  })

  it('the SAME stages, but with the voluntary-exhaustion endpoint recorded, DO read as no-intolerance', () => {
    const r = detectThreshold({
      restingSymptomScore: 1,
      stages: [stage(1, 96, 1, 8), stage(2, 108, 1, 11), stage(3, 168, 1, EXHAUSTION_RPE)],
      termination: 'exhaustion-limited',
    })
    expect(r.interpretation).toBe('no-intolerance')
    expect(r.hrt).toBeNull() // still no HRt — nothing to prescribe from
    expect(yieldsPrescription(r)).toBe(false)
  })

  it('one point below the endpoint (RPE 16) is still not exhaustion', () => {
    const r = detectThreshold({
      restingSymptomScore: 0,
      stages: [stage(1, 120, 0, 13), stage(2, 150, 1, EXHAUSTION_RPE - 1)],
      termination: 'exhaustion-limited',
    })
    expect(r.interpretation).toBe('invalid')
  })

  it('a test mislabelled symptom-limited with no real rise never mints a threshold', () => {
    const r = detectThreshold({
      restingSymptomScore: 4,
      stages: [stage(1, 120, 5, 9), stage(2, 140, 6, 11)], // rise of 2, not 3
      termination: 'symptom-limited',
    })
    expect(r.hrtFound).toBe(false)
    expect(r.hrt).toBeNull()
    expect(isClearanceGrade(r.interpretation)).toBe(false)
  })

  it('a red flag ALWAYS wins — even over a fully provoking stage table', () => {
    const provoking: TestInput = {
      restingSymptomScore: 1,
      stages: [stage(1, 120, 1, 9), stage(2, 138, 6, 13)],
      termination: 'red-flag',
    }
    const r = detectThreshold(provoking)
    expect(r.interpretation).toBe('red-flag')
    expect(r.hrt).toBeNull()
    expect(r.thresholdStage).toBeNull()
    expect(yieldsPrescription(r)).toBe(false)
    expect(isClearanceGrade(r.interpretation)).toBe(false)
  })

  it('a red flag on an EMPTY test is still a red flag, never "not enough data"', () => {
    const r = detectThreshold({ restingSymptomScore: 0, stages: [], termination: 'red-flag' })
    expect(r.interpretation).toBe('red-flag')
  })

  it('an ABSENT Borg score is not evidence of exhaustion — the watch shape', () => {
    // sst-watch/Sources/GradedTest.swift logStage() writes rpe: nil on every
    // stage and only attaches the terminal Borg on its exhaustion-stop path.
    // A short, RPE-less stage set must therefore fail closed, or the shipping
    // watch mints clearance from a test nobody rated.
    const r = detectThreshold({
      restingSymptomScore: 0,
      stages: [stage(1, 120, 0), stage(2, 150, 1), stage(3, 175, 1)],
      termination: 'exhaustion-limited',
    })
    expect(r.interpretation).toBe('invalid')
  })

  it('completing the FULL protocol ramp symptom-free is the second valid endpoint', () => {
    // The watch's other end condition (stages.count >= maxStages) and the web's
    // (minute >= MAX_STAGES) both mean the patient finished the entire graded
    // ramp without provocation. That IS a negative test — no terminal Borg is
    // needed, and both surfaces cap at the same number by construction.
    expect(PROTOCOL_STAGE_CAP).toBe(20)
    const full = Array.from({ length: PROTOCOL_STAGE_CAP }, (_, i) => stage(i + 1, 100 + i * 3, 1))
    expect(detectThreshold({ restingSymptomScore: 1, stages: full, termination: 'exhaustion-limited' }).interpretation)
      .toBe('no-intolerance')
    // one stage short of the cap, still unrated → not a result
    expect(detectThreshold({ restingSymptomScore: 1, stages: full.slice(0, -1), termination: 'exhaustion-limited' }).interpretation)
      .toBe('invalid')
  })

  it('a full-length ramp that DID provoke symptoms is still physiologic, not a pass', () => {
    const full = Array.from({ length: PROTOCOL_STAGE_CAP }, (_, i) =>
      stage(i + 1, 100 + i * 3, i >= 9 ? 5 : 1),
    )
    const r = detectThreshold({ restingSymptomScore: 1, stages: full, termination: 'exhaustion-limited' })
    expect(r.interpretation).toBe('physiologic')
    expect(r.thresholdStage).toBe(10)
  })
})

describe('a session with no live HR signal can never earn an advance', () => {
  const rx = computePrescription(150)
  const clean = (over: Partial<SessionLog> = {}): SessionLog => ({
    date: 'd',
    avgHeartRate: 128,
    peakHeartRate: 134,
    preSymptom: 2,
    peakSymptom: 2,
    completedMinutes: 20,
    hrVerified: true,
    verifiedReadingPct: 100,
    ...over,
  })

  it('a session that recorded ZERO readings is never verified, on any source', () => {
    for (const src of ['bluetooth', 'camera', 'manual'] as const) {
      expect(sessionVerification([], src).hrVerified).toBe(false)
      expect(sessionVerification([], src).verifiedReadingPct).toBe(0)
    }
  })

  it('a dropped feed cannot verify a reading, even when the number is right', () => {
    expect(isVerifiedReading(140, 140, false)).toBe(false) // stale feed
    expect(isVerifiedReading(140, null, true)).toBe(false) // feed gone
  })

  it('three clean but UNVERIFIED (no-signal) sessions hold, never advance', () => {
    const noSignal = clean({ hrVerified: false, verifiedReadingPct: 0, avgHeartRate: 0, peakHeartRate: 0 })
    expect(progressionDecision(rx, [noSignal, noSignal, noSignal]).decision).toBe('hold')
  })

  it('three clean but SHORT (cut-off) verified sessions hold, never advance', () => {
    const short = clean({ completedMinutes: 4 }) // < 80% of the 20-min dose
    expect(progressionDecision(rx, [short, short, short]).decision).toBe('hold')
  })

  it('an advance still requires three clean verified full sessions', () => {
    expect(progressionDecision(rx, [clean(), clean(), clean()]).decision).toBe('advance')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. WEB ↔ WATCH CONSTANT PARITY — enforced, not just commented.
//    protocol.ts and sst-watch/Sources/SSTProtocol.swift are two independent
//    literals (there is no codegen and no shared artefact between a TS bundle
//    and a Swift target), so the only thing that can stop them drifting is a
//    test that reads the Swift source. Same for the watch's Borg PICKER seed:
//    it was shipped pre-seeded at 17, which made the default answer the one
//    that unlocks a clearance-grade result.
// ─────────────────────────────────────────────────────────────────────────────

describe('the watch mirrors the web protocol constants', () => {
  const read = (rel: string) =>
    readFileSync(join(process.cwd(), 'sst-watch', 'Sources', rel), 'utf8')

  it('SSTProtocol.swift declares the SAME stage cap and exhaustion RPE as protocol.ts', () => {
    const swift = read('SSTProtocol.swift')
    const cap = swift.match(/static let protocolStageCap\s*=\s*(\d+)/)
    const rpe = swift.match(/static let exhaustionRPE\s*=\s*(\d+)/)
    const rise = swift.match(/static let provocationRise\s*=\s*(\d+)/)
    const borg = swift.match(/static let borgMax\s*=\s*(\d+)/)
    expect(cap).not.toBeNull()
    expect(rpe).not.toBeNull()
    expect(rise).not.toBeNull()
    expect(borg).not.toBeNull()
    expect(Number(cap![1])).toBe(PROTOCOL_STAGE_CAP)
    expect(Number(rpe![1])).toBe(EXHAUSTION_RPE)
    expect(Number(rise![1])).toBe(PROVOCATION_RISE)
    expect(Number(borg![1])).toBe(BORG_MAX)
  })

  it('the watch stop rule uses the SAME comparator as the web, not just the same number', () => {
    // 2026-08-12: the web moved to "stop when the rise EXCEEDS 2" (Amsterdam
    // 2023) and the watch silently kept ">= 2" — this suite passed because it
    // compared the CONSTANTS. Same number, different comparator, different
    // clinical behaviour. Assert the comparator itself.
    const proto = read('SSTProtocol.swift')
    const training = read('TrainingSession.swift')
    expect(proto).toMatch(/\(peakSymptom - preSymptom\)\s*>\s*SSTProtocol\.sessionStopRise/)
    expect(proto).not.toMatch(/\(peakSymptom - preSymptom\)\s*>=\s*SSTProtocol\.sessionStopRise/)
    expect(training).toMatch(/\(v - preSymptom\)\s*>\s*SSTProtocol\.sessionStopRise/)
    expect(training).not.toMatch(/\(v - preSymptom\)\s*>=\s*SSTProtocol\.sessionStopRise/)
    // endFeel "worse" must map to a peak that IS a flare under the > rule.
    expect(training).toMatch(/preSymptom \+ SSTProtocol\.sessionStopRise \+ 1/)
  })

  it('the watch Borg picker is NOT pre-seeded at the exhaustion endpoint', () => {
    const swift = read('GradedTest.swift')
    const seed = swift.match(/@State private var exhaustionRPE\s*=\s*(\d+)/)
    expect(seed).not.toBeNull()
    // A default answer must never BE the answer that unlocks clearance.
    expect(Number(seed![1])).toBeLessThan(EXHAUSTION_RPE)
  })

  it('the watch ends its ramp on the shared constant, never a local literal', () => {
    const swift = read('GradedTest.swift')
    expect(swift).toMatch(/let maxStages = SSTProtocol\.protocolStageCap/)
    expect(swift).toMatch(/stages\.count >= maxStages/)
  })
})
