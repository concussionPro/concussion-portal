import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * The scat-mastery lane must read progress before every step, not just day 7.
 *
 * Measured in production 2026-08-10, both caused by the same omission:
 *   joe.darley completed on 07-15 and was sent "Module 1 is ready" on 07-21
 *   emmahall received five "start module 1" variants in fifteen days
 *
 * These assert the shape of the fix rather than the behaviour, because the cron
 * is a single 1,900-line route with no seam to call — a guard that can be
 * deleted without a red test is a guard that will be.
 */
const src = readFileSync(new URL('../app/api/cron/send-nurture-emails/route.ts', import.meta.url), 'utf8')

describe('nurture progress guard', () => {
  it('loads progress unconditionally, not behind a day-7 check', () => {
    expect(src).toContain('let scatCompletedCount = 0')
    // The old shape. If this returns, every later step is blind again.
    expect(src).not.toMatch(/if \(daysSinceSignup >= 7\) \{\s*try \{\s*const \{ rows: progressRows \}/)
  })

  it('stops the lane entirely once the course is completed', () => {
    expect(src).toMatch(/scatCompletedCount >= SCAT_MODULE_COUNT/)
    expect(src).toMatch(/course completed/)
  })

  it('skips the start-nudge beats for someone who has already started', () => {
    expect(src).toContain('START_NUDGE_DAYS')
    expect(src).toMatch(/scatStartedCount > 0/)
  })

  it('tracks started separately from completed', () => {
    // A module opened but not finished still means "do not tell me to start".
    expect(src).toMatch(/m\?\.startedAt \|\| m\?\.completed/)
  })

  it('leaves the PDF-lead track alone — it never asks them to start a course', () => {
    expect(src).toMatch(/scatCompletedCount >= SCAT_MODULE_COUNT && !camePdfHunting/)
    expect(src).toMatch(/scatStartedCount > 0 && !camePdfHunting/)
  })
})
