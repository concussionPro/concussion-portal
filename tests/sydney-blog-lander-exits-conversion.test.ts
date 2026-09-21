import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Weekday conversion pass 2026-09-21:
 * - lander-dead-/courses/sydney: forming hero was only SecureSeatCheckout
 *   (Stripe embed ≠ second page once FREE_WORKSHOP_NOTIFY is off).
 * - lander-dead baseline blog: OrganicOfferStrip sat below tall blue hero.
 */
const root = process.cwd()

describe('Sydney + baseline-blog dead-lander exits (Sep 21)', () => {
  it('Sydney forming hero exposes Online + live Melb link CTAs above the deposit', () => {
    const src = readFileSync(join(root, 'app/courses/sydney/page.tsx'), 'utf8')
    expect(src).toContain('data-cea-conversion="sydney-forming-exits-sep21"')
    expect(src).toContain('/pricing?src=sydney-forming-hero')
    expect(src).toContain('Enrol Online — start anytime')
    expect(src).toContain('workshopDatePage(liveWorkshop.slug)')
    expect(src).toContain('sydney-forming-hero')
    expect(src).toContain('nextLiveWorkshop')
    // Deposit stays tertiary under the link exits
    const exits = src.indexOf('sydney-forming-exits-sep21')
    const deposit = src.indexOf('<NextEarlyBirdCapture defaultCity="sydney"')
    expect(exits).toBeGreaterThan(-1)
    expect(deposit).toBeGreaterThan(exits)
  })

  it('baseline blog puts SST + Online dual exits inside the blue hero', () => {
    const src = readFileSync(
      join(root, 'app/blog/pre-season-baseline-testing-concussion-guide/page.tsx'),
      'utf8',
    )
    expect(src).toContain('data-cea-conversion="blog-preseason-hero-exits-sep21"')
    expect(src).toContain('/clinical-suite?src=blog-preseason-hero')
    expect(src).toContain('/pricing?src=blog-preseason-hero')
    expect(src).toContain('Apply baselines with SST')
    expect(src).toContain('Enrol Online — full competency')
    // Hero exits appear before the below-hero OrganicOfferStrip
    const heroExits = src.indexOf('blog-preseason-hero-exits-sep21')
    const strip = src.indexOf('OrganicOfferStrip src="blog-preseason-strip"')
    expect(heroExits).toBeGreaterThan(-1)
    expect(strip).toBeGreaterThan(heroExits)
  })
})
