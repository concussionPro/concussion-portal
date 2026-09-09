import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Paid fulfilment must never lose Stripe customer_details.name to a later
 * free-signup / email-gate upsert (2026-09-09: bec@sequenceosteo.com.au paid
 * as Rebecca Burns; users.name became Olivia Millar).
 *
 * CRM Online entitlements live in course_purchases — access_level stays
 * 'preview' by design (Jessica Cheslett). Success-page courseType must not
 * default CRM sessions to CCM 'online-only'.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

describe('purchase name + CRM success metadata hardening', () => {
  it('createUser preserves existing names unless trustedName is set', () => {
    const src = read('lib/users.ts')
    expect(src).toContain('trustedName?: boolean')
    expect(src).toContain('setUserNameFromTrustedSource')
    expect(src).toMatch(/WHEN \$\{data\.trustedName === true\}/)
    expect(src).toContain("COALESCE(NULLIF(users.name, ''), EXCLUDED.name)")
  })

  it('Stripe webhook stamps trustedName and re-syncs Stripe customer_details.name', () => {
    const src = read('app/api/webhooks/stripe/route.ts')
    expect(src).toContain('setUserNameFromTrustedSource')
    expect(src).toContain('trustedName: true')
    // CCM + CRM fulfilment both re-apply the Stripe name after upsert.
    expect(src.match(/setUserNameFromTrustedSource\(customerEmail, customerName\)/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
  })

  it('checkout success detects CRM sessions without courseType metadata', () => {
    const src = read('app/api/checkout-session/route.ts')
    expect(src).toContain('isCrmSession')
    expect(src).toContain("productType === 'crm-course'")
    expect(src).toContain("'crm-online'")
    expect(src).toContain('setUserNameFromTrustedSource')
  })
})
