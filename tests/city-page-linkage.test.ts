import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '../lib/config'

/**
 * WORKSHOP CITY PAGES MUST BE REACHABLE, AND MUST LEAD SOMEWHERE.
 *
 * WHY THIS EXISTS (2026-08-06, master clean register A pass 2).
 *
 * Pass 1's headline finding was that /ready-to-train — built that same day to
 * fix "nothing anywhere showed a visitor what a city was collecting toward" —
 * itself shipped as an INDEXABLE ORPHAN with zero inbound links. That was fixed
 * (footer + /in-person).
 *
 * Pass 2 asked the demand-side question instead: which routes have real traffic,
 * and which have none? 56 of 206 page routes had zero pageviews in 90 days. Most
 * were /admin (never tracked, correctly). But /courses/sydney and
 * /courses/melbourne were:
 *
 *   - listed in sitemap.ts, so Google is actively told to index them
 *   - serving 200, SEO-targeted at exactly the buyer we want
 *   - reachable from NOWHERE on the site — zero inbound links
 *   - visited by NOBODY — zero pageviews in 90 days
 *
 * and /ready-to-train, the hub that exists to say where each city is up to,
 * linked to neither of them. So the same class pass 1 found had propagated one
 * level down and no one had looked: a Google visitor on /courses/sydney had no
 * path to the city-status hub, and a hub visitor had no path to the page that
 * actually sells their city.
 *
 * This locks BOTH directions, and locks the constant against the filesystem so
 * that adding app/courses/perth/page.tsx without wiring it is a test failure
 * rather than another silent orphan.
 */

const ROOT = join(__dirname, '..')
const readyToTrain = readFileSync(join(ROOT, 'app/ready-to-train/page.tsx'), 'utf8')

/** City slugs that actually have a hand-built page at app/courses/<slug>. */
function cityPagesOnDisk(): string[] {
  const slugs = new Set(Object.values(CONFIG.LOCATIONS).map((l) => l.slug))
  return readdirSync(join(ROOT, 'app/courses'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && slugs.has(d.name))
    .filter((d) => existsSync(join(ROOT, 'app/courses', d.name, 'page.tsx')))
    .map((d) => d.name)
    .sort()
}

/** The slugs /ready-to-train believes it can link to. */
function declaredInHub(): string[] {
  const m = /const CITIES_WITH_A_PAGE = new Set\(\[([^\]]*)\]\)/.exec(readyToTrain)
  if (!m) throw new Error('CITIES_WITH_A_PAGE not found in app/ready-to-train/page.tsx')
  return Array.from(m[1].matchAll(/'([^']+)'/g)).map((x) => x[1]).sort()
}

describe('workshop city pages are wired to the city-status hub', () => {
  it('finds the pages it claims to guard', () => {
    // Non-vacuity: if this resolver broke, every assertion below would compare
    // two empty arrays and pass while checking nothing.
    expect(cityPagesOnDisk().length).toBeGreaterThan(0)
    expect(Object.keys(CONFIG.LOCATIONS).length).toBeGreaterThan(2)
  })

  it('the hub links to exactly the cities that have a page', () => {
    // Both directions matter. A slug listed here with no page is a 404 in the
    // middle of a revenue surface; a page absent from here is an orphan again.
    expect(declaredInHub()).toEqual(cityPagesOnDisk())
  })

  it('the hub actually renders a link to a city page', () => {
    // Guards against the constant surviving while the JSX that uses it is
    // refactored away — the exact way a fix silently becomes decoration.
    expect(readyToTrain).toMatch(/href=\{`\/courses\/\$\{c\.slug\}`\}/)
    expect(readyToTrain).toMatch(/CITIES_WITH_A_PAGE\.has\(c\.slug\)/)
  })

  it('every city page offers a route back to the hub', () => {
    const missing = cityPagesOnDisk().filter((slug) => {
      const src = readFileSync(join(ROOT, 'app/courses', slug, 'page.tsx'), 'utf8')
      return !src.includes('/ready-to-train')
    })
    expect(
      missing.map((s) => `/courses/${s} has no link to /ready-to-train`),
      'these pages are in the sitemap and arrive from Google — a dead end there is a lost nomination',
    ).toEqual([])
  })

  it('every city page in the sitemap exists on disk', () => {
    // A sitemap entry for a deleted page tells Google to index a 404.
    const sitemap = readFileSync(join(ROOT, 'app/sitemap.ts'), 'utf8')
    const listed = Array.from(sitemap.matchAll(/\/courses\/([a-z-]+)`/g)).map((m) => m[1])
    const cityListed = listed.filter((s) => Object.values(CONFIG.LOCATIONS).some((l) => l.slug === s))
    const broken = cityListed.filter((s) => !existsSync(join(ROOT, 'app/courses', s, 'page.tsx')))
    expect(broken.map((s) => `sitemap lists /courses/${s}, which has no page`)).toEqual([])
  })

  it('the guards can fail', () => {
    // Proven in memory against the shape that shipped.
    const onDisk = ['melbourne', 'sydney']
    expect(['melbourne']).not.toEqual(onDisk)              // page missing from the hub = orphan
    expect(['melbourne', 'perth', 'sydney']).not.toEqual(onDisk) // hub links a page that isn't there = 404
    const noBackLink = '<a href="/pricing">Reserve My Spot</a>'
    expect(noBackLink.includes('/ready-to-train')).toBe(false)
  })
})
