import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isNonDeliverableRecipient } from '@/lib/resend-client'
import {
  abandonedCourseTypeFromMetadata,
  isCrmAbandonedCourseType,
  isCrmCheckoutMetadata,
  skipsAbandonedCheckoutRescue,
} from '@/lib/abandoned-checkout'
import {
  ABANDONED_CHECKOUT_SEQUENCE,
  CRM_ABANDONED_CHECKOUT_SEQUENCE,
} from '@/lib/email-sequences'

const REPO = join(__dirname, '..')

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

describe('CRM abandon rescue inclusion', () => {
  it('recognises CRM checkout metadata', () => {
    expect(isCrmCheckoutMetadata({ stream: 'crm', tier: 'online' })).toBe(true)
    expect(isCrmCheckoutMetadata({ productType: 'crm-course' })).toBe(true)
    expect(isCrmCheckoutMetadata({ productType: 'crm-upgrade' })).toBe(true)
    expect(isCrmCheckoutMetadata({ courseType: 'online-only' })).toBe(false)
  })

  it('does not skip CRM expires; still skips SST / hub / book', () => {
    expect(skipsAbandonedCheckoutRescue({ stream: 'crm', tier: 'online', productType: 'crm-course' })).toBe(false)
    expect(skipsAbandonedCheckoutRescue({ stream: 'crm', tier: 'complete', productType: 'crm-course' })).toBe(false)
    expect(skipsAbandonedCheckoutRescue({ product: 'sst-trainer' })).toBe(true)
    expect(skipsAbandonedCheckoutRescue({ courseType: 'clinic-hub-pack' })).toBe(true)
    expect(skipsAbandonedCheckoutRescue({ productType: 'reference-book' })).toBe(true)
    expect(skipsAbandonedCheckoutRescue({ courseType: 'online-only' })).toBe(false)
  })

  it('labels CRM course_type from tier for sequence pick', () => {
    expect(abandonedCourseTypeFromMetadata({ stream: 'crm', tier: 'online' })).toBe('crm-online')
    expect(abandonedCourseTypeFromMetadata({ stream: 'crm', tier: 'complete' })).toBe('crm-complete')
    expect(abandonedCourseTypeFromMetadata({ stream: 'crm', tier: 'upgrade' })).toBe('crm-upgrade')
    expect(abandonedCourseTypeFromMetadata({ courseType: 'full-course' })).toBe('full-course')
    expect(isCrmAbandonedCourseType('crm-online')).toBe(true)
    expect(isCrmAbandonedCourseType('online-only')).toBe(false)
  })

  it('keeps CRM + CCM abandon sequences length-matched', () => {
    expect(CRM_ABANDONED_CHECKOUT_SEQUENCE.length).toBe(ABANDONED_CHECKOUT_SEQUENCE.length)
    expect(CRM_ABANDONED_CHECKOUT_SEQUENCE.length).toBe(3)
    expect(CRM_ABANDONED_CHECKOUT_SEQUENCE[0].hoursAfter).toBe(1)
    expect(CRM_ABANDONED_CHECKOUT_SEQUENCE[0].template('Alex')).toMatch(/Concussion Rehab Mastery/)
    expect(CRM_ABANDONED_CHECKOUT_SEQUENCE[0].template('Alex')).not.toMatch(/Concussion Clinical Mastery/)
  })

  it('webhook + cron wire CRM abandon inclusion', () => {
    const webhook = readFileSync(join(REPO, 'app/api/webhooks/stripe/route.ts'), 'utf8')
    expect(webhook).toMatch(/skipsAbandonedCheckoutRescue/)
    expect(webhook).toMatch(/CRM_ABANDONED_CHECKOUT_SEQUENCE/)
    expect(webhook).toMatch(/abandonedCourseTypeFromMetadata/)
    // Must not still hard-skip all stream=crm via isNonCcmProduct in the expired handler.
    const expiredFn = webhook.slice(webhook.indexOf('async function handleCheckoutExpired'))
    const expiredBody = expiredFn.slice(0, expiredFn.indexOf('\nasync function '))
    expect(expiredBody).toMatch(/skipsAbandonedCheckoutRescue/)
    expect(expiredBody).not.toMatch(/if \(isNonCcmProduct\(session\.metadata\)\)/)

    const cron = readFileSync(join(REPO, 'app/api/cron/send-nurture-emails/route.ts'), 'utf8')
    expect(cron).toMatch(/CRM_ABANDONED_CHECKOUT_SEQUENCE/)
    expect(cron).toMatch(/isCrmAbandonedCourseType/)
  })
})
