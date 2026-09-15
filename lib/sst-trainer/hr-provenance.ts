/**
 * ONE rule for "was this session's heart rate actually measured by a sensor we trust".
 *
 * Why this file exists (2026-09-15). Two surfaces carried their own copy of the rule and both
 * excluded only `manual`, while their comments claimed manual AND camera were excluded:
 *   - lib/sst-trainer/reports/load.ts (every generated document)
 *   - app/clinical-testing/patients/page.tsx (the clinician roster badge)
 * So a camera-PPG row, or a watch-simulator row, could be printed as "verified". Camera PPG is not
 * valid during exercise (that is why the trainer offers a chest strap or the watch), and a
 * simulated row is test data. Both must read as unverified, never as verified.
 *
 * Three states, not two. A row that recorded no provenance at all is `unknown`: the documents must
 * say NOT RECORDED rather than make the positive claim "unverified (manual/camera)".
 */

/** Sources that can never support a "verified" claim. */
export const UNVERIFIABLE_HR_SOURCES = ['manual', 'camera', 'simulated', 'simulator', 'demo'] as const

/** The watch and a paired chest strap are the trusted sources. */
export type HrProvenance = 'verified' | 'unverified' | 'unknown'

const srcOf = (p: Record<string, unknown> | null | undefined): string | undefined => {
  const s = p?.hrSource
  return typeof s === 'string' && s.trim() !== '' ? s.trim().toLowerCase() : undefined
}

/** Did this row record its HR provenance AT ALL? */
export function hasHrProvenance(p: Record<string, unknown> | null | undefined): boolean {
  if (!p) return false
  if (typeof p.hrVerified === 'boolean') return true
  return srcOf(p) !== undefined
}

/**
 * Sensor-verified only. Requires an explicit verified flag, a recorded source that is not in
 * UNVERIFIABLE_HR_SOURCES, and — when the row carries a reading-share — at least `minReadingPct`
 * of readings verified. A row with no reading-share (which is what the watch app sends) is not
 * penalised for the missing field.
 */
export function isSensorVerified(
  p: Record<string, unknown> | null | undefined,
  minReadingPct = 80,
): boolean {
  if (!p) return false
  const src = srcOf(p)
  if (src === undefined) return false
  if ((UNVERIFIABLE_HR_SOURCES as readonly string[]).includes(src)) return false
  if (p.hrVerified !== true) return false
  const pct = typeof p.verifiedReadingPct === 'number' ? p.verifiedReadingPct : null
  return pct == null || pct >= minReadingPct
}

/** The three-state badge: verified / unverified / unknown. */
export function hrProvenanceOf(
  p: Record<string, unknown> | null | undefined,
  minReadingPct = 80,
): HrProvenance {
  if (!hasHrProvenance(p)) return 'unknown'
  return isSensorVerified(p, minReadingPct) ? 'verified' : 'unverified'
}
