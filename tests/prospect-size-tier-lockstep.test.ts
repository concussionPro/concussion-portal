import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { clinicalCount } from '@/lib/prospect/pricing'
import type { ClinicTeam } from '@/lib/prospect/types'

/**
 * The cold engine's size-tier CASE expression is hand-written SQL inside a
 * tagged template, so TypeScript cannot check it. lib/prospect/pricing.ts
 * documents that three definitions are "in lockstep":
 *
 *   1. clinicalCount()                      — lib/prospect/pricing.ts (TS)
 *   2. the ORDER BY size-tier CASE          — lib/prospect/process-scheduled.ts
 *   3. the candidate-query size-tier CASE   — app/api/admin/prospect-fire-now
 *
 * They were NOT. Both SQL sites omitted `physiotherapists` — the largest
 * allied-health discipline in the target market — so a physio-only clinic
 * summed to 0 clinical headcount and fell into the lowest send-priority band
 * (ELSE 2, with the 2.6x interleave penalty) while the TS side correctly
 * priced it as a Hub Pack clinic. A stray `+ & +` in the same expression had
 * also 500'd prospect-fire-now in production, undetected, for the same reason:
 * nothing type-checks these strings.
 *
 * This test reads the actual source files, so drift fails CI.
 */

const ROOT = path.resolve(__dirname, '..')

/** The clinical team keys clinicalCount() actually sums, derived by probing it. */
function canonicalClinicalKeys(): string[] {
  const candidates: Array<keyof ClinicTeam> = [
    'osteopaths', 'physiotherapists', 'chiropractors', 'generalPractitioners',
    'sportsMedicineDoctors', 'exercisePhys', 'myotherapists', 'remedialMassage',
    'podiatrists', 'psychologists', 'dietitians', 'admin', 'receptionists',
  ] as Array<keyof ClinicTeam>
  return candidates.filter((k) => clinicalCount({ [k]: 1 } as unknown as ClinicTeam) === 1)
}

/** Every `pc.team->>'<key>'` referenced inside a size-tier CASE in a file. */
function sqlTeamKeys(relPath: string): Set<string> {
  const src = fs.readFileSync(path.join(ROOT, relPath), 'utf8')
  return new Set([...src.matchAll(/pc\.team->>'([a-zA-Z]+)'/g)].map((m) => m[1]))
}

describe('cold-engine size tier stays in lockstep with clinicalCount()', () => {
  const canonical = canonicalClinicalKeys()

  it('clinicalCount sums the eight clinical disciplines', () => {
    expect(canonical).toContain('physiotherapists')
    expect(canonical).toHaveLength(8)
  })

  for (const rel of [
    'lib/prospect/process-scheduled.ts',
    'app/api/admin/prospect-fire-now/route.ts',
  ]) {
    it(`${rel} references every canonical clinical key`, () => {
      const found = sqlTeamKeys(rel)
      const missing = canonical.filter((k) => !found.has(k))
      expect(missing, `SQL omits clinical discipline(s): ${missing.join(', ')}`).toEqual([])
    })

    it(`${rel} has no corrupted arithmetic in its team sums`, () => {
      const src = fs.readFileSync(path.join(ROOT, rel), 'utf8')
      // The shipped bug was `+ & +`. Any operator pair that is not a lone `+`
      // between two COALESCE terms is corruption a tagged template will hide.
      expect(src).not.toMatch(/\+\s*&\s*\+/)
      expect(src).not.toMatch(/COALESCE\(\(pc\.team->>'[a-zA-Z]+'\)::int,\s*0\)\s*\+\s*[^\sC]/)
    })
  }

  it('a physio-only clinic is a Hub Pack clinic, not an individual', () => {
    // The concrete regression: 5 physios must not sum to zero.
    expect(clinicalCount({ physiotherapists: 5 } as ClinicTeam)).toBe(5)
  })
})
