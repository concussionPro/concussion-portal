import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { ga4EventFor } from '@/lib/ga4-events'

describe('GA4 bridge', () => {
  it('purchase carries transaction_id, value, currency, items', () => {
    const e = ga4EventFor('purchase', { sessionId: 'cs_live_abc', amount: 1190, courseType: 'ccm-complete', location: 'melbourne' })
    expect(e?.name).toBe('purchase')
    expect(e?.params).toMatchObject({ transaction_id: 'cs_live_abc', value: 1190, currency: 'AUD' })
  })
  it('never sends a purchase without a transaction id', () => {
    expect(ga4EventFor('purchase', { amount: 497 })).toBeNull()
  })
  it('maps the funnel to recommended events', () => {
    expect(ga4EventFor('checkout_start', { courseType: 'online-only' })?.name).toBe('begin_checkout')
    expect(ga4EventFor('workshop_interest_submit', { location: 'melbourne' })?.name).toBe('generate_lead')
    expect(ga4EventFor('free_course_signup', { source: 'scat-mastery' })?.name).toBe('sign_up')
    expect(ga4EventFor('pricing_page')?.name).toBe('view_item_list')
    expect(ga4EventFor('scroll_depth')).toBeNull()
  })
  it('trackEvent calls the bridge before the Postgres record', () => {
    const src = readFileSync('lib/analytics.ts', 'utf8')
    expect(src.indexOf('ga4EventFor(eventType, eventData)')).toBeLessThan(src.indexOf("fetch('/api/analytics/track'"))
  })
  it('free-course pages fire sign_up independent of the Ads flag', () => {
    for (const p of ['app/scat-mastery/page.tsx', 'app/concussion-update/page.tsx']) {
      expect(readFileSync(p, 'utf8')).toContain("trackEvent('free_course_signup'")
    }
  })
  it('the short Melbourne link is tagged', () => {
    const page = readFileSync('app/melbourne/page.tsx', 'utf8')
    expect(page).toMatch(/redirect\('\/courses\/melbourne\?utm_source=zac&utm_medium=email&utm_campaign=melb-nov7/)
  })
})
