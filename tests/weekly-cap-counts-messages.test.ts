import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Incident 2026-10-01: the first practical-day upgrade run skipped the two
 * NEWEST buyers. The weekly marketing cap counted every webhook ROW — a
 * message produces 'sent' AND 'delivered' — so a cap of 3 was really 1.5,
 * and it counted enrolment, platform and login emails as marketing.
 *
 * This locks the two properties of the fix at the source, the way the
 * city-page and regression guards do: one message counts once, and
 * transactional sequences never consume the marketing allowance.
 */
const src = readFileSync(join(__dirname, '..', 'app/api/cron/send-nurture-emails/route.ts'), 'utf8')
const capQuery = src.slice(src.indexOf('weeklyCounts'), src.indexOf('recipientSendsThisWeek'))

describe('weekly marketing cap', () => {
  it('counts distinct messages, not webhook rows', () => {
    expect(capQuery).toMatch(/COUNT\(DISTINCT email_id\)/)
    expect(capQuery).not.toMatch(/COUNT\(\*\)/)
  })

  it('never counts transactional mail against the marketing allowance', () => {
    for (const seq of ['magic-link', 'tax-invoice', 'certificate', 'course-bundle-platform', 'purchase-welcome', 'deposit-balance']) {
      expect(capQuery, `${seq} must be excluded from the cap`).toContain(`'${seq}'`)
    }
    expect(capQuery).toMatch(/NOT IN \(/)
  })
})
