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

  it('regresses on repeated flares from fully UNVERIFIED (manual) sessions', () => {
    const flare = session({ hrVerified: false, verifiedReadingPct: 0, peakSymptom: 5, nextDayFlare: true })
    const r = progressionDecision(rx, [flare, flare])
    expect(r.decision).toBe('regress')
    expect(r.newCeilingBpm).toBe(rx.upperBpm - 5)
  })

  it('next-day flares (check-in "worse") regress even when in-session symptoms were clean', () => {
    const nextDayFlare = session({ hrVerified: false, nextDayFlare: true })
    const r = progressionDecision(rx, [nextDayFlare, nextDayFlare])
    expect(r.decision).toBe('regress')
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

  it('blocks a second test on the same calendar day — no exceptions', () => {
    const thisMorning = new Date(2026, 6, 15, 7, 0, 0).getTime()
    expect(canRetest(now, thisMorning).allowed).toBe(false)
    expect(canRetest(now, thisMorning, { afterRegress: true }).allowed).toBe(false)
    expect(canRetest(now, thisMorning, { clinicianDirected: true }).allowed).toBe(false)
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
