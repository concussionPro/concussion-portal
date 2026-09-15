import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

/**
 * Evidence 2026-09-14 Resend "5 hot leads — act today": Melb showed
 * "15/12 paid seats · 15 EOI (not paid)" while real Round-4 enrolled ≈2.
 * Paid must come from getEnrollmentCount (city-progress truth), not a broad
 * users.workshop_location query that conflates EOI / prior-round alumni.
 */
describe('Lead briefing workshop pipeline paid vs EOI', () => {
  const src = readFileSync(join(root, 'app/api/cron/lead-scoring/route.ts'), 'utf8')

  it('paid seats use round-scoped getEnrollmentCount (same as city-progress)', () => {
    expect(src).toContain("from '@/lib/users'")
    expect(src).toContain('getEnrollmentCount')
    expect(src).toContain('getEnrollmentCount(loc.slug)')
    expect(src).toContain('Object.values(CONFIG.LOCATIONS)')
    // Must not resurrect the overcounting broad paid SQL
    expect(src).not.toContain('CRM_PRACTICAL_SLUG')
    expect(src).not.toMatch(/access_level = 'full-course' OR cp\.id IS NOT NULL/)
  })

  it('EOI stays workshop_interest and display keeps "EOI (not paid)" copy', () => {
    expect(src).toContain('FROM workshop_interest')
    expect(src).toContain("NOT LIKE '%suspect%'")
    expect(src).toContain('EOI (not paid)')
    expect(src).toContain('paid seats')
  })
})
