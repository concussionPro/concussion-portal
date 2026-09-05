import { describe, expect, it } from 'vitest'
import { isNonDeliverableRecipient } from '@/lib/resend-client'

describe('abandoned-checkout rescue guards', () => {
  it('rejects RFC 2606 / reserved test domains', () => {
    expect(isNonDeliverableRecipient('buyer@example.com')).toBe(true)
    expect(isNonDeliverableRecipient('a@example.org')).toBe(true)
    expect(isNonDeliverableRecipient('a@example.net')).toBe(true)
    expect(isNonDeliverableRecipient('a@foo.test')).toBe(true)
    expect(isNonDeliverableRecipient('a@localhost')).toBe(true)
    expect(isNonDeliverableRecipient('')).toBe(true)
    expect(isNonDeliverableRecipient(null)).toBe(true)
  })

  it('allows real clinic domains', () => {
    expect(isNonDeliverableRecipient('pat@physioperformance.co.nz')).toBe(false)
    expect(isNonDeliverableRecipient('clinic@gmail.com')).toBe(false)
  })
})
