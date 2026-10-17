import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * A city page's deposit widget must nominate THAT city.
 *
 * WHY THIS EXISTS. `NextEarlyBirdCapture` forwards `defaultCity` into
 * `SecureSeatCheckout` with `lockCity`, so the value is not a hint — it is the
 * city the A$100 deposit is minted against, and the visitor cannot change it.
 * Get it wrong and the buyer is silently nominated for a city they never
 * looked at: their deposit lands in the wrong Ready-to-Train pipeline, the
 * real city's demand stays invisible, and their eventual enrolment carries the
 * wrong nomination.
 *
 * It has now happened twice:
 *   2026-08-20 — the phantom-Sydney default at checkout.
 *   2026-10-17 — /courses/byron-bay shipped `defaultCity="sydney"`, a
 *     copy-paste from the Sydney page. Found from a real abandoned checkout
 *     the day after the OA conference: a Brisbane clinician made 24 page views
 *     bouncing between /courses/byron-bay and /pricing, never touched a Sydney
 *     page, and their Stripe session carried `location: sydney`.
 *
 * Both times the bug was invisible in the UI and only surfaced in payment
 * metadata, which is exactly why it needs a lint-style test rather than
 * review.
 */

const COURSES = join(__dirname, '..', 'app', 'courses')

function cityDirs(): string[] {
  return readdirSync(COURSES, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => existsSync(join(COURSES, n, 'page.tsx')))
}

describe('city pages nominate their own city for the deposit', () => {
  const dirs = cityDirs()

  it('finds the city pages at all (guards against the glob silently matching nothing)', () => {
    expect(dirs.length).toBeGreaterThan(0)
  })

  it.each(dirs)('/courses/%s passes its own slug to NextEarlyBirdCapture', (dir) => {
    const src = readFileSync(join(COURSES, dir, 'page.tsx'), 'utf8')
    const matches = [...src.matchAll(/<NextEarlyBirdCapture[^>]*defaultCity=["']([^"']+)["']/g)].map(
      (m) => m[1],
    )
    // A page without the widget is fine; a page WITH it must name itself.
    for (const slug of matches) {
      expect(
        slug,
        `/courses/${dir} mints its A$100 deposit against "${slug}". ` +
          `defaultCity is forwarded with lockCity, so this is the city the buyer ` +
          `is nominated for and they cannot change it.`,
      ).toBe(dir)
    }
  })

  it('SecureSeatCheckout still treats defaultCity as binding (so this test is enforcing something real)', () => {
    const widget = readFileSync(join(__dirname, '..', 'components', 'NextEarlyBirdCapture.tsx'), 'utf8')
    // If the lockCity forwarding ever goes away, the stakes change and this
    // test's rationale needs rewriting rather than silently passing.
    expect(widget).toMatch(/<SecureSeatCheckout[^>]*defaultCity=\{city\}[^>]*lockCity/)
  })
})
