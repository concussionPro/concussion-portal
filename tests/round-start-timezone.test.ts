/**
 * ROUND_START MEANS MIDNIGHT IN AUSTRALIA — in JS *and* in SQL.
 *
 * CONFIG.WORKSHOP.ROUND_START holds bare 'YYYY-MM-DD' strings. `new Date(str)`
 * parses that as UTC midnight — 10am (AEST) or 11am (AEDT) Sydney — and the
 * same bare string handed to Postgres is resolved against the DATABASE's
 * TimeZone setting, which nothing in this repo pins. So for ~11 hours of every
 * round-start day, the alumni classifier (JS) and the seat counter (SQL) could
 * place the same buyer in different rounds. A buyer wrongly classed an alumnus
 * is dropped from every nurture lane — including their own post-purchase
 * onboarding — after paying four figures.
 *
 * Both sides now resolve the date through roundStartInstant().
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { CONFIG, roundStartInstant, roundStartSqlInstant } from '@/lib/config'
import { isWorkshopAlumnus } from '@/lib/workshop-alumni'

describe('roundStartInstant resolves to Australian Eastern midnight', () => {
  it('AEDT date (+11): 2026-03-08 Sydney = 2026-03-07T13:00Z', () => {
    // Sydney round start, in daylight time.
    expect(CONFIG.WORKSHOP.ROUND_START.sydney).toBe('2026-03-08')
    expect(roundStartInstant('sydney')!.toISOString()).toBe('2026-03-07T13:00:00.000Z')
  })

  it('AEST date (+10): melbourne 2026-06-14 (Round 4 opened) = 2026-06-13T14:00Z', () => {
    expect(CONFIG.WORKSHOP.ROUND_START.melbourne).toBe('2026-06-14')
    expect(roundStartInstant('melbourne')!.toISOString()).toBe('2026-06-13T14:00:00.000Z')
  })

  it('is NOT UTC midnight — that was the bug', () => {
    for (const slug of Object.keys(CONFIG.WORKSHOP.ROUND_START)) {
      const utcMidnight = new Date(CONFIG.WORKSHOP.ROUND_START[slug]).getTime()
      const auMidnight = roundStartInstant(slug)!.getTime()
      expect(auMidnight).toBeLessThan(utcMidnight)
      const hoursEarlier = (utcMidnight - auMidnight) / 3_600_000
      expect(hoursEarlier).toBeGreaterThanOrEqual(10)
      expect(hoursEarlier).toBeLessThanOrEqual(11)
    }
  })

  it('unknown / missing city returns null so callers can fail safe', () => {
    expect(roundStartInstant('atlantis')).toBeNull()
    expect(roundStartInstant(null)).toBeNull()
    expect(roundStartInstant(undefined)).toBeNull()
  })

  it('the SQL form is an explicit-UTC instant no server setting can reinterpret', () => {
    const iso = roundStartSqlInstant('sydney')!
    expect(iso).toMatch(/Z$/)
    expect(iso).not.toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('JS and SQL agree about who is in the current round', () => {
  const sydneyMorning = '2026-03-08T09:00:00+11:00' // 9am Sydney on round-start day

  it('a buyer at 9am Sydney on round-start day is a CURRENT-round buyer, not an alumnus', () => {
    // Under UTC-midnight parsing this instant (2026-03-07T22:00Z) fell BEFORE
    // the boundary and silenced a paying customer's entire lifecycle.
    expect(new Date(sydneyMorning).getTime()).toBeLessThan(
      new Date(CONFIG.WORKSHOP.ROUND_START.sydney).getTime(),
    )
    expect(
      isWorkshopAlumnus({
        accessLevel: 'full-course',
        workshopLocation: 'sydney',
        registeredAt: sydneyMorning,
      }),
    ).toBe(false)
  })

  it('a buyer the day before the round opened is still an alumnus', () => {
    expect(
      isWorkshopAlumnus({
        accessLevel: 'full-course',
        workshopLocation: 'sydney',
        registeredAt: '2026-03-06T09:00:00+11:00',
      }),
    ).toBe(true)
  })

  it('the seat counter sends the same instant to Postgres', () => {
    const users = readFileSync(join(__dirname, '..', 'lib', 'users.ts'), 'utf8')
    expect(users).toMatch(/roundStartSqlInstant\(location\)/)
    // The bare config string must never be handed to SQL again.
    expect(users).not.toMatch(/CONFIG\.WORKSHOP\.ROUND_START\[/)

    const alumni = readFileSync(join(__dirname, '..', 'lib', 'workshop-alumni.ts'), 'utf8')
    expect(alumni).toMatch(/roundStartInstant\(loc\.slug\)/)
    expect(alumni).not.toMatch(/new Date\(roundStart\)/)
  })
})
