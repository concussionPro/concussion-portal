import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * A LINK'S ACCESSIBLE NAME MUST IDENTIFY ITS DESTINATION.
 *
 * WHY THIS EXISTS (2026-08-06, master clean register E pass 2).
 *
 * Pass 1 checked 1255 links from the source map plus an anonymous crawl and
 * found 9 defects. Pass 2 attacked from a different angle — a real browser, in
 * three genuine authenticated states (anonymous, CCM full-course, preview+SST,
 * via magic links minted without sending email) — and diffed, for every page,
 * the map of visible link LABEL to actual DESTINATION.
 *
 * That surfaced a class no source grep would have shown, because each offending
 * component is individually fine and only collides when RENDERED REPEATEDLY:
 *
 *   /          three cards, each "Enrol from $497 — early-bird locked",
 *              pointing at ?location=byron-bay | melbourne | sydney
 *   /learning  two cards, each "Unlock — A$497", pointing at /pricing (CCM)
 *              and /concussion-rehab-mastery (CRM) — same price, DIFFERENT
 *              PRODUCTS
 *
 * A sighted user disambiguates from the card title beside the button. A screen
 * reader announces two or three identically named links; a link-list view (how
 * many assistive-tech users navigate) shows pure duplicates with no way to tell
 * which city, or which course, is which. On /learning the two destinations sell
 * different products at the same price, so the ambiguity is commercial as well
 * as accessibility.
 *
 * The fix is an aria-label carrying the subject. This test keeps it there,
 * because the visible label is what a developer edits and the aria-label is
 * what silently rots.
 */

const ROOT = join(__dirname, '..')

/** Components that render one repeated, price-bearing call to action. */
const REPEATED_CTAS = [
  {
    file: 'components/LocationInterestCard.tsx',
    what: 'the per-city enrol button on the homepage',
    visible: /Enrol from \$\{CONFIG\.COURSE\.PRICE_ONLINE\} — early-bird locked/,
    // The accessible name must name the city.
    aria: /aria-label=\{`Enrol in \$\{city\}/,
  },
  {
    file: 'app/learning/page.tsx',
    what: 'the per-course unlock button in the catalogue',
    visible: /`Unlock — A\$\$\{c\.price\}`/,
    aria: /aria-label=\{c\.price \? `Unlock \$\{c\.title\}/,
  },
]

describe('repeated calls to action name what they act on', () => {
  it('finds the components it claims to guard', () => {
    // Non-vacuity: a renamed file would otherwise make every check below pass
    // by never running.
    for (const c of REPEATED_CTAS) {
      expect(existsSync(join(ROOT, c.file)), `${c.file} is missing — update this guard`).toBe(true)
    }
    expect(REPEATED_CTAS.length).toBeGreaterThan(1)
  })

  for (const c of REPEATED_CTAS) {
    it(`${c.what} carries an accessible name that identifies it`, () => {
      const src = readFileSync(join(ROOT, c.file), 'utf8')
      // Guard is only meaningful while the ambiguous visible label is still
      // there. If the visible text changes to something self-describing, this
      // fails loudly and should be re-derived rather than deleted.
      expect(src, `${c.file}: the visible label this guard was written against has changed`).toMatch(c.visible)
      expect(src, `${c.file}: repeated CTA lost the aria-label that distinguishes its instances`).toMatch(c.aria)
    })
  }

  it('the guard can fail', () => {
    // Proven against the exact shape that shipped: the visible label present,
    // no aria-label anywhere.
    const shipped = 'Enrol from ${CONFIG.COURSE.PRICE_ONLINE} — early-bird locked'
    expect(REPEATED_CTAS[0].visible.test(shipped)).toBe(true)
    expect(REPEATED_CTAS[0].aria.test(shipped)).toBe(false)
  })
})
