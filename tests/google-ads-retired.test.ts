/**
 * GOOGLE ADS IS A RETIRED CHANNEL — nothing advertising-shaped may fire.
 *
 * There is no live ad spend. Until this was gated, every page of a YMYL
 * healthcare site loaded gtag.js under the AW- conversion ID with no consent
 * gate, fired remarketing audience events on 8 routes, fired an enrol-click
 * conversion, and posted server-side purchase conversions (with the buyer's
 * hashed address) from the Stripe webhook.
 *
 * The switch is ONE flag (lib/google-ads.ts) so resuming spend is an env var,
 * not an archaeology exercise. Genuine measurement is deliberately untouched:
 * GA4 still loads and the custom Postgres event store — the analytics Zac
 * actually reads — is not involved in any of this.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { GOOGLE_ADS_ENABLED, GOOGLE_ADS_ID, GA4_MEASUREMENT_ID } from '@/lib/google-ads'

const REPO = join(__dirname, '..')
const read = (...p: string[]) => readFileSync(join(REPO, ...p), 'utf8')

describe('the switch', () => {
  it('is OFF unless NEXT_PUBLIC_GOOGLE_ADS_LIVE is explicitly true', () => {
    expect(GOOGLE_ADS_ENABLED).toBe(false)
    expect(GOOGLE_ADS_ID).toBe('AW-17984048021')
    expect(GA4_MEASUREMENT_ID).toBe('G-LRDRZBWJ2E')
  })

  it('is the ONLY place the AW- id is written down', () => {
    const offenders: string[] = []
    const skip = new Set(['node_modules', '.next', '.git', 'neurovision', 'sst-watch', 'public', 'tests'])
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        if (skip.has(entry)) continue
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) { walk(full); continue }
        if (!/\.(ts|tsx)$/.test(entry)) continue
        if (full.endsWith(join('lib', 'google-ads.ts'))) continue
        const src = readFileSync(full, 'utf8')
        // Comments may still name the account; code may not.
        const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
        if (code.includes('AW-17984048021')) offenders.push(full.slice(REPO.length + 1))
      }
    }
    walk(REPO)
    expect(offenders, 'hardcoded Ads id — route it through lib/google-ads.ts').toEqual([])
  })
})

describe('nothing advertising-shaped loads or fires while the channel is retired', () => {
  it('the root layout loads GA4, not the Ads tag', () => {
    const layout = read('app', 'layout.tsx')
    expect(layout).toMatch(/GOOGLE_ADS_ENABLED \? GOOGLE_ADS_ID : GA4_MEASUREMENT_ID/)
    // The Ads config line is conditional; the GA4 one is not.
    expect(layout).toMatch(/gtag\('config','\$\{GA4_MEASUREMENT_ID\}'\);\$\{GOOGLE_ADS_ENABLED \?/)
  })

  it('remarketing audiences and the enrol-click conversion are gated', () => {
    const provider = read('components', 'AnalyticsProvider.tsx')
    const fnBody = (name: string) =>
      provider.slice(provider.indexOf(`function ${name}(`), provider.indexOf('\n}', provider.indexOf(`function ${name}(`)))
    expect(fnBody('fireRemarketingEvent')).toMatch(/if \(!GOOGLE_ADS_ENABLED\) return;/)
    expect(fnBody('trackGtagConversion')).toMatch(/if \(!GOOGLE_ADS_ENABLED\) return;/)
  })

  it('the browser conversion helpers are gated', () => {
    const analytics = read('lib', 'analytics.ts')
    for (const fn of ['trackLeadConversion', 'trackPurchaseConversion']) {
      const start = analytics.indexOf(`export async function ${fn}(`)
      expect(start, `${fn} missing`).toBeGreaterThan(-1)
      expect(analytics.slice(start, start + 700)).toMatch(/if \(!GOOGLE_ADS_ENABLED\) return/)
    }
  })

  it('the free-signup pages navigate immediately instead of waiting on an ad tag', () => {
    for (const page of ['scat-mastery', 'concussion-update']) {
      const src = read('app', page, 'page.tsx')
      expect(src).toMatch(/if \(!GOOGLE_ADS_ENABLED\) \{[\s\S]*clearTimeout\(safetyTimer\)[\s\S]*navigate\(\)/)
    }
  })
})

describe('server-side purchase conversions', () => {
  const realFetch = global.fetch
  beforeEach(() => { process.env.GA4_API_SECRET = 'test-secret' })
  afterEach(() => { global.fetch = realFetch; delete process.env.GA4_API_SECRET })

  it('send NOTHING to Google while the channel is retired', async () => {
    const spy = vi.fn(async () => new Response(null, { status: 204 }))
    global.fetch = spy as unknown as typeof fetch
    const { trackServerPurchase } = await import('@/lib/measurement-protocol')
    await trackServerPurchase('cs_test_123', 1400, 'AUD', 'buyer@example.com')
    expect(spy, 'a retired channel must not receive purchases (or hashed buyer emails)').not.toHaveBeenCalled()
  })
})

describe('genuine measurement is untouched', () => {
  it('the custom Postgres event store still receives every event', () => {
    const provider = read('components', 'AnalyticsProvider.tsx')
    // The internal sender is unconditional — no ads flag anywhere near it.
    expect(provider).toMatch(/await fetch\('\/api\/analytics\/track'/)
    const sendEvent = provider.slice(provider.indexOf('async function sendEvent('), provider.indexOf('// Google Ads conversion tracking helper'))
    expect(sendEvent).not.toMatch(/GOOGLE_ADS_ENABLED/)
    // Page views and exits still fire into it.
    expect(provider).toMatch(/sendEvent\('page_view'/)
    expect(provider).toMatch(/sendEvent\('page_exit'/)
  })

  it('GA4 measurement still loads', () => {
    expect(read('app', 'layout.tsx')).toMatch(/GA4_MEASUREMENT_ID/)
  })
})
