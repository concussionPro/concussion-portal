import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'

/**
 * THE PRACTICAL PROMISE STATES A CADENCE, NEVER A DATE.
 *
 * On 2026-08-10 /pricing shipped "Three practical days run in Q4. Melbourne on
 * 31 October, then Sydney and Byron Bay in November". No venue was booked for
 * any of them. It was the most persuasive block on the page and a paying
 * customer read it before checking out.
 *
 * It was also a hardcoded literal contradicting CONFIG.LOCATIONS, which had
 * (and still has) Melbourne 'completed' on 13 June — the exact failure the
 * date-bearing copy rule in CLAUDE.md exists to prevent.
 *
 * The COMMITMENT is standing and true: a practical day runs every quarter, and
 * that holds without a venue. The DATES are true only once CONFIG carries them.
 * So this page promises the cadence, and dates live on the location cards which
 * derive them from CONFIG.LOCATIONS.
 */
const SRC = readFileSync(join(process.cwd(), 'app/pricing/page.tsx'), 'utf-8')

/** Strip comments — the incident is DOCUMENTED in this file on purpose. */
const COPY = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/** Any day-and-month pairing, either order: "31 October", "October 31". */
const DATE_RE =
  /(\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)|(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2})/gi

describe('the /pricing practical promise', () => {
  it('still makes the quarterly commitment', () => {
    expect(COPY).toMatch(/practical day runs every quarter/i)
  })

  it('names no calendar date', () => {
    // "31 October", "October 31", "Nov 12" — any day-and-month pairing.
    const dated = COPY.match(DATE_RE)
    expect(dated, `/pricing copy names a date: ${dated?.join(', ')}`).toBeNull()
  })

  it('names no quarter it cannot keep', () => {
    // "Three practical days run in Q4" promised a count in a named quarter.
    expect(COPY).not.toMatch(/\bQ[1-4]\b/)
  })

  it('is backed by a config value rather than a claim invented in copy', () => {
    expect(CONFIG.WORKSHOP.RUNS_PER_QUARTER).toBeGreaterThanOrEqual(1)
  })

  it('the guard can fail', () => {
    const bad = 'Melbourne on 31 October, then Sydney and Byron Bay in November'
    expect(DATE_RE.test(bad)).toBe(true)
    DATE_RE.lastIndex = 0 // /g regexes are stateful
  })
})
