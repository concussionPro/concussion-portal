import { describe, it, expect } from 'vitest'
import {
  parseMarketCookie,
  shouldTreatAsInternational,
  MARKET_COOKIE,
} from '../lib/geo'

describe('cea_market cookie override', () => {
  it('parses only au|intl', () => {
    expect(parseMarketCookie('au')).toBe('au')
    expect(parseMarketCookie('intl')).toBe('intl')
    expect(parseMarketCookie('AU')).toBeNull()
    expect(parseMarketCookie('')).toBeNull()
    expect(parseMarketCookie(undefined)).toBeNull()
  })

  it('cookie wins over cf-ipcountry', () => {
    // AU traveller on a GB IP — cookie locks AUD surfaces.
    expect(shouldTreatAsInternational('au', 'GB')).toBe(false)
    // Explicit intl while sitting in Sydney.
    expect(shouldTreatAsInternational('intl', 'AU')).toBe(true)
    // No cookie → geo.
    expect(shouldTreatAsInternational(null, 'US')).toBe(true)
    expect(shouldTreatAsInternational(null, 'AU')).toBe(false)
    expect(shouldTreatAsInternational(null, null)).toBe(false)
  })

  it('exports the cookie name used by middleware', () => {
    expect(MARKET_COOKIE).toBe('cea_market')
  })
})

describe('AU pricing path intent', () => {
  it('cea_market=au never treats visitor as international', () => {
    for (const country of ['US', 'GB', 'CA', 'DE', null] as const) {
      expect(shouldTreatAsInternational('au', country)).toBe(false)
    }
  })
})

