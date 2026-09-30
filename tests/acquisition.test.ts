import { describe, it, expect } from 'vitest'
import { normaliseReferrer } from '@/lib/acquisition'

/**
 * A self-referral recorded as an origin is worse than no origin: it reads as
 * a real answer. sonya.moore's only stored referrer was our own site, which
 * is navigation, not acquisition.
 */
describe('normaliseReferrer', () => {
  it('reduces a real referrer to its bare host', () => {
    expect(normaliseReferrer('https://www.osteopathy.org.au/events/conf?x=1')).toBe('osteopathy.org.au')
    expect(normaliseReferrer('https://www.google.com/')).toBe('google.com')
    expect(normaliseReferrer('https://essa.org.au/pd')).toBe('essa.org.au')
  })

  it('treats no referrer as direct, which is a real answer', () => {
    expect(normaliseReferrer(null)).toBe('(direct)')
    expect(normaliseReferrer('')).toBe('(direct)')
  })

  it('refuses our own pages and the checkout we sent them to', () => {
    expect(normaliseReferrer('https://concussion-education-australia.com/pricing')).toBeNull()
    expect(normaliseReferrer('https://portal.concussion-education-australia.com/oa2026')).toBeNull()
    expect(normaliseReferrer('https://checkout.stripe.com/c/pay/cs_live_x')).toBeNull()
  })

  it('refuses a string it cannot parse rather than inventing a source', () => {
    expect(normaliseReferrer('not a url')).toBeNull()
    expect(normaliseReferrer('android-app://com.google.android.gm/')).toBe('com.google.android.gm')
  })
})
