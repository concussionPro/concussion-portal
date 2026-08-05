import { describe, it, expect } from 'vitest'
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
