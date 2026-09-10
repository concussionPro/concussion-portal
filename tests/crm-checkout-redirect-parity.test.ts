/**
 * CRM checkout must redirect buyers to Stripe.
 *
 * PricingOptions (stream=crm) historically required `data.success && data.url`,
 * but /api/crm/checkout only returned `{ url }`. That minted live Stripe
 * sessions then showed a client error — rage-click thrash (Jessica 9 Sep:
 * 14 expired CRM Online sessions before abandon-rescue paid).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const root = process.cwd()

describe('CRM checkout redirect parity', () => {
  it('AU + intl CRM checkout JSON includes success:true with url', () => {
    for (const rel of [
      'app/api/crm/checkout/route.ts',
      'app/api/crm/checkout-international/route.ts',
    ]) {
      const src = readFileSync(join(root, rel), 'utf8')
      expect(src).toContain('success: true, url: session.url')
    }
  })

  it('PricingOptions redirects on data.url without requiring data.success', () => {
    const src = readFileSync(join(root, 'components/PricingOptions.tsx'), 'utf8')
    expect(src).toContain('if (data.url)')
    expect(src).not.toMatch(/if \(data\.success && data\.url\)/)
  })
})
