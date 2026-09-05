import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  CHECKOUT_EMAIL_REQUIRED_MESSAGE,
  CHECKOUT_EMAIL_REQUIRED_TYPES,
  isCheckoutEmailRequired,
  resolveCheckoutCustomerEmail,
} from '@/lib/checkout-email'

describe('resolveCheckoutCustomerEmail', () => {
  it('accepts a valid body email', () => {
    const r = resolveCheckoutCustomerEmail(undefined, 'Clinic@Example.COM')
    expect(r).toEqual({ ok: true, email: 'clinic@example.com' })
  })

  it('prefers session email over body email', () => {
    const r = resolveCheckoutCustomerEmail('owner@clinic.com', 'other@clinic.com')
    expect(r).toEqual({ ok: true, email: 'owner@clinic.com' })
  })

  it('rejects missing email', () => {
    const r = resolveCheckoutCustomerEmail(undefined, undefined)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe(CHECKOUT_EMAIL_REQUIRED_MESSAGE)
  })

  it('rejects invalid email', () => {
    const r = resolveCheckoutCustomerEmail(undefined, 'not-an-email')
    expect(r.ok).toBe(false)
  })

  it('rejects demo placeholder emails', () => {
    const r = resolveCheckoutCustomerEmail('demo@clinic-preview.local', undefined)
    expect(r.ok).toBe(false)
  })
})

describe('isCheckoutEmailRequired', () => {
  it('covers CCM + shared create-checkout types', () => {
    for (const t of [
      'online-only',
      'full-course',
      'secure-seat',
      'international-online',
      'clinic-hub-pack',
    ]) {
      // workshop-upgrade always uses session email (logged-in) — not in soft gate set
      expect(isCheckoutEmailRequired(t)).toBe(true)
      expect(CHECKOUT_EMAIL_REQUIRED_TYPES).toContain(t)
    }
  })
})

describe('/api/create-checkout email gate', () => {
  it('rejects missing email before minting a Stripe session', () => {
    const src = readFileSync(join(process.cwd(), 'app/api/create-checkout/route.ts'), 'utf8')
    expect(src.includes('isCheckoutEmailRequired')).toBe(true)
    expect(src.includes('resolveCheckoutCustomerEmail')).toBe(true)
    expect(src.includes('status: 400')).toBe(true)
    // Must stamp the resolved email onto the Stripe session.
    expect(src.includes('customerEmail,')).toBe(true)
  })

  it('pricing CTAs POST email into create-checkout', () => {
    const files = [
      'components/PricingOptions.tsx',
      'components/SecureSeatCheckout.tsx',
      'components/ccm/CcmInternationalContent.tsx',
      'components/course/ContentLockedBanner.tsx',
      'app/melbourne-nov7/page.tsx',
      'components/prospect/HubPackBuyCard.tsx',
    ]
    for (const file of files) {
      const src = readFileSync(join(process.cwd(), file), 'utf8')
      expect(src.includes('useCheckoutEmail') || src.includes('resolvedCheckoutEmail')).toBe(true)
      expect(src.includes("email: resolvedCheckoutEmail") || src.includes('email: resolvedCheckoutEmail') || src.includes('resolvedCheckoutEmail ? { email')).toBe(true)
    }
  })
})
