import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CHECKOUT_EMAIL_REQUIRED_MESSAGE,
  isCheckoutEmailRequired,
  isCrmCheckoutEmailRequired,
  resolveCheckoutCustomerEmail,
} from '@/lib/checkout-email'

const REPO = join(__dirname, '..')

describe('soft checkout email gate', () => {
  it('requires email for CCM online-only (and sibling seat types)', () => {
    expect(isCheckoutEmailRequired('online-only')).toBe(true)
    expect(isCheckoutEmailRequired('full-course')).toBe(true)
    expect(isCheckoutEmailRequired('secure-seat')).toBe(true)
    expect(isCheckoutEmailRequired('international-online')).toBe(true)
    expect(isCheckoutEmailRequired('clinic-hub-pack')).toBe(true)
    expect(isCheckoutEmailRequired('workshop-upgrade')).toBe(false)
  })

  it('rejects missing email for online-only with the buyer-facing message', () => {
    const r = resolveCheckoutCustomerEmail(undefined, undefined)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe(CHECKOUT_EMAIL_REQUIRED_MESSAGE)
    expect(r.ok === false && r.error).toMatch(/enrolment link/)
  })

  it('accepts a real body email and normalises case', () => {
    const r = resolveCheckoutCustomerEmail(undefined, 'Clinic@Example.COM')
    expect(r).toEqual({ ok: true, email: 'clinic@example.com' })
  })

  it('prefers session email over body email', () => {
    const r = resolveCheckoutCustomerEmail('owner@clinic.com', 'other@clinic.com')
    expect(r).toEqual({ ok: true, email: 'owner@clinic.com' })
  })

  it('ignores demo session placeholders so Stripe can collect a real address', () => {
    const r = resolveCheckoutCustomerEmail('demo@partner-preview.local', 'real@clinic.com')
    expect(r).toEqual({ ok: true, email: 'real@clinic.com' })
  })

  it('create-checkout route wires the soft gate before minting Stripe', () => {
    const src = readFileSync(join(REPO, 'app/api/create-checkout/route.ts'), 'utf8')
    expect(src).toMatch(/resolveCheckoutCustomerEmail/)
    expect(src).toMatch(/isCheckoutEmailRequired/)
  })

  it('requires soft email for CRM online/complete/upgrade', () => {
    expect(isCrmCheckoutEmailRequired('online')).toBe(true)
    expect(isCrmCheckoutEmailRequired('complete')).toBe(true)
    expect(isCrmCheckoutEmailRequired('upgrade')).toBe(true)
  })

  it('CRM checkout route wires the soft gate before minting Stripe', () => {
    const src = readFileSync(join(REPO, 'app/api/crm/checkout/route.ts'), 'utf8')
    expect(src).toMatch(/resolveCheckoutCustomerEmail/)
    expect(src).toMatch(/isCrmCheckoutEmailRequired/)
  })
})
