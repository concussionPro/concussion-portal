/**
 * SST Trainer — protocol-integrity tests (the published claims must be true).
 *
 * Covers: band math, ceiling cap at the measured HRt, regress-is-never-gated,
 * manual sessions never advancing the band, verified-reading derivation, and
 * re-test spacing.
 */
import { describe, it, expect } from 'vitest'
import {
  canRetest,
  computePrescription,
  isVerifiedReading,
  progressionDecision,
  sessionVerification,
  MAX_RESTING_TO_TEST,
  RETEST_MIN_HOURS,
  VERIFIED_READING_MIN_PCT,
  type SessionLog,
} from '@/lib/sst-trainer/protocol'

const session = (over: Partial<SessionLog> = {}): SessionLog => ({
  date: 'd',
  avgHeartRate: 128,
  peakHeartRate: 134,
  preSymptom: 2,
  peakSymptom: 2,
  nextDayFlare: false,
  completedMinutes: 20,
  hrVerified: true,
  verifiedReadingPct: 100,
  ...over,
})

describe('band math — computePrescription', () => {
  it('concussion: 80–90% of HRt, 20 min, 6 d/wk', () => {
    const rx = computePrescription(160, 'concussion')
    expect(rx.lowerBpm).toBe(128)
    expect(rx.upperBpm).toBe(144)
    expect(rx.sessionMinutes).toBe(20)
    expect(rx.daysPerWeek).toBe(6)
    expect(rx.hrt).toBe(160)
  })

  it('the prescribed ceiling is always below the measured HRt', () => {
    for (const hrt of [120, 145, 150, 173, 190]) {
      const rx = computePrescription(hrt, 'concussion')
      expect(rx.upperBpm).toBeLessThan(hrt)
      expect(rx.lowerBpm).toBeLessThan(rx.upperBpm)
    }
  })
})

describe('ceiling cap — a suggested advance never exceeds the measured HRt', () => {
  const clean3 = [session(), session(), session()]

  it('a normal advance steps the ceiling +5', () => {
    const rx = computePrescription(150, 'concussion') // upper 135
    const r = progressionDecision(rx, clean3)
    expect(r.decision).toBe('advance')
    expect(r.newCeilingBpm).toBe(140)
  })

  it('an advance near the HRt is clamped TO the HRt (partial step)', () => {
    const rx = { ...computePrescription(150, 'concussion'), upperBpm: 148 }
    const r = progressionDecision(rx, clean3)
    expect(r.decision).toBe('advance')
    expect(r.newCeilingBpm).toBe(150) // min(148 + 5, hrt 150)
  })

  it('at the cap the decision is RETEST, never an advance past the measurement', () => {
    const rx = { ...computePrescription(150, 'concussion'), upperBpm: 150 }
    const r = progressionDecision(rx, clean3)
    expect(r.decision).toBe('retest')
    expect(r.newCeilingBpm).toBeUndefined()
  })
})

describe('regress is NEVER gated — safety data always counts', () => {
  const rx = computePrescription(150, 'concussion')

  it('eases the ceiling on repeated flares from fully UNVERIFIED (manual) sessions (safety counts)', () => {
    // Two consecutive flares now trigger the REST rail (rest day + eased
    // ceiling); the point that unverified data still drives a down-adjustment
    // holds — the ceiling drops regardless of verification.
    const flare = session({ hrVerified: false, verifiedReadingPct: 0, peakSymptom: 5, nextDayFlare: true })
    const r = progressionDecision(rx, [flare, flare])
    expect(r.decision).toBe('rest')
    expect(r.newCeilingBpm).toBe(rx.upperBpm - 5)
  })

  it('next-day flares (check-in "worse") ease the ceiling even when in-session symptoms were clean', () => {
    const nextDayFlare = session({ hrVerified: false, nextDayFlare: true })
    const r = progressionDecision(rx, [nextDayFlare, nextDayFlare])
    expect(r.decision).toBe('rest')
  })

  it('non-consecutive unverified flares still REGRESS (safety data counts, not gated)', () => {
    const flare = session({ hrVerified: false, verifiedReadingPct: 0, peakSymptom: 5, nextDayFlare: true })
    const clean = session({ hrVerified: false, verifiedReadingPct: 0 })
    const r = progressionDecision(rx, [flare, clean, flare])
    expect(r.decision).toBe('regress')
    expect(r.newCeilingBpm).toBe(rx.upperBpm - 5)
  })

  it('a single recent flare blocks an advance (hold), even with verified clean history', () => {
    const flare = session({ hrVerified: false, peakSymptom: 5 })
    const r = progressionDecision(rx, [session(), session(), flare])
    expect(r.decision).toBe('hold')
  })
})

describe('manual sessions never advance the band', () => {
  const rx = computePrescription(150, 'concussion')

  it('3 clean MANUAL sessions do not advance', () => {
    const manual = session({ hrVerified: false, verifiedReadingPct: 0 })
    const r = progressionDecision(rx, [manual, manual, manual])
    expect(r.decision).toBe('hold')
  })

  it('mixed history: only the verified clean sessions count toward the run', () => {
    const manual = session({ hrVerified: false })
    // two verified + one manual = only 2 verified → hold
    const r = progressionDecision(rx, [session(), manual, session()])
    expect(r.decision).toBe('hold')
    // three verified with a manual interleaved (all clean) → advance
    const r2 = progressionDecision(rx, [session(), manual, session(), session()])
    expect(r2.decision).toBe('advance')
  })

  it('3 clean VERIFIED sessions do advance', () => {
    const r = progressionDecision(rx, [session(), session(), session()])
    expect(r.decision).toBe('advance')
  })
})

describe('verified-reading derivation', () => {
  it('a reading is verified iff the feed is fresh AND the value equals the feed', () => {
    expect(isVerifiedReading(142, 142, true)).toBe(true)
    expect(isVerifiedReading(142, 142, false)).toBe(false) // stale feed
    expect(isVerifiedReading(142, 145, true)).toBe(false) // typed over the live value
    expect(isVerifiedReading(142, null, true)).toBe(false) // no feed value
    expect(isVerifiedReading(null, 142, true)).toBe(false) // nothing logged
  })

  it(`session hrVerified needs >=${VERIFIED_READING_MIN_PCT}% verified readings AND a bluetooth source`, () => {
    const v = { verified: true }
    const u = { verified: false }
    // 80% verified on bluetooth → verified
    expect(sessionVerification([v, v, v, v, u], 'bluetooth')).toEqual({
      hrVerified: true,
      verifiedReadingPct: 80,
    })
    // 75% verified on bluetooth → NOT verified
    expect(sessionVerification([v, v, v, u], 'bluetooth').hrVerified).toBe(false)
    // 100% "verified" readings can never verify a manual or camera session
    expect(sessionVerification([v, v, v], 'manual').hrVerified).toBe(false)
    expect(sessionVerification([v, v, v], 'camera').hrVerified).toBe(false)
    // no readings at all → never verified
    expect(sessionVerification([], 'bluetooth').hrVerified).toBe(false)
  })
})

describe('re-test spacing', () => {
  const H = 3_600_000
  // anchor mid-day so hour arithmetic can't cross a date boundary accidentally
  const now = new Date(2026, 6, 15, 12, 0, 0).getTime()

  it('first ever test is always allowed', () => {
    expect(canRetest(now, null).allowed).toBe(true)
  })

  // The patient-initiated path is still one test per calendar day, and a
  // regress does NOT buy a second one. `clinicianDirected` is the single
  // documented exemption (canRetest in lib/sst-trainer/protocol.ts) and may
  // only be set from an explicit recorded clinician action — today, a
  // post-red-flag clearance where a fresh threshold is the point of the review.
  it('blocks a second patient-initiated test on the same calendar day', () => {
    const thisMorning = new Date(2026, 6, 15, 7, 0, 0).getTime()
    expect(canRetest(now, thisMorning).allowed).toBe(false)
    expect(canRetest(now, thisMorning, { afterRegress: true }).allowed).toBe(false)
  })

  it('only a clinician-directed test may re-test same-day — and never through a red-flag lock', () => {
    const thisMorning = new Date(2026, 6, 15, 7, 0, 0).getTime()
    expect(canRetest(now, thisMorning, { clinicianDirected: true }).allowed).toBe(true)
    expect(
      canRetest(now, thisMorning, { clinicianDirected: true, redFlagLocked: true }).allowed,
    ).toBe(false)
  })

  it(`blocks within ${RETEST_MIN_HOURS}h of the last test`, () => {
    expect(canRetest(now, now - 24 * H).allowed).toBe(false)
    expect(canRetest(now, now - 47 * H).allowed).toBe(false)
  })

  it('allows after 48h', () => {
    expect(canRetest(now, now - 49 * H).allowed).toBe(true)
  })

  it('a regress unlocks an earlier re-test (but never same-day)', () => {
    expect(canRetest(now, now - 24 * H, { afterRegress: true }).allowed).toBe(true)
    expect(canRetest(now, now - 24 * H, { clinicianDirected: true }).allowed).toBe(true)
  })

  it('a red-flag lock blocks re-testing regardless of spacing', () => {
    const gate = canRetest(now, now - 100 * H, { redFlagLocked: true })
    expect(gate.allowed).toBe(false)
    expect(gate.reason).toMatch(/clinician/i)
  })

  it('sanity: the readiness block threshold is 8/10', () => {
    expect(MAX_RESTING_TO_TEST).toBe(8)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Severity prognostic flag (Haider 2019) — prognosis, NOT a dose change.
// ─────────────────────────────────────────────────────────────────────────────
describe('computePrescription — prolonged-recovery prognostic flag', () => {
  it('HRt < 135 bpm flags prolonged-recovery risk with a clinician note', () => {
    const rx = computePrescription(120, 'concussion')
    expect(rx.prolongedRecoveryRisk).toBe(true)
    expect(rx.clinicianNote).not.toBeNull()
  })
  it('HRt >= 135 bpm (no resting HR) does not flag', () => {
    const rx = computePrescription(160, 'concussion')
    expect(rx.prolongedRecoveryRisk).toBe(false)
    expect(rx.clinicianNote).toBeNull()
  })
  it('ΔHR <= 50 bpm flags even when HRt >= 135', () => {
    const rx = computePrescription(160, 'concussion', { restingHr: 115 }) // ΔHR 45
    expect(rx.prolongedRecoveryRisk).toBe(true)
  })
  it('ΔHR > 50 and HRt >= 135 does not flag', () => {
    const rx = computePrescription(160, 'concussion', { restingHr: 100 }) // ΔHR 60
    expect(rx.prolongedRecoveryRisk).toBe(false)
  })
  it('dose stays evidence-fixed regardless of the flag (no guessed titration)', () => {
    expect(computePrescription(120).sessionMinutes).toBe(20)
    expect(computePrescription(160).sessionMinutes).toBe(20)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Rest trigger — TWO consecutive flares → rest day + eased ceiling; a single or
// non-consecutive flare must NOT rest (reduce/continue is the evidence position).
// ─────────────────────────────────────────────────────────────────────────────
describe('progressionDecision — rest on two consecutive flares', () => {
  const rx = computePrescription(160) // lower 128, upper 144
  const flare = () => session({ preSymptom: 2, peakSymptom: 5 }) // rise 3 >= stop
  const clean = () => session({ preSymptom: 2, peakSymptom: 2 })

  it('two flares in a row → rest, ceiling eased back', () => {
    const d = progressionDecision(rx, [flare(), flare()])
    expect(d.decision).toBe('rest')
    expect(d.newCeilingBpm).toBe(139) // 144 - 5
  })
  it('a single recent flare → hold, never rest', () => {
    const d = progressionDecision(rx, [clean(), flare()])
    expect(d.decision).toBe('hold')
  })
  it('non-consecutive flares → regress, not rest', () => {
    const d = progressionDecision(rx, [flare(), clean(), flare()])
    expect(d.decision).toBe('regress')
  })
})

describe('regression can never walk the band into nonsense', () => {
  // The regress branch had NO lower bound. applyCeiling shifts both bounds by
  // the same delta, so repeated regressions dragged the whole band toward (and
  // past) zero. The rest rail doesn't catch it: rest needs two CONSECUTIVE
  // flares, regress needs two in the last three — so flare/clean/flare
  // regresses forever without ever resting.
  const flare = (n: number) => ({
    date: `d${n}`, avgHeartRate: 120, peakHeartRate: 130,
    preSymptom: 1, peakSymptom: 5, completedMinutes: 20, hrVerified: true,
  })

  it('floors the ceiling at half the measured HRt, however many flares arrive', () => {
    let rx = computePrescription(150)
    const floor = Math.round(150 / 2)
    for (let i = 0; i < 40; i++) {
      const d = progressionDecision(rx, [flare(i), { ...flare(i), peakSymptom: 1 }, flare(i + 1)])
      if (d.decision !== 'regress' && d.decision !== 'rest') break
      const next = d.newCeilingBpm!
      expect(next, 'ceiling fell below the floor').toBeGreaterThanOrEqual(
        Math.min(floor, rx.upperBpm),
      )
      const delta = next - rx.upperBpm
      rx = { ...rx, upperBpm: next, lowerBpm: rx.lowerBpm + delta }
    }
    expect(rx.upperBpm).toBeGreaterThanOrEqual(floor)
    expect(rx.lowerBpm, 'lower bound went non-physiological').toBeGreaterThan(0)
  })

  it('matches the watch app floor (hrt / 2) so both surfaces agree', () => {
    const rx = { ...computePrescription(200), upperBpm: 102 } // one step above the floor
    const d = progressionDecision(rx, [flare(1), { ...flare(2), peakSymptom: 1 }, flare(3)])
    expect(d.decision).toBe('regress')
    expect(d.newCeilingBpm).toBe(100) // hrt/2, not 97
  })
})
