import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { CONFIG } from '../lib/config'

/**
 * ACCREDITATION CLAIMS MUST BE FLAG-DRIVEN, NEVER HAND-WRITTEN.
 *
 * ESSA granted accreditation on 2026-07-25. The day AFTER, three live surfaces
 * still said it was pending — including /ep-course/dashboard, i.e. the CRM
 * buyer's own dashboard telling a paying customer that the accreditation they
 * had just bought was "not currently held or claimed".
 *
 * That is the failure this file exists to stop: a page that hardcodes a
 * regulatory status drifts silently the moment the status changes, and the
 * drift runs in BOTH directions — an over-claim is a compliance problem, an
 * under-claim is a sales problem.
 *
 * Rule: any file mentioning a body's accreditation status must reference the
 * governing flag, so approval day is one edit in lib/config.ts.
 */
const REPO = join(__dirname, '..')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

const sourceFiles = [join(REPO, 'app'), join(REPO, 'components')].flatMap((d) => walk(d))

describe('no surface hardcodes an accreditation status', () => {
  it('every ESSA "pending" claim sits behind ESSA_ACCREDITED', () => {
    const offenders: string[] = []
    for (const f of sourceFiles) {
      const src = readFileSync(f, 'utf8')
      // Strip block comments — a comment explaining the gate is fine.
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      const claimsPending = /ESSA[^.\n]{0,80}pending|pending[^.\n]{0,40}ESSA/i.test(code)
      if (claimsPending && !code.includes('ESSA_ACCREDITED')) {
        offenders.push(f.replace(REPO + '/', ''))
      }
    }
    expect(
      offenders,
      `these state an ESSA status without consulting the flag:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('every ACSM CEC claim sits behind ACSM_ACCREDITED', () => {
    const offenders: string[] = []
    for (const f of sourceFiles) {
      const src = readFileSync(f, 'utf8')
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      // A CEC *value* claim, not merely the word "CEC" describing the audience.
      const claimsCecs = /\b\d+\s*(ACSM\s*)?CECs?\b|ACSM[- ]accredited|ACSM Approved Provider/i.test(code)
      if (claimsCecs && !code.includes('ACSM_ACCREDITED')) {
        offenders.push(f.replace(REPO + '/', ''))
      }
    }
    expect(
      offenders,
      `these assert an ACSM CEC status without consulting the flag:\n${offenders.join('\n')}`,
    ).toEqual([])
  })
})

describe('the flags themselves stay honest', () => {
  it('ACSM CECs are never claimed without an approval-letter figure', () => {
    if (CONFIG.FEATURES.ACSM_ACCREDITED) {
      expect(
        CONFIG.FEATURES.ACSM_CEC_HOURS,
        'ACSM_ACCREDITED is true but no CEC figure is set — the letter names the number, do not infer it',
      ).toBeTypeOf('number')
    } else {
      expect(CONFIG.FEATURES.ACSM_CEC_HOURS).toBeNull()
    }
  })

  it('HPCSA stays false while ZA checkout is blocked (compliance, not a toggle)', () => {
    const gate = readFileSync(join(REPO, 'app/api/create-checkout/route.ts'), 'utf8')
    expect(gate).toMatch(/country === 'ZA'/)
    expect(gate).toMatch(/HPCSA_ACCREDITED/)
  })
})
