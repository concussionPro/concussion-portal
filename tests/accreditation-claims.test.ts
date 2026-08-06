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
 *
 * The original rule here was "the file mentions ESSA_ACCREDITED somewhere",
 * which FALSE-GREENED the exact failure above: /ep-course/dashboard's hero was
 * flag-driven, so the file satisfied the rule while a hardcoded "endorsement is
 * pending" block six lines below kept telling paying CRM buyers their
 * accreditation had not been granted. The claim itself must sit inside a
 * conditional on the flag (or a local alias of it) — see isInsideFlagGate.
 */
const REPO = join(__dirname, '..')

/** Blank out comments, preserving byte offsets so match indices stay valid. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^\s*\/\/.*$/gm, (m) => ' '.repeat(m.length))
}

/**
 * Blank out IDENTIFIERS containing "ESSA" (ESSA_ACCREDITED, ESSA_APPROVED,
 * essaApproved…) so `endorsePending: !ESSA_APPROVED` isn't read as prose.
 * Same-length replacement keeps offsets aligned.
 */
function maskEssaIdentifiers(code: string): string {
  return code.replace(/\b[A-Za-z_$][\w$]*ESSA[\w$]*\b|\bESSA_[A-Z0-9_]+\b/gi, (m) =>
    /^essa$/i.test(m) ? m : 'x'.repeat(m.length),
  )
}

/** ESSA_ACCREDITED plus any local alias assigned from it in this file. */
function gateTokens(code: string): string[] {
  const tokens = new Set([
    'ESSA_ACCREDITED',
    // Prop/param aliases that carry the flag in from a parent.
    'essaApproved',
    'essaAccredited',
    'accredited',
    'isAccredited',
  ])
  for (const re of [
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)[^=\n]*=\s*[^=\n]*\bESSA_ACCREDITED\b/g,
    /\b([A-Za-z_$][\w$]*)\s*[:=]\s*(?:props\.)?[^=\n]*\bESSA_ACCREDITED\b/g,
  ]) {
    let m: RegExpExecArray | null
    while ((m = re.exec(code))) tokens.add(m[1])
  }
  return [...tokens]
}

/**
 * Character ranges covered by a conditional whose TEST is a gate token —
 * `FLAG ? … : …`, `FLAG && …`, `!FLAG && …`. The range runs from the test to
 * the close of the enclosing bracket group, i.e. both branches.
 */
function flagGateSpans(code: string): Array<[number, number]> {
  const alternation = gateTokens(code)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const gate = new RegExp(`(?:!\\s*)?\\b(?:${alternation})\\b\\s*(?:\\?|&&)`, 'g')
  const spans: Array<[number, number]> = []
  let m: RegExpExecArray | null
  while ((m = gate.exec(code))) {
    let depth = 0
    let end = code.length
    for (let k = m.index; k < code.length; k++) {
      const c = code[k]
      if (c === '(' || c === '{' || c === '[') depth++
      else if (c === ')' || c === '}' || c === ']') {
        depth--
        if (depth < 0) {
          end = k
          break
        }
      }
    }
    spans.push([m.index, end])
  }
  return spans
}

/** ESSA "pending" claims in this source that are NOT inside a flag conditional. */
export function ungatedEssaPendingClaims(src: string): string[] {
  const code = stripComments(src)
  const spans = flagGateSpans(code)
  const prose = maskEssaIdentifiers(code)
  const claim = /ESSA[^.\n]{0,80}pending|pending[^.\n]{0,40}ESSA/gi
  const found: string[] = []
  let m: RegExpExecArray | null
  while ((m = claim.exec(prose))) {
    const i = m.index
    if (!spans.some(([s, e]) => i >= s && i <= e)) found.push(m[0].slice(0, 70))
  }
  return found
}

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
  it('the corpus is real', () => {
    // The detector below is proven to fire (next test). The CORPUS was not
    // proven to exist. If app/ or components/ were ever renamed, walk() returns
    // an empty array, the loop body never executes, and `.toEqual([])` passes
    // with a green tick while checking nothing at all.
    //
    // Register F, 2026-08-06: three guard files scanned a corpus and asserted
    // emptiness without ever asserting the corpus was non-empty. All three
    // happened to be fine — by luck, not construction. A guard that cannot fail
    // is an unlocked defect class wearing a green tick, exactly like a skipped
    // test.
    expect(sourceFiles.length).toBeGreaterThan(300)
  })

  it('every ESSA "pending" claim sits INSIDE a conditional on ESSA_ACCREDITED', () => {
    const offenders: string[] = []
    for (const f of sourceFiles) {
      const ungated = ungatedEssaPendingClaims(readFileSync(f, 'utf8'))
      if (ungated.length > 0) {
        offenders.push(`${f.replace(REPO + '/', '')} → ${ungated.join(' | ')}`)
      }
    }
    expect(
      offenders,
      `these render an ESSA status unconditionally — mentioning the flag elsewhere in the file is not a gate:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('the detector catches a hardcoded claim in a file that DOES mention the flag', () => {
    // The exact 2026-08-05 shape: flag-driven hero, hand-written pending block
    // below it. The old "file mentions ESSA_ACCREDITED" rule passed this.
    const regression = `
      export function Dashboard() {
        return (
          <div>
            <span>{CONFIG.FEATURES.ESSA_ACCREDITED ? 'Accredited by ESSA' : 'ESSA endorsement pending'}</span>
            <dd>ESSA endorsement of Concussion Rehab Mastery is pending — under review by two reviewers.</dd>
          </div>
        )
      }`
    expect(ungatedEssaPendingClaims(regression)).toHaveLength(1)
    // …and does NOT trip on the same block once it is gated.
    const fixed = `
      export function Dashboard() {
        return (
          <div>
            <dd>{CONFIG.FEATURES.ESSA_ACCREDITED
              ? 'Accredited by ESSA — PDNF26077.'
              : 'ESSA endorsement is pending — under review by two reviewers.'}</dd>
          </div>
        )
      }`
    expect(ungatedEssaPendingClaims(fixed)).toEqual([])
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

  it('the App Store link renders only behind SST_IOS_APP_LIVE (no badge before Apple approves)', () => {
    // Same discipline as ESSA/ACSM: a store listing is not ours to claim until
    // Apple grants it. The canonical URL lives in ONE place and every render
    // site is flag-gated.
    expect(CONFIG.SST_APP_STORE_URL).toMatch(/^https:\/\/apps\.apple\.com\/au\/app\/id\d+$/)
    const platform = readFileSync(join(REPO, 'app/platform/page.tsx'), 'utf8')
    expect(platform).toMatch(/SST_IOS_APP_LIVE/)
    // The URL must never appear hardcoded outside config.
    expect(platform).not.toContain('apps.apple.com')
  })
})
