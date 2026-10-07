import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { normaliseReferrer } from '@/lib/acquisition'

/**
 * Measured 2026-10-07: 95% of users created AFTER the one-off 2026-09-30
 * backfill carried no acquisition_source. Cause: recordAcquisition is called
 * from exactly one place in the product — the Stripe webhook — so only BUYERS
 * were ever attributed, and the backfill only read purchase_complete events.
 *
 * Second cause, bigger: 146 of 172 unattributed users had a first-touch
 * referrer of our OWN marketing domain, which normaliseReferrer correctly
 * discards — so the marketing-site -> portal hop erased every origin.
 */
const acq = readFileSync('lib/acquisition.ts', 'utf8')

describe('attribution is captured for everyone, not just buyers', () => {
  it('the backfill reads first-touch from ANY event, not only purchases', () => {
    expect(acq).toContain("e.event_data->>'firstReferrer'")
    expect(acq.indexOf("e.event_data->>'firstReferrer'")).toBeLessThan(acq.indexOf("event_type = 'purchase_complete'"))
  })

  it('it also reads the first-touch campaign source', () => {
    expect(acq).toContain("e.event_data->'firstUtm'->>'utm_source'")
  })

  it('it runs nightly, not once by hand', () => {
    const cron = readFileSync('app/api/cron/backfill-acquisition/route.ts', 'utf8')
    expect(cron).toContain('backfillAcquisition')
    expect(cron).toContain('CRON_SECRET')
    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as { crons: Array<{ path: string }> }
    expect(vercel.crons.some((c) => c.path === '/api/cron/backfill-acquisition')).toBe(true)
  })
})

describe('null no longer means two different things', () => {
  it('a visit we observed with no external referrer records as (direct)', () => {
    expect(normaliseReferrer(null)).toBe('(direct)')
    expect(acq).toContain("sourceOverride: utmSource ? `utm:${utmSource}` : '(direct)'")
  })

  it('a self-host referrer is still not treated as an origin', () => {
    expect(normaliseReferrer('https://concussion-education-australia.com/pricing')).toBeNull()
    expect(normaliseReferrer('https://portal.concussion-education-australia.com/x')).toBeNull()
  })

  it('a real external origin survives', () => {
    expect(normaliseReferrer('https://www.essa.org.au/')).toBe('essa.org.au')
    expect(normaliseReferrer('https://osteopathy.org.au/cpd')).toBe('osteopathy.org.au')
  })

  it('someone with no events at all stays unknown — we do not invent a source', () => {
    expect(acq).toContain('seen > 0')
  })

  it('attribution stays write-once: a later touch never rewrites the origin', () => {
    expect(acq).toContain('AND acquisition_source IS NULL')
  })
})
