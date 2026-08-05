import { describe, it, expect } from 'vitest'
import { isWorkshopAlumnus, completedWorkshopSlugs } from '@/lib/workshop-alumni'
import { CONFIG } from '@/lib/config'

/**
 * Alumni status suppresses a user from EVERY nurture lane in
 * app/api/cron/send-nurture-emails — including their own post-purchase
 * onboarding, seat reservation, prep, logistics and momentum email.
 *
 * Sydney and Byron Bay carry `hasRunWorkshop: true` (a past round ran) while
 * `status: 'collecting'` for the NEXT one, so their slugs sit in
 * completedWorkshopSlugs() permanently. Before round scoping, a clinician who
 * bought a seat for the round that has NOT run was instantly read as an
 * alumnus: they paid four figures and received nothing.
 */
describe('isWorkshopAlumnus — round scoping', () => {
  const now = new Date('2026-08-05T00:00:00Z')

  it('treats a city collecting for its next round as still-run for slug purposes', () => {
    // Guards the premise: without scoping, slug membership alone would match.
    expect(completedWorkshopSlugs(now)).toContain('sydney')
    expect(CONFIG.WORKSHOP.ROUND_START.sydney).toBeTruthy()
  })

  it('does NOT mark a buyer for the CURRENT (not-yet-run) Sydney round as alumni', () => {
    const registeredAt = new Date(
      new Date(CONFIG.WORKSHOP.ROUND_START.sydney).getTime() + 86400000,
    ).toISOString()
    expect(
      isWorkshopAlumnus(
        { accessLevel: 'full-course', workshopLocation: 'sydney', registeredAt },
        now,
      ),
    ).toBe(false)
  })

  it('DOES mark a prior-round Sydney attendee as alumni', () => {
    const registeredAt = new Date(
      new Date(CONFIG.WORKSHOP.ROUND_START.sydney).getTime() - 86400000,
    ).toISOString()
    expect(
      isWorkshopAlumnus(
        { accessLevel: 'full-course', workshopLocation: 'sydney', registeredAt },
        now,
      ),
    ).toBe(true)
  })

  it('fails SAFE on an unknown registration date — keeps the paid lifecycle running', () => {
    // Silencing a paying customer is unrecoverable; one extra email to a real
    // alumnus is not. Unknown date must therefore mean "not an alumnus".
    expect(
      isWorkshopAlumnus(
        { accessLevel: 'full-course', workshopLocation: 'sydney', registeredAt: null },
        now,
      ),
    ).toBe(false)
    expect(
      isWorkshopAlumnus(
        { accessLevel: 'full-course', workshopLocation: 'sydney', registeredAt: 'not-a-date' },
        now,
      ),
    ).toBe(false)
  })

  it('still marks a completed city (Melbourne) alumni regardless of round date', () => {
    expect(CONFIG.LOCATIONS.MELBOURNE.status).toBe('completed')
    // Bought inside the completed round — the round RAN, so they are alumni.
    const registeredAt = new Date(
      new Date(CONFIG.WORKSHOP.ROUND_START.melbourne).getTime() + 86400000,
    ).toISOString()
    expect(
      isWorkshopAlumnus(
        { accessLevel: 'full-course', workshopLocation: 'melbourne', registeredAt },
        now,
      ),
    ).toBe(true)
  })

  it('covers the CRM half of the shared practical day the same way', () => {
    const currentRound = new Date(
      new Date(CONFIG.WORKSHOP.ROUND_START.sydney).getTime() + 86400000,
    ).toISOString()
    const priorRound = new Date(
      new Date(CONFIG.WORKSHOP.ROUND_START.sydney).getTime() - 86400000,
    ).toISOString()
    const crm = { accessLevel: 'preview', ownsCrmPractical: true, workshopLocation: 'sydney' }
    expect(isWorkshopAlumnus({ ...crm, registeredAt: currentRound }, now)).toBe(false)
    expect(isWorkshopAlumnus({ ...crm, registeredAt: priorRound }, now)).toBe(true)
  })

  it('never marks a non-seat-holder as alumni', () => {
    expect(
      isWorkshopAlumnus(
        { accessLevel: 'online-only', workshopLocation: 'melbourne', registeredAt: null },
        now,
      ),
    ).toBe(false)
    expect(
      isWorkshopAlumnus({ accessLevel: 'full-course', workshopLocation: null }, now),
    ).toBe(false)
  })
})
