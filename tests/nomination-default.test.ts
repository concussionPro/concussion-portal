import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG, defaultNominationCity, openNominationLocations } from '@/lib/config'

/**
 * WORKSHOP-CITY NOMINATION DEFAULT.
 *
 * A buyer who touches nothing on the Complete Course tile is nominated into
 * whatever city the picker pre-selected. app/api/cron/send-nurture-emails gates
 * every post-purchase workshop lane on CONFIG.LOCATIONS status:
 *   - Day-1 reservation email  → status === 'collecting'
 *   - workshop momentum series → status === 'collecting'
 *   - pre-workshop logistics   → status === 'confirmed' && dateObj
 * so a default of 'melbourne' ('completed' since the 13 June 2026 round ran)
 * silently dropped that buyer out of all three (fixed 2026-08-05).
 *
 * Everything below derives from CONFIG — these stay true when statuses change.
 */

/** The statuses the nurture crons actually act on. */
const CRON_COVERED_STATUSES = ['collecting', 'confirmed']

describe('default workshop-city nomination', () => {
  it('never pre-selects a city the nurture crons ignore', () => {
    const slug = defaultNominationCity()
    // Null is the only allowed alternative — pickers force an explicit choice.
    if (slug === null) {
      expect(openNominationLocations()).toHaveLength(0)
      return
    }
    const loc = Object.values(CONFIG.LOCATIONS).find((l) => l.slug === slug)
    expect(loc, `default city "${slug}" is not in CONFIG.LOCATIONS`).toBeDefined()
    expect(CRON_COVERED_STATUSES).toContain(loc!.status)
  })

  it('offers only collecting/confirmed cities as defaults, in config order', () => {
    const open = openNominationLocations()
    for (const loc of open) {
      expect(CRON_COVERED_STATUSES).toContain(loc.status)
    }
    // Order follows CONFIG.LOCATIONS so the "first open city" is deterministic.
    const declared = Object.values(CONFIG.LOCATIONS)
      .filter((l) => CRON_COVERED_STATUSES.includes(l.status))
      .map((l) => l.slug)
    expect(open.map((l) => l.slug)).toEqual(declared)
    expect(defaultNominationCity()).toBe(declared[0] ?? null)
  })

  it('excludes completed and closed cities (regression: Melbourne)', () => {
    const openSlugs = openNominationLocations().map((l) => l.slug)
    for (const loc of Object.values(CONFIG.LOCATIONS)) {
      if (loc.status === 'completed' || loc.status === 'closed') {
        expect(openSlugs).not.toContain(loc.slug)
      }
    }
    // Guards the exact defect: Melbourne is 'completed' today, so it must not
    // be the default. If a future Melbourne round flips to collecting/confirmed
    // this assertion relaxes on its own.
    if (CONFIG.LOCATIONS.MELBOURNE.status === 'completed') {
      expect(defaultNominationCity()).not.toBe('melbourne')
    }
  })
})

/**
 * THE DEFAULT MUST NEVER BECOME A NOMINATION (2026-08-10).
 *
 * `selectedLocation` initialises to defaultNominationCity() so the Complete
 * Course tile can price a city on first paint. That default is correct for
 * PRICING and wrong as a NOMINATION, and PricingOptions used to send it as
 * both: the CCM Online card carried no city control at all, yet checkout
 * still posted `preferredCity: selectedLocation`. Every online buyer who
 * touched nothing was recorded as nominating the first 'collecting' city.
 *
 * The first person to ever hit that path (2026-08-10, $497) was in Melbourne,
 * opened /pricing?location=melbourne four minutes before buying, returned to a
 * bare /pricing — which remounted at the default — and landed in the pipeline
 * as SYDNEY. The nomination count is what decides which city gets booked, so a
 * default reaching it manufactures demand for whichever city CONFIG declares
 * first.
 *
 * These assert the source, not behaviour, because the guard lives in a client
 * component's state and there is no server seam to test through.
 */
describe('an untouched default is never sent as a nomination', () => {
  const src = readFileSync(
    join(process.cwd(), 'components/PricingOptions.tsx'),
    'utf-8',
  )

  it('gates the online-only preferredCity on an explicit choice', () => {
    // The nomination may only ride along when locationExplicit is true.
    expect(
      /courseType === 'online-only' && selectedLocation && locationExplicit/.test(src),
      'online-only checkout must gate preferredCity on locationExplicit',
    ).toBe(true)
  })

  it('only ever sets locationExplicit from a user action', () => {
    // It must never be initialised true, which would restore the old behaviour.
    expect(src).toContain('useState(false)')
    expect(/const \[locationExplicit, setLocationExplicit\] = useState\(false\)/.test(src)).toBe(true)

    // Every setter call sits in a picker onClick or the ?location= effect.
    const setters = src.match(/setLocationExplicit\(true\)/g) ?? []
    expect(setters.length, 'expected the ?location= effect plus one per city picker').toBeGreaterThanOrEqual(4)
    expect(src).not.toMatch(/setLocationExplicit\(true\)\s*;?\s*\/\/\s*default/)
  })

  it('gives the online-only card a city control if it nominates at all', () => {
    // A card that can nominate must show what it is nominating. The online
    // card's picker is identifiable by its own tracking source.
    expect(src).toContain("source: 'pricing_online_card'")
  })
})
