import { describe, it, expect } from 'vitest'
import {
  parseMarketCookie,
  shouldTreatAsInternational,
  shouldForceAudOnlineSku,
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

describe('shouldForceAudOnlineSku (checkout remap)', () => {
  it('forces AUD Online for true AU market only', () => {
    // Explicit AU cookie — even on overseas IP
    expect(shouldForceAudOnlineSku('au', 'US')).toBe(true)
    expect(shouldForceAudOnlineSku('au', 'GB')).toBe(true)
    expect(shouldForceAudOnlineSku('au', null)).toBe(true)
    // AU geo without intl override
    expect(shouldForceAudOnlineSku(null, 'AU')).toBe(true)
  })

  it('never forces AUD onto international / worldwide Online sales', () => {
    // Explicit intl cookie wins even on AU IP
    expect(shouldForceAudOnlineSku('intl', 'AU')).toBe(false)
    expect(shouldForceAudOnlineSku('intl', 'US')).toBe(false)
    // Overseas geo → keep international-online SKU
    expect(shouldForceAudOnlineSku(null, 'US')).toBe(false)
    expect(shouldForceAudOnlineSku(null, 'GB')).toBe(false)
    expect(shouldForceAudOnlineSku(null, 'CA')).toBe(false)
    expect(shouldForceAudOnlineSku(null, 'DE')).toBe(false)
    // NZ is NOT remapped — NZD lives on the intl path (AU/NZ geo was too broad)
    expect(shouldForceAudOnlineSku(null, 'NZ')).toBe(false)
    // Unknown geo — do not guess AUD
    expect(shouldForceAudOnlineSku(null, null)).toBe(false)
  })
})
