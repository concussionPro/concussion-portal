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

/**
 * FORWARD GUARD (2026-08-09). Every Condition must be an EXPLICIT decision:
 * either PEM-gated, or deliberately not.
 *
 * Protocol v2 names POTS in the interlock. POTS is not yet a Condition in this
 * product — but it is a named expansion target, and ME/CFS features co-occur in
 * a large share of POTS presentations, so adding it as a condition without
 * adding it to PEM_RISK_CONDITIONS would ship graded exertion, ungated, to the
 * population it is most contraindicated in.
 *
 * This test fails the moment a new Condition appears without a decision
 * recorded here. That is the point: it converts "someone must remember" into
 * "the build stops".
 */
describe('no condition ships without an explicit PEM decision', () => {
  /** Conditions deliberately NOT gated, with the reason. */
  const DELIBERATELY_UNGATED: Record<string, string> = {
    concussion: 'first-line treatment; gating would train click-through',
    mtbi: 'same as concussion',
    tbi: 'exertion is indicated; PEM is not the expected phenotype',
    cardiac: 'gated by cardiac contraindication screening, not by PEM',
  }

  it('every Condition is either PEM-gated or explicitly exempt', () => {
    const gated = new Set<string>(PEM_RISK_CONDITIONS as readonly string[])
    const undecided = (CONDITIONS as readonly string[]).filter(
      (c) => !gated.has(c) && !(c in DELIBERATELY_UNGATED),
    )
    expect(
      undecided,
      `Condition(s) with no PEM decision: ${undecided.join(', ')}. ` +
        'Add to PEM_RISK_CONDITIONS in lib/sst-trainer/pem.ts, or to ' +
        'DELIBERATELY_UNGATED here with the clinical reason. Protocol v2 ' +
        'requires POTS to be gated if it is ever added as a condition.',
    ).toEqual([])
  })

  it('POTS, if it is ever added, must be gated', () => {
    const isPots = (c: string) => /pots|orthostatic/i.test(c)
    const potsConditions = (CONDITIONS as readonly string[]).filter(isPots)
    for (const c of potsConditions) {
      expect(
        (PEM_RISK_CONDITIONS as readonly string[]).includes(c),
        `${c} is a Condition but is NOT in PEM_RISK_CONDITIONS — protocol v2 §1.1 requires it`,
      ).toBe(true)
    }
  })
})

/**
 * THE INTERLOCK IS ENFORCED WHERE THE BAND IS COMPUTED.
 *
 * Until 2026-08-09 `pemGate` was called from nowhere: the module and its tests
 * existed, and no code path invoked them, so nothing was ever gated. These pin
 * the property that matters — the refusal must be produced by the SERVER at the
 * point of prescription, so a client that skips the screen, an old build, an
 * offline replay or a direct POST cannot obtain a band.
 */
describe('the gate is wired, not just written', () => {
  it('the session route imports and calls pemGate', async () => {
    const src = await import('node:fs/promises').then((fs) =>
      fs.readFile(new URL('../app/api/sst/session/route.ts', import.meta.url), 'utf8'),
    )
    expect(src).toContain("from '@/lib/sst-trainer/pem'")
    expect(src).toMatch(/pemGate\(/)
    // It must sit on the band-computation branch, not merely be imported.
    expect(src).toMatch(/if \(!gate\.allowed\)/)
  })

  it('the rating anchors are exported so the UI cannot drift from the instrument', async () => {
    const { PEM_FREQUENCY_ANCHORS, PEM_SEVERITY_ANCHORS, PEM_ITEMS } = await import('../lib/sst-trainer/pem')
    // Five points per scale, matching Cotler's 0-4.
    expect(PEM_FREQUENCY_ANCHORS).toHaveLength(5)
    expect(PEM_SEVERITY_ANCHORS).toHaveLength(5)
    // The anchor at index 2 is what makes ">=2" mean "at least half the time".
    expect(PEM_FREQUENCY_ANCHORS[2]).toMatch(/half the time/i)
    expect(PEM_SEVERITY_ANCHORS[2]).toMatch(/moderate/i)
    expect(PEM_ITEMS).toHaveLength(5)
  })

  it('the screen form renders every anchor, so no rating is unlabelled', async () => {
    const src = await import('node:fs/promises').then((fs) =>
      fs.readFile(new URL('../components/sst-trainer/PemScreen.tsx', import.meta.url), 'utf8'),
    )
    expect(src).toContain('PEM_FREQUENCY_ANCHORS')
    expect(src).toContain('PEM_SEVERITY_ANCHORS')
    // No default selection: a pre-filled 0 would let the least engaged user tap
    // straight through to "no PEM", defeating the fail-closed design.
    expect(src).toMatch(/PEM_ITEMS\.map\(\(\) => null\)/)
  })
})
