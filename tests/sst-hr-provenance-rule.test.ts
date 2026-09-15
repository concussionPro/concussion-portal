import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  isSensorVerified,
  hasHrProvenance,
  hrProvenanceOf,
  UNVERIFIABLE_HR_SOURCES,
} from '@/lib/sst-trainer/hr-provenance'

/**
 * 2026-09-15. The clinician roster and the document loader each carried their own copy of the
 * "verified" rule, and both excluded only `manual` while their comments claimed manual AND camera.
 * A camera-PPG or watch-simulator row could therefore be badged verified on the roster and printed
 * as verified in a document. Camera PPG is not valid during exercise; a simulated row is test data.
 */
describe('heart-rate provenance, one rule', () => {
  it('accepts a real watch session (no reading-share field, as the watch app sends)', () => {
    expect(isSensorVerified({ hrSource: 'watch', hrVerified: true })).toBe(true)
    expect(hrProvenanceOf({ hrSource: 'watch', hrVerified: true })).toBe('verified')
  })

  it('accepts a chest strap with a passing reading share', () => {
    expect(isSensorVerified({ hrSource: 'bluetooth', hrVerified: true, verifiedReadingPct: 91 })).toBe(true)
  })

  it('refuses a camera-PPG row even when the client says verified', () => {
    expect(isSensorVerified({ hrSource: 'camera', hrVerified: true })).toBe(false)
    expect(hrProvenanceOf({ hrSource: 'camera', hrVerified: true })).toBe('unverified')
  })

  it('refuses simulated and manual rows', () => {
    for (const src of ['simulated', 'simulator', 'manual', 'demo']) {
      expect(isSensorVerified({ hrSource: src, hrVerified: true })).toBe(false)
    }
  })

  it('is case and whitespace insensitive about the source', () => {
    expect(isSensorVerified({ hrSource: ' Camera ', hrVerified: true })).toBe(false)
    expect(isSensorVerified({ hrSource: ' Watch ', hrVerified: true })).toBe(true)
  })

  it('refuses a trusted source whose reading share is below 80 per cent', () => {
    expect(isSensorVerified({ hrSource: 'watch', hrVerified: true, verifiedReadingPct: 62 })).toBe(false)
  })

  it('reports unknown, not unverified, when no provenance was recorded at all', () => {
    expect(hasHrProvenance({ peakSymptom: 3 })).toBe(false)
    expect(hrProvenanceOf({ peakSymptom: 3 })).toBe('unknown')
    expect(hrProvenanceOf(null)).toBe('unknown')
  })

  it('treats a recorded source with no verified flag as unverified, not unknown', () => {
    expect(hrProvenanceOf({ hrSource: 'watch' })).toBe('unverified')
  })

  it('keeps every unverifiable source in one exported list', () => {
    expect(UNVERIFIABLE_HR_SOURCES).toContain('camera')
    expect(UNVERIFIABLE_HR_SOURCES).toContain('simulated')
    expect(UNVERIFIABLE_HR_SOURCES).toContain('manual')
  })
})

describe('no surface re-implements the rules inline', () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

  it('the clinician roster uses the shared flare and provenance helpers', () => {
    const src = read('app/clinical-testing/patients/page.tsx')
    expect(src).toContain("from '@/lib/sst-trainer/flare'")
    expect(src).toContain("from '@/lib/sst-trainer/hr-provenance'")
    expect(src).not.toMatch(/peak\s*-\s*pre\s*>=\s*2/)
  })

  it('the document loader uses the shared provenance helper', () => {
    const src = read('lib/sst-trainer/reports/load.ts')
    expect(src).toContain("from '@/lib/sst-trainer/hr-provenance'")
    expect(src).not.toMatch(/src !== 'manual' && src !== undefined/)
  })
})
