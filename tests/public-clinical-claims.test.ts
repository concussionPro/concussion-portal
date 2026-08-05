/**
 * NO UNSOURCED CLINICAL STATISTIC ON A PUBLIC SURFACE.
 *
 * This is a YMYL healthcare site advertising a regulated service: under the TGA
 * advertising code and AHPRA's advertising guidelines, a clinical figure with no
 * citation is a liability whether or not it happens to be true. Four such
 * figures were live in FAQ, blog and landing copy (including inside FAQPage
 * JSON-LD, i.e. offered to Google as a citable answer) with no source anywhere
 * in the repo:
 *
 *   - adult SCAT6 on under-13s "misses 50-60% of concussions"
 *   - the 10-word memory list gives "80-85% sensitivity"
 *   - vestibulo-ocular dysfunction in "~70% of PPCS cases"
 *   - cervical contribution in "~54% of PPCS cases"
 *   - PPCS is "5-20% of concussion cases" (the course content teaches 10-30%)
 *
 * Each was rewritten to a claim that does not depend on the unverifiable number.
 * They must not creep back. If a source is FOUND, the number may return WITH the
 * citation attached — which is why these patterns require the bare figure to be
 * absent rather than banning the topic.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const REPO = join(__dirname, '..')
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'neurovision', 'sst-watch'])

/** Every customer-facing source file (pages, components, outbound email copy). */
function publicSources(): Array<{ path: string; src: string }> {
  const out: Array<{ path: string; src: string }> = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (SKIP_DIRS.has(entry)) continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) { walk(full); continue }
      if (!/\.(ts|tsx)$/.test(entry)) continue
      out.push({ path: full.slice(REPO.length + 1), src: readFileSync(full, 'utf8') })
    }
  }
  walk(join(REPO, 'app'))
  walk(join(REPO, 'components'))
  return out
}

const SOURCES = publicSources()

const BANNED: Array<{ label: string; re: RegExp }> = [
  { label: 'Child SCAT6 miss rate (no source in repo)', re: /misses\s+50-60%/i },
  { label: '10-word list sensitivity (no source in repo)', re: /80-85%\s*sensitivity|now\s*80-85%|for\s*80-85%/i },
  { label: 'vestibulo-ocular prevalence in PPCS (no source in repo)', re: /(?:~|about\s+|up to\s+)?70%\s+of\s+(?:PPCS|persistent)/i },
  // '54%' alone would hit CSS utilities like -translate-y-[54%]; anchor on prose.
  { label: 'cervical contribution in PPCS (no source in repo)', re: /(?:~|about\s+)54%|54%\s+(?:of|have|with)/i },
  { label: 'PPCS incidence 5-20% (course content teaches 10-30%)', re: /5-20%/ },
]

describe('public copy carries no unsourced clinical statistic', () => {
  for (const { label, re } of BANNED) {
    it(`does not assert: ${label}`, () => {
      const hits = SOURCES.filter((f) => re.test(f.src)).map((f) => f.path)
      expect(hits, `unsourced clinical figure reintroduced (${re})`).toEqual([])
    })
  }

  it('the statistics that DO appear in the PPCS articles carry a named source', () => {
    const cervical = SOURCES.find((f) => f.path.includes('cervicogenic-drivers-chronic-concussion'))!
    // The one retained figure is the acute cervical co-injury rate the CRM
    // course teaches (data/ep-modules/module-5.ts), with its citation.
    expect(cervical.src).toMatch(/up to 70% of sport-related concussions \(Schneider et al\., 2014/)
  })

  it('the VOMS dizziness figure names its source in every file that asserts it', () => {
    // 50-80% IS sourced in this repo — the VOMS article attributes it to Mucha
    // et al. (2014) and Kontos et al. (2017), both in data/references.ts. The
    // teaser cards that repeated the figure elsewhere carried no attribution at
    // all, which is the defect: a figure travelling without its source.
    const assertions = SOURCES.filter((f) => /50-80% of concussed athletes/.test(f.src))
    expect(assertions.length).toBeGreaterThan(0)
    for (const f of assertions) {
      expect(f.src, `${f.path} asserts the dizziness figure with no source in the file`).toMatch(
        /Mucha et al\., 2014/,
      )
    }
  })
})
