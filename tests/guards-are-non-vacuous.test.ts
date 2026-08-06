import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * A GUARD THAT CANNOT FAIL IS AN UNLOCKED DEFECT CLASS WEARING A GREEN TICK.
 *
 * WHY THIS EXISTS (2026-08-06, item 3 of the approved plan).
 *
 * The dominant test shape in this repo is: walk a corpus of files, filter for
 * violations, assert the result is empty.
 *
 *     const offenders = sourceFiles.filter(isBad)
 *     expect(offenders).toEqual([])
 *
 * That passes for two completely different reasons — nothing is wrong, or
 * NOTHING WAS SCANNED. A renamed directory, a changed export, a regex that
 * stopped matching, and the guard reports success while checking nothing at
 * all. It is the same failure as a skipped test, minus the honesty of the
 * "skipped" label.
 *
 * This is not hypothetical. Three guards were found in exactly that state this
 * week (accreditation-claims walking app/ + components/, email-copy-truth
 * filtering PRICE_REGULAR interpolations, and one false positive). Register C
 * separately found TWO detector bugs inside its own guard — a quoted-phrase
 * exemption that swallowed all TSX copy, and `\bour` without a word boundary
 * reading "multi-hour course" as "our course". I then introduced a third in a
 * guard I wrote the same afternoon, omitting the `app/` prefix so every cron
 * path read as missing.
 *
 * So: any test file that scans a corpus and asserts emptiness must ALSO assert
 * that its corpus is non-empty. This test enforces that, and is itself written
 * to fail loudly if it ever stops finding test files to check.
 */

const TESTS_DIR = __dirname

/** Assertions that only prove something when the collection under test is real. */
const EMPTINESS_ASSERTION = /\.toEqual\(\[\]\)|\.toHaveLength\(0\)|\.length\)\s*\.toBe\(0\)/

/** Evidence the file reads a corpus off disk rather than testing pure logic. */
const SCANS_CORPUS = /readdirSync|globSync|walk\(|sourceFiles|allFiles|walkRoutes/

/**
 * Any assertion that pins the size or existence of the scanned corpus.
 * Deliberately broad — `toHaveLength(8)` pins a corpus just as firmly as
 * `toBeGreaterThan(0)`, and an early version of this check missed that and
 * produced a false positive on prospect-size-tier-lockstep.
 */
const PROVES_CORPUS = new RegExp(
  [
    'toBeGreaterThan\\(',
    'toBeGreaterThanOrEqual\\(',
    'not\\.toHaveLength\\(0\\)',
    'toHaveLength\\((?!0\\))\\d+\\)',
    '\\.length\\)\\.toBe\\((?!0\\))\\d+\\)',
    'expect\\(existsSync',
    'toContain\\(',
  ].join('|'),
)

function testFiles(): Array<{ name: string; src: string }> {
  return readdirSync(TESTS_DIR)
    .filter((f) => f.endsWith('.test.ts'))
    .filter((f) => f !== 'guards-are-non-vacuous.test.ts')
    .map((f) => ({ name: f, src: readFileSync(join(TESTS_DIR, f), 'utf8') }))
}

describe('corpus-scanning guards prove their corpus exists', () => {
  const files = testFiles()

  it('finds the test files it claims to check', () => {
    // This guard is subject to its own rule.
    expect(files.length).toBeGreaterThan(50)
  })

  it('every guard that scans a corpus and asserts emptiness also pins its size', () => {
    const vacuous = files
      .filter((f) => SCANS_CORPUS.test(f.src) && EMPTINESS_ASSERTION.test(f.src))
      .filter((f) => !PROVES_CORPUS.test(f.src))
      .map((f) => f.name)

    expect(
      vacuous.map(
        (n) =>
          `${n} walks a corpus and asserts it is empty, but never asserts the corpus itself is non-empty — ` +
          'rename the directory it scans and it passes while checking nothing. Add an assertion on the ' +
          'collection size (toBeGreaterThan / toHaveLength / toContain).',
      ),
      'a guard that cannot fail is an unlocked defect class wearing a green tick',
    ).toEqual([])
  })

  it('this check can actually fail', () => {
    // Non-vacuity of the non-vacuity checker. Proven in memory against the
    // exact shape that shipped three times this week.
    const vacuousExample = `
      const sourceFiles = walk(join(REPO, 'app'))
      const offenders = sourceFiles.filter(isBad)
      expect(offenders).toEqual([])
    `
    expect(SCANS_CORPUS.test(vacuousExample)).toBe(true)
    expect(EMPTINESS_ASSERTION.test(vacuousExample)).toBe(true)
    expect(PROVES_CORPUS.test(vacuousExample)).toBe(false)

    // And the fixed shape passes.
    const fixed = vacuousExample + `\nexpect(sourceFiles.length).toBeGreaterThan(300)`
    expect(PROVES_CORPUS.test(fixed)).toBe(true)

    // toHaveLength(8) must count as pinning the corpus — an earlier version of
    // this regex missed it and produced a false positive.
    expect(PROVES_CORPUS.test('expect(canonical).toHaveLength(8)')).toBe(true)
    // …but toHaveLength(0) must NOT, since that is the emptiness assertion.
    expect(PROVES_CORPUS.test('expect(offenders).toHaveLength(0)')).toBe(false)
  })
})

describe('no test is skipped', () => {
  // A skipped test is the honest version of the same problem. The CI gate fails
  // on skips at runtime; this catches them at authoring time, in the file.
  it('nothing is it.skip / describe.skip / it.todo', () => {
    const skipped = testFiles()
      .filter((f) => /\b(it|test|describe)\.(skip|todo)\s*\(/.test(f.src))
      .map((f) => f.name)
    expect(skipped).toEqual([])
  })

  it('this check can fail', () => {
    expect(/\b(it|test|describe)\.(skip|todo)\s*\(/.test('it.skip("later", () => {})')).toBe(true)
    expect(/\b(it|test|describe)\.(skip|todo)\s*\(/.test('it("now", () => {})')).toBe(false)
  })
})
