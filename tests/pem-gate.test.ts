import { describe, it, expect } from 'vitest'
import {
  pemGate, scorePemScreen, requiresPemScreen, PEM_ITEMS, PEM_RISK_CONDITIONS,
  type PemScreen,
} from '../lib/sst-trainer/pem'
import { CONDITIONS } from '../lib/sst-trainer/protocol'

/**
 * The PEM gate is a clinical safety interlock, so these tests assert the
 * DANGEROUS directions, not just the happy path:
 *
 *   - a missing screen must BLOCK, never pass
 *   - a positive screen must BLOCK, not warn
 *   - concussion must NOT be gated, or clinicians learn to click through
 *
 * Context: `long-covid` has been an accepted Condition in protocol.ts since
 * before this gate existed, so the product could compute a heart-rate training
 * band for a long-COVID patient with no PEM question asked anywhere.
 */

const item = (frequency: number, severity: number) => ({ frequency, severity })
const screenOf = (...pairs: Array<[number, number]>): PemScreen => ({
  items: pairs.map(([f, s]) => item(f, s)),
  screenedAt: '2026-08-07',
})
const allZero = screenOf([0, 0], [0, 0], [0, 0], [0, 0], [0, 0])

describe('which conditions are gated', () => {
  it('gates long-covid', () => {
    expect(requiresPemScreen('long-covid')).toBe(true)
  })

  it('does NOT gate concussion or mtbi', () => {
    // Screening every mTBI patient for ME/CFS would be clinically wrong AND
    // would train clinicians to dismiss the gate — which is how interlocks die.
    expect(requiresPemScreen('concussion')).toBe(false)
    expect(requiresPemScreen('mtbi')).toBe(false)
  })

  it('every gated condition is a real Condition', () => {
    // A typo here would silently gate nothing.
    for (const c of PEM_RISK_CONDITIONS) {
      expect(CONDITIONS as readonly string[]).toContain(c)
    }
    expect(PEM_RISK_CONDITIONS.length).toBeGreaterThan(0)
  })
})

describe('the gate blocks when it should', () => {
  it('BLOCKS a PEM-risk condition with no screen at all', () => {
    const r = pemGate('long-covid', null)
    expect(r.allowed).toBe(false)
    expect(r.verdict.status).toBe('not-screened')
    expect(r.guidance).toMatch(/before prescribing/i)
  })

  it('BLOCKS a positive screen outright — it does not soften the dose', () => {
    // One item at frequency 3 / severity 3 is enough. This is a safety gate,
    // deliberately more cautious than a research case definition.
    const r = pemGate('long-covid', screenOf([3, 3], [0, 0], [0, 0], [0, 0], [0, 0]))
    expect(r.allowed).toBe(false)
    expect(r.verdict.status).toBe('positive')
    expect(r.guidance).toMatch(/energy envelope|pacing/i)
    expect(r.guidance).toMatch(/NG206/)
  })

  it('BLOCKS an incomplete or out-of-range screen rather than guessing', () => {
    expect(pemGate('long-covid', screenOf([1, 1], [1, 1])).allowed).toBe(false)
    expect(pemGate('long-covid', { items: [item(9, 0), item(0, 0), item(0, 0), item(0, 0), item(0, 0)], screenedAt: 'x' }).verdict.status)
      .toBe('invalid')
  })

  it('ALLOWS a PEM-risk condition once the screen is clear', () => {
    const r = pemGate('long-covid', allZero)
    expect(r.allowed).toBe(true)
    expect(r.verdict.status).toBe('clear')
  })

  it('never gates concussion, screen or no screen', () => {
    expect(pemGate('concussion', null).allowed).toBe(true)
    expect(pemGate('concussion', screenOf([4, 4], [4, 4], [4, 4], [4, 4], [4, 4])).allowed).toBe(true)
  })
})

describe('DSQ-PEM scoring follows the instrument', () => {
  it('needs BOTH frequency and severity at 2+ for an item to count', () => {
    // Frequent but trivial, or severe but rare, is not a positive item.
    expect(scorePemScreen(screenOf([4, 1], [0, 0], [0, 0], [0, 0], [0, 0])).status).toBe('clear')
    expect(scorePemScreen(screenOf([1, 4], [0, 0], [0, 0], [0, 0], [0, 0])).status).toBe('clear')
    expect(scorePemScreen(screenOf([2, 2], [0, 0], [0, 0], [0, 0], [0, 0])).status).toBe('positive')
  })

  it('counts every positive item', () => {
    const r = scorePemScreen(screenOf([2, 2], [3, 3], [4, 4], [0, 0], [1, 1]))
    expect(r.status).toBe('positive')
    if (r.status === 'positive') expect(r.positiveItems).toBe(3)
  })

  it('has five items, matching the subscale', () => {
    expect(PEM_ITEMS).toHaveLength(5)
    expect(allZero.items).toHaveLength(PEM_ITEMS.length)
  })
})
