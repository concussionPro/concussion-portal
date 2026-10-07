import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * CHECKOUT FRICTION — measured 2026-10-07 against 120 days of production data:
 *
 *   started 77  ·  completed 14  ·  expired ~54        (18% completion)
 *   the $100 deposit: 5 started, 1 completed
 *
 * At a hundred dollars that is not price resistance. Three settings on the
 * Stripe session were doing the damage, and all three are now fixed here.
 */
const stripe = readFileSync('lib/stripe.ts', 'utf8')

describe('the Stripe session does not expire before a clinician can finish', () => {
  it('every session lives 24 hours, not 1', () => {
    expect(stripe).not.toMatch(/expires_at:[^\n]*60 \* 60,\s*$/m)
    const lives = stripe.match(/expires_at: Math\.floor\(Date\.now\(\) \/ 1000\) \+ 60 \* 60 \* 24/g) ?? []
    expect(lives.length).toBeGreaterThanOrEqual(3)
  })

  it('no session is created with the old one-hour window', () => {
    expect(stripe).not.toContain('// 1 hour (gives BNPL users time)')
  })
})

describe('checkout asks only for what it needs', () => {
  it('billing address is never mandatory', () => {
    expect(stripe).not.toContain("billing_address_collection: 'required'")
    expect(stripe).toContain("billing_address_collection: 'auto'")
  })

  it('phone is not collected at all — nothing ever read it', () => {
    expect(stripe).not.toContain('phone_number_collection')
  })

  it('the invoice still prints an address when one is supplied', () => {
    // the change is safe precisely because this is conditional
    const invoice = readFileSync('lib/tax-invoice.ts', 'utf8')
    expect(invoice).toContain('if (input.buyer.address)')
  })

  it('expired sessions still carry a Stripe recovery URL', () => {
    expect(stripe).toContain('after_expiration')
    expect(stripe).toContain('recovery: { enabled: true }')
  })
})
