/**
 * Tests for the B2B pipeline-stage classification (lib/prospect/stage.ts)
 * that drives the admin analytics matrix.
 *
 * Invariants under test:
 *  - First match wins: replied → engaged → dead → T3 → T2 → T1 →
 *    ready → awaiting-approval → blocked.
 *  - Status-based terminals (replied / engaged / won / lost / bounced /
 *    engaged-elsewhere) outrank send-depth — a lost clinic with a T1 send
 *    is NOT "awaiting T2".
 *  - Deepest production send wins among T1/T2/T3.
 *  - blocked is the exhaustive catch-all: every non-archived prospect lands
 *    in exactly one stage, so the matrix always reconciles with the pool.
 */
import { describe, it, expect } from 'vitest'
import {
  classifyStage,
  isHunterClean,
  buildStageMatrix,
  PIPELINE_STAGES,
  type StageInput,
  type MatrixRowInput,
} from '@/lib/prospect/stage'

function input(overrides: Partial<StageInput> = {}): StageInput {
  return {
    status: 'researching',
    hasInitialSend: false,
    hasFollowupSend: false,
    hasFinalSend: false,
    hunterClean: true,
    ...overrides,
  }
}

describe('classifyStage — status terminals beat send depth', () => {
  it('replied beats everything, even a completed T3 sequence', () => {
    expect(classifyStage(input({
      status: 'replied',
      hasInitialSend: true, hasFollowupSend: true, hasFinalSend: true,
    }))).toBe('replied')
  })

  it('engaged (personal lane) beats send stages', () => {
    expect(classifyStage(input({
      status: 'engaged',
      hasInitialSend: true, hasFollowupSend: true,
    }))).toBe('engaged')
  })

  it('won/lost/bounced/engaged-elsewhere → dead even mid-sequence', () => {
    for (const status of ['won', 'lost', 'bounced', 'engaged-elsewhere']) {
      expect(classifyStage(input({ status, hasInitialSend: true }))).toBe('dead')
      expect(classifyStage(input({ status, hasFinalSend: true }))).toBe('dead')
      expect(classifyStage(input({ status }))).toBe('dead')
    }
  })

  it('replied is keyed on status alone — a replied clinic with zero sends still classifies replied', () => {
    expect(classifyStage(input({ status: 'replied' }))).toBe('replied')
  })
})

describe('classifyStage — send depth: T3 beats T2 beats T1', () => {
  it('final send present → t3-sent regardless of earlier sends', () => {
    expect(classifyStage(input({
      status: 'sent',
      hasInitialSend: true, hasFollowupSend: true, hasFinalSend: true,
    }))).toBe('t3-sent')
    expect(classifyStage(input({ status: 'opened', hasFinalSend: true }))).toBe('t3-sent')
  })

  it('followup (no final) → t2-sent', () => {
    expect(classifyStage(input({
      status: 'sent', hasInitialSend: true, hasFollowupSend: true,
    }))).toBe('t2-sent')
  })

  it('initial only → t1-sent', () => {
    expect(classifyStage(input({ status: 'sent', hasInitialSend: true }))).toBe('t1-sent')
  })

  it('sends beat ready/awaiting even for clean approved/researching rows', () => {
    expect(classifyStage(input({ status: 'approved', hasInitialSend: true }))).toBe('t1-sent')
    expect(classifyStage(input({ status: 'researching', hasFollowupSend: true }))).toBe('t2-sent')
  })
})

describe('classifyStage — unsent rows: ready / awaiting-approval / blocked', () => {
  it('Hunter-clean + approved + no sends → ready', () => {
    expect(classifyStage(input({ status: 'approved' }))).toBe('ready')
  })

  it('Hunter-clean + researching + no sends → awaiting-approval', () => {
    expect(classifyStage(input({ status: 'researching' }))).toBe('awaiting-approval')
  })

  it('NOT Hunter-clean + no sends → blocked, whatever the workflow status', () => {
    expect(classifyStage(input({ status: 'researching', hunterClean: false }))).toBe('blocked')
    expect(classifyStage(input({ status: 'approved', hunterClean: false }))).toBe('blocked')
  })

  it('catch-all: data-inconsistent status with no production sends → blocked (exhaustiveness)', () => {
    // e.g. status='sent' but every send was a :test: preview
    expect(classifyStage(input({ status: 'sent' }))).toBe('blocked')
    expect(classifyStage(input({ status: 'opened', hunterClean: false }))).toBe('blocked')
  })
})

describe('isHunterClean — the HARD GATE, TS-side', () => {
  const clean = { score: 80, role: false, acceptAll: false, disposable: false }

  it('score 80, no flags → clean (boundary)', () => {
    expect(isHunterClean(clean)).toBe(true)
  })

  it('score 79 → blocked (boundary)', () => {
    expect(isHunterClean({ ...clean, score: 79 })).toBe(false)
  })

  it('never verified (score null) → blocked — the gate requires a positive verification', () => {
    expect(isHunterClean({ ...clean, score: null })).toBe(false)
  })

  it('role / accept-all / disposable each block even at score 100', () => {
    expect(isHunterClean({ ...clean, score: 100, role: true })).toBe(false)
    expect(isHunterClean({ ...clean, score: 100, acceptAll: true })).toBe(false)
    expect(isHunterClean({ ...clean, score: 100, disposable: true })).toBe(false)
  })
})

describe('buildStageMatrix — exhaustive, reconciling, value-summing', () => {
  const rows: MatrixRowInput[] = [
    { stage: 'replied', dealType: 'on-site', dealValue: 9500, status: 'replied' },
    { stage: 't1-sent', dealType: 'on-site', dealValue: 9500, status: 'sent' },
    { stage: 't1-sent', dealType: 'hub-pack', dealValue: 1497, status: 'sent' },
    { stage: 'awaiting-approval', dealType: 'hub-pack', dealValue: 1497, status: 'researching' },
    { stage: 'awaiting-approval', dealType: 'individual', dealValue: 397, status: 'researching' },
    { stage: 'blocked', dealType: 'individual', dealValue: 397, status: 'researching' },
    { stage: 'dead', dealType: 'on-site', dealValue: 9500, status: 'won' },
    { stage: 'dead', dealType: 'hub-pack', dealValue: 1497, status: 'lost' },
  ]

  it('poolSize equals the sum of every cell (no double counting, nothing dropped)', () => {
    const m = buildStageMatrix(rows, 3)
    const cellSum = m.stages.reduce((acc, s) => acc + m.total[s].count, 0)
    expect(m.poolSize).toBe(rows.length)
    expect(cellSum).toBe(rows.length)
    expect(m.archived).toBe(3)
  })

  it('tier rows sum to the TOTAL row per stage', () => {
    const m = buildStageMatrix(rows)
    for (const s of m.stages) {
      const tierSum = m.tiers.reduce((acc, t) => acc + m.cells[t][s].count, 0)
      expect(tierSum).toBe(m.total[s].count)
    }
  })

  it('sums dealValue per cell', () => {
    const m = buildStageMatrix(rows)
    expect(m.cells['on-site']['t1-sent'].dealValue).toBe(9500)
    expect(m.cells['hub-pack']['awaiting-approval'].dealValue).toBe(1497)
    expect(m.total['t1-sent'].dealValue).toBe(9500 + 1497)
    expect(m.total['awaiting-approval'].dealValue).toBe(1497 + 397)
  })

  it('splits won out of the dead column as a subcount', () => {
    const m = buildStageMatrix(rows)
    expect(m.total['dead'].count).toBe(2)
    expect(m.total['dead'].won).toBe(1)
    expect(m.cells['on-site']['dead'].won).toBe(1)
    expect(m.cells['hub-pack']['dead'].won).toBe(0)
  })

  it('empty pool → all-zero matrix that still carries every stage column', () => {
    const m = buildStageMatrix([])
    expect(m.poolSize).toBe(0)
    expect(m.stages).toEqual(PIPELINE_STAGES)
    for (const s of m.stages) expect(m.total[s]).toEqual({ count: 0, dealValue: 0, won: 0 })
  })
})
