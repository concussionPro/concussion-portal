import { describe, it, expect } from 'vitest'
import {
  redFlagCheck,
  earliestContactDate,
  canAdvanceGrts,
  applySymptomLog,
  pathwayState,
  STAND_DOWN_DAYS,
  SYMPTOM_FREE_DAYS,
  HOURS_PER_STAGE,
  type Episode,
  type SymptomLog,
  type GrtsStage,
} from '@/lib/rtp/protocol'

// ── Fixtures ────────────────────────────────────────────────────────────────

const log = (loggedAt: string, pcssTotal: number, redFlag = false): SymptomLog => ({
  loggedAt,
  pcssTotal,
  redFlag,
})

/** A baseline non-contact episode at the requested stage, clock satisfied. */
const ep = (over: Partial<Episode> = {}): Episode => ({
  injuryDate: '2026-06-01T00:00:00.000Z',
  grtsStage: 0,
  rtlStage: 4,
  stageEnteredAt: '2026-06-01T00:00:00.000Z',
  ...over,
})

// ── redFlagCheck ────────────────────────────────────────────────────────────

describe('redFlagCheck', () => {
  it('flags a red-flag log and clears a normal one', () => {
    expect(redFlagCheck(log('2026-06-02T00:00:00Z', 10, true))).toBe(true)
    expect(redFlagCheck(log('2026-06-02T00:00:00Z', 10, false))).toBe(false)
  })
})

// ── earliestContactDate — the later-of-two-clocks rule ──────────────────────

describe('earliestContactDate — later of (injury+21d) and (symptomFree+14d)', () => {
  it('stand-down clock dominates (early symptom-free)', () => {
    // injury 06-01 + 21 = 06-22 ; symptom-free 06-02 + 14 = 06-16 ; later = 06-22
    const d = earliestContactDate('2026-06-01T00:00:00Z', '2026-06-02T00:00:00Z')
    expect(d!.slice(0, 10)).toBe('2026-06-22')
  })

  it('symptom-free clock dominates (late symptom-free)', () => {
    // injury 06-01 + 21 = 06-22 ; symptom-free 06-20 + 14 = 07-04 ; later = 07-04
    const d = earliestContactDate('2026-06-01T00:00:00Z', '2026-06-20T00:00:00Z')
    expect(d!.slice(0, 10)).toBe('2026-07-04')
  })

  it('is null while not yet symptom-free (clock not started)', () => {
    expect(earliestContactDate('2026-06-01T00:00:00Z')).toBeNull()
  })

  it('uses the documented constants', () => {
    expect(STAND_DOWN_DAYS).toBe(21)
    expect(SYMPTOM_FREE_DAYS).toBe(14)
  })
})

// ── canAdvanceGrts — the >=24h-in-stage rule ────────────────────────────────

describe('canAdvanceGrts — 24h-in-stage gating', () => {
  it('blocks when less than 24h at the stage', () => {
    const e = ep({ grtsStage: 1, stageEnteredAt: '2026-06-05T00:00:00Z' })
    const r = canAdvanceGrts(e, [], '2026-06-05T01:00:00Z') // 1h in
    expect(r.eligible).toBe(false)
    expect(r.blockedBy).toBe('time-in-stage')
    expect(HOURS_PER_STAGE).toBe(24)
  })

  it('is eligible after >=24h with no worsening', () => {
    const e = ep({ grtsStage: 1, stageEnteredAt: '2026-06-05T00:00:00Z' })
    const r = canAdvanceGrts(e, [], '2026-06-06T01:00:00Z') // 25h in
    expect(r.eligible).toBe(true)
    expect(r.blockedBy).toBeUndefined()
  })
})

// ── canAdvanceGrts — symptom worsening within the stage ─────────────────────

describe('canAdvanceGrts — symptom worsening blocks advancement', () => {
  it('blocks (blockedBy "symptoms") when an in-stage log rises above entry', () => {
    const e = ep({ grtsStage: 2, stageEnteredAt: '2026-06-05T00:00:00Z' })
    const logs = [
      log('2026-06-05T00:00:00Z', 4),
      log('2026-06-05T12:00:00Z', 9), // worse than entry
    ]
    const r = canAdvanceGrts(e, logs, '2026-06-06T06:00:00Z') // >24h but worsened
    expect(r.eligible).toBe(false)
    expect(r.blockedBy).toBe('symptoms')
  })
})

// ── applySymptomLog — the 24-hour rule (regression + clock reset) ────────────

describe('applySymptomLog — regression + 24h clock reset on worsening', () => {
  it('establishes the stage baseline on the first log', () => {
    const e = ep({ grtsStage: 3, stageEnteredAt: '2026-06-05T00:00:00Z' })
    const out = applySymptomLog(e, log('2026-06-05T00:00:00Z', 5))
    expect(out.stageBaselinePcss).toBe(5)
    expect(out.grtsStage).toBe(3)
    expect(out.stageEnteredAt).toBe('2026-06-05T00:00:00Z')
  })

  it('regresses one stage and resets the clock when symptoms worsen', () => {
    const e = ep({
      grtsStage: 3,
      stageEnteredAt: '2026-06-05T00:00:00Z',
      stageBaselinePcss: 4,
    })
    const out = applySymptomLog(e, log('2026-06-05T18:00:00Z', 9))
    expect(out.grtsStage).toBe(2) // dropped one stage
    expect(out.stageEnteredAt).toBe('2026-06-05T18:00:00Z') // clock reset
    expect(out.stageBaselinePcss).toBe(9) // new baseline = worsening value
  })

  it('does not drop below stage 0', () => {
    const e = ep({ grtsStage: 0, stageBaselinePcss: 2 })
    const out = applySymptomLog(e, log('2026-06-05T00:00:00Z', 8))
    expect(out.grtsStage).toBe(0)
  })

  it('holds the stage when stable or improving', () => {
    const e = ep({ grtsStage: 3, stageBaselinePcss: 6 })
    expect(applySymptomLog(e, log('x', 6)).grtsStage).toBe(3)
    expect(applySymptomLog(e, log('x', 2)).grtsStage).toBe(3)
  })

  it('a red-flag log does not mutate the stage (halt handled by state)', () => {
    const e = ep({ grtsStage: 3, stageBaselinePcss: 4 })
    const out = applySymptomLog(e, log('2026-06-05T00:00:00Z', 12, true))
    expect(out.grtsStage).toBe(3)
  })
})

// ── Red-flag halt ───────────────────────────────────────────────────────────

describe('red-flag halts the pathway', () => {
  it('canAdvanceGrts blocks on any red-flag log', () => {
    const e = ep({ grtsStage: 2, stageEnteredAt: '2026-06-01T00:00:00Z' })
    const r = canAdvanceGrts(e, [log('2026-06-03T00:00:00Z', 20, true)], '2026-06-10T00:00:00Z')
    expect(r.eligible).toBe(false)
    expect(r.blockedBy).toBe('red-flag')
  })

  it('pathwayState surfaces the red-flag signal and status', () => {
    const e = ep({ grtsStage: 2 })
    const s = pathwayState(e, [log('2026-06-03T00:00:00Z', 20, true)], '2026-06-10T00:00:00Z')
    expect(s.redFlag).toBe(true)
    expect(s.advance.blockedBy).toBe('red-flag')
    expect(s.status).toMatch(/urgent medical review/i)
  })
})

// ── The contact gate (stage 4 -> 5): every gate must clear ──────────────────

describe('contact gate (4 -> 5) — clocks AND rtl-complete AND clearance', () => {
  const base = (over: Partial<Episode> = {}): Episode =>
    ep({
      grtsStage: 4,
      stageEnteredAt: '2026-06-16T00:00:00Z', // >24h before either test's now
      symptomFreeDate: '2026-06-03T00:00:00Z', // symptom-free clock clears 06-17
      rtlStage: 4,
      clearedForContact: true,
      ...over,
    })
  // stand-down clears 06-22 (binding clock); symptom-free clears 06-17.
  const afterClocks = '2026-06-23T00:00:00Z'

  it('blocks when Return to Learn is not complete', () => {
    const r = canAdvanceGrts(base({ rtlStage: 3 }), [], afterClocks)
    expect(r.blockedBy).toBe('rtl-incomplete')
  })

  it('blocks on the 21-day stand-down (binding clock not yet met)', () => {
    // now 06-18: past symptom-free clear (06-17) but before stand-down (06-22)
    const r = canAdvanceGrts(base(), [], '2026-06-18T00:00:00Z')
    expect(r.eligible).toBe(false)
    expect(r.blockedBy).toBe('stand-down')
  })

  it('blocks on the symptom-free clock when not yet symptom-free', () => {
    const r = canAdvanceGrts(base({ symptomFreeDate: undefined }), [], afterClocks)
    expect(r.blockedBy).toBe('symptom-free')
  })

  it('blocks awaiting medical clearance once both clocks + RTL are met', () => {
    const r = canAdvanceGrts(base({ clearedForContact: false }), [], afterClocks)
    expect(r.eligible).toBe(false)
    expect(r.blockedBy).toBe('awaiting-clearance')
  })

  it('never auto-advances into contact without clearance (clearedForContact undefined)', () => {
    const r = canAdvanceGrts(base({ clearedForContact: undefined }), [], afterClocks)
    expect(r.blockedBy).toBe('awaiting-clearance')
  })

  it('advances to full contact only when ALL gates clear', () => {
    const r = canAdvanceGrts(base(), [], afterClocks)
    expect(r.eligible).toBe(true)
    expect(r.blockedBy).toBeUndefined()
  })
})

// ── pathwayState — projections + clean full progression ─────────────────────

describe('pathwayState — projections and a clean full progression', () => {
  it('projects earliest contact (later clock) and return-to-competition', () => {
    const e = ep({ grtsStage: 1, symptomFreeDate: '2026-06-03T00:00:00Z' })
    const s = pathwayState(e, [], '2026-06-05T00:00:00Z')
    expect(s.earliestContactDate!.slice(0, 10)).toBe('2026-06-22') // stand-down binds
    expect(s.projectedReturnToCompetition!.slice(0, 10)).toBe('2026-06-23') // +1 day
  })

  it('walks a clean episode from stage 0 to return to competition', () => {
    const injuryDate = '2026-06-01T00:00:00Z'
    const symptomFreeDate = '2026-06-03T00:00:00Z'
    // Drive the clock well past both stand-down (06-22) and symptom-free (06-17).
    let now = '2026-06-20T00:00:00Z'

    let episode: Episode = {
      injuryDate,
      symptomFreeDate,
      grtsStage: 0,
      rtlStage: 4,
      stageEnteredAt: injuryDate,
      stageBaselinePcss: 0,
      clearedForContact: false,
    }

    // Advance 0 -> 4 (non-contact stages): each needs >=24h, no worsening.
    for (let stage = 0 as GrtsStage; stage < 4; stage = (stage + 1) as GrtsStage) {
      const before = new Date(Date.parse(now) - 26 * 3_600_000).toISOString()
      episode = { ...episode, grtsStage: stage, stageEnteredAt: before }
      const check = canAdvanceGrts(episode, [], now)
      expect(check.eligible).toBe(true)
    }

    // At stage 4, push now past both clocks and record clearance, then advance.
    now = '2026-06-25T00:00:00Z'
    episode = {
      ...episode,
      grtsStage: 4,
      stageEnteredAt: '2026-06-23T00:00:00Z',
      clearedForContact: true,
    }
    const intoContact = canAdvanceGrts(episode, [], now)
    expect(intoContact.eligible).toBe(true)
    expect(intoContact.blockedBy).toBeUndefined()

    // Stage 5 (full contact): one clean 24h block, then return to competition.
    episode = { ...episode, grtsStage: 5, stageEnteredAt: '2026-06-25T00:00:00Z' }
    const intoCompetition = canAdvanceGrts(episode, [], '2026-06-26T06:00:00Z')
    expect(intoCompetition.eligible).toBe(true)

    // Stage 6: terminal — pathway complete, nothing further to advance.
    episode = { ...episode, grtsStage: 6 }
    const done = pathwayState(episode, [], '2026-06-27T00:00:00Z')
    expect(done.advance.eligible).toBe(false)
    expect(done.status).toMatch(/pathway is complete/i)
  })
})
