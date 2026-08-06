import { describe, it, expect } from 'vitest'
import {
  asCondition,
  CONDITIONS,
  computePrescription,
  type Condition,
} from '@/lib/sst-trainer/protocol'

/**
 * `condition` is a compile-time union that only ever arrives as an untrusted
 * string: the patient app POSTs it to /api/sst/session, it is stored in
 * sst_clinic_sessions.condition, and the report loader reads it back out. Both
 * call sites used to cast it `as Condition` straight into the prescription
 * engine's defaults table — a lie TypeScript cannot catch.
 *
 * Two live failure modes this locks shut (2026-08-06 server-surface audit):
 *  - an unrecognised string made the lookup `undefined`, so reading `.lowerPct`
 *    THREW and 500-ed that patient's GP / ACC884 report;
 *  - a PROTOTYPE key resolved to a Function.prototype member, did NOT throw,
 *    and silently produced a printed training band of "NaN-NaN bpm".
 */
describe('SST condition validation', () => {
  const JUNK: unknown[] = [
    'Concussion', // wrong case
    'concussion ', // trailing space
    'post-concussion', // plausible but unsupported
    '',
    'toString', // prototype keys — these did NOT throw, they returned NaN
    'constructor',
    'valueOf',
    'hasOwnProperty',
    '__proto__',
    null,
    undefined,
    123,
    {},
    [],
  ]

  it('asCondition maps every unrecognised value to the concussion default', () => {
    for (const raw of JUNK) {
      expect(asCondition(raw)).toBe('concussion')
    }
  })

  it('asCondition passes every canonical condition through unchanged', () => {
    for (const c of CONDITIONS) {
      expect(asCondition(c)).toBe(c)
    }
  })

  it('computePrescription never returns a NaN band, whatever condition arrives', () => {
    for (const raw of JUNK) {
      const rx = computePrescription(150, raw as Condition)
      expect(Number.isFinite(rx.lowerBpm)).toBe(true)
      expect(Number.isFinite(rx.upperBpm)).toBe(true)
      expect(Number.isFinite(rx.sessionMinutes)).toBe(true)
      expect(Number.isFinite(rx.daysPerWeek)).toBe(true)
      // A band must be a real, ordered, sub-threshold prescription.
      expect(rx.lowerBpm).toBeGreaterThan(0)
      expect(rx.upperBpm).toBeGreaterThan(rx.lowerBpm)
      expect(rx.upperBpm).toBeLessThanOrEqual(150)
      expect(rx.summary).not.toContain('NaN')
    }
  })

  it('computePrescription never throws on an unrecognised condition', () => {
    for (const raw of JUNK) {
      expect(() => computePrescription(150, raw as Condition)).not.toThrow()
    }
  })

  it('each canonical condition still yields its own distinct, documented dose', () => {
    // Guards against the fallback quietly flattening every pathway onto the
    // concussion band — the fix must not cost the platform its tuning.
    const bands = CONDITIONS.map((c) => {
      const rx = computePrescription(150, c)
      return `${c}:${rx.lowerBpm}-${rx.upperBpm}:${rx.sessionMinutes}:${rx.daysPerWeek}`
    })
    // concussion and mtbi share a band by design; everything else differs.
    expect(new Set(bands).size).toBeGreaterThanOrEqual(CONDITIONS.length - 1)
    expect(computePrescription(150, 'concussion')).toMatchObject({
      lowerBpm: 120,
      upperBpm: 135,
      sessionMinutes: 20,
    })
    expect(computePrescription(150, 'cardiac')).toMatchObject({
      lowerBpm: 90,
      upperBpm: 113,
    })
  })
})
