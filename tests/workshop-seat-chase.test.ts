import { describe, it, expect } from 'vitest'
import { WORKSHOP_BALANCE_REMINDER, WORKSHOP_FINAL_SEATS } from '@/lib/email-sequences'
import { CONFIG } from '@/lib/config'

/**
 * Two lanes added 2026-09-29 after the Melbourne Round 4 audit.
 *
 * 1. An unpaid A$100 deposit used to get ONE balance request and then nothing.
 *    Lilly Nolte's seat was held indefinitely against a payment nobody ever
 *    chased. WORKSHOP_BALANCE_REMINDER is the second and final ask.
 *
 * 2. The upgrade lane stopped at the early-bird close, leaving 24 Oct → 7 Nov
 *    silent with the room half empty. WORKSHOP_FINAL_SEATS covers that window.
 *
 * Both quote money or seat counts, so both are held to the honesty rules:
 * a stated seat count must be the real roster, and the final-window email
 * must not still be waving an early-bird rate that has closed.
 */

const link = 'https://portal.example.com/upgrade'

describe('WORKSHOP_BALANCE_REMINDER (deposit chase)', () => {
  const html = WORKSHOP_BALANCE_REMINDER.template(
    'Lilly Nolte', 'Melbourne', 'Saturday 7 November 2026', 593, 100, 12, link,
  )

  it('states the outstanding balance, not the full course price', () => {
    expect(html).toContain('A$593')
    expect(html).not.toContain('1,190')
    expect(html).not.toContain('1,400')
  })

  it('credits the deposit explicitly so the Stripe total is not a surprise', () => {
    expect(html).toContain('A$100')
    expect(html).toMatch(/credited automatically at checkout/i)
  })

  it('names the consequence of silence — released and refunded, not held forever', () => {
    expect(html).toMatch(/release the place/i)
    expect(html).toMatch(/refund/i)
  })

  it('links to the checkout it quoted, never a page that charges a different figure', () => {
    expect(html).toContain(link)
  })

  it('agrees with itself on plurality of the countdown', () => {
    const one = WORKSHOP_BALANCE_REMINDER.template('A', 'Melbourne', 'd', 593, 100, 1, link)
    expect(one).toContain('1 day away')
    expect(one).not.toContain('1 days')
  })
})

describe('WORKSHOP_FINAL_SEATS (post-early-bird window)', () => {
  const html = WORKSHOP_FINAL_SEATS.template(
    'Sonya Moore', 'Melbourne', 'Saturday 7 November 2026', 903, 11, 9, link, 'ccm',
  )

  it('states the real seat count it was handed', () => {
    expect(html).toContain('9 seats')
  })

  it('does not dangle an early-bird rate that has already closed', () => {
    expect(html).toMatch(/early-bird rate has closed/i)
    // The standard upgrade price, from CONFIG — not the early-bird one.
    expect(html).toContain('A$903')
    expect(html).not.toContain('A$693')
  })

  it('quotes the difference only, never the full course price', () => {
    const fullPrice = CONFIG.COURSE.PRICE_REGULAR.toLocaleString('en-AU')
    expect(html).not.toContain(`A$${fullPrice}`)
  })

  it('reads correctly at one remaining seat', () => {
    const one = WORKSHOP_FINAL_SEATS.template('A', 'Melbourne', 'd', 903, 3, 1, link, 'ccm')
    expect(one).toContain('is one seat')
    expect(one).not.toMatch(/\b1 seats\b/)
  })

  it('carries the EP stream CPD total for a CRM owner', () => {
    const crm = WORKSHOP_FINAL_SEATS.template('A', 'Melbourne', 'd', 903, 11, 5, link, 'crm')
    expect(crm).toContain(String(CONFIG.COURSE.CRM_TOTAL_CPD_POINTS))
  })
})

describe('WORKSHOP_DEPOSIT_BALANCE_EMAIL (first ask)', () => {
  it('names the early-bird close date, never the rule that produces it', async () => {
    const { WORKSHOP_DEPOSIT_BALANCE_EMAIL } = await import('@/lib/email-sequences')
    const html = WORKSHOP_DEPOSIT_BALANCE_EMAIL.template(
      'Lilly Nolte', 'Melbourne', 'Saturday 7 November 2026', 593, 100, '24 October',
      'https://portal.example.com/upgrade',
    )
    expect(html).toContain('holds until <strong>24 October</strong>')
    // The old copy read "holds until 14 days before the date", which made the
    // reader compute their own deadline.
    expect(html).not.toMatch(/days before the date/)
  })

  it('drops the early-bird sentence once the window has closed', async () => {
    const { WORKSHOP_DEPOSIT_BALANCE_EMAIL } = await import('@/lib/email-sequences')
    const html = WORKSHOP_DEPOSIT_BALANCE_EMAIL.template(
      'Lilly Nolte', 'Melbourne', 'Saturday 7 November 2026', 803, 100, null,
      'https://portal.example.com/upgrade',
    )
    expect(html).toMatch(/early-bird window for this date has already closed/i)
    expect(html).not.toMatch(/rate holds until/i)
  })
})

describe('upgrade emails state the real seat count (no incentive, owner 2026-09-30)', () => {
  it('OFFER shows seats remaining, not capacity, when the roster loaded', async () => {
    const { WORKSHOP_UPGRADE_OFFER } = await import('@/lib/email-sequences')
    const html = WORKSHOP_UPGRADE_OFFER.template(
      'Sonya', 'Melbourne', 'Sat 7 Nov', 693, '24 October', 903, link, 'ccm', 10,
    )
    expect(html).toContain('10 of 12 places still open')
  })

  it('OFFER falls back to capacity when the roster could not be read', async () => {
    const { WORKSHOP_UPGRADE_OFFER } = await import('@/lib/email-sequences')
    const html = WORKSHOP_UPGRADE_OFFER.template(
      'Sonya', 'Melbourne', 'Sat 7 Nov', 693, '24 October', 903, link, 'ccm', null,
    )
    // Never dress capacity up as availability.
    expect(html).not.toMatch(/still open/)
    expect(html).toContain(`${CONFIG.WORKSHOP.CAPACITY_PER_COURSE} places`)
  })

  it('LAST CALL adds the count beside the deadline and handles one seat', async () => {
    const { WORKSHOP_UPGRADE_LAST_CALL } = await import('@/lib/email-sequences')
    expect(WORKSHOP_UPGRADE_LAST_CALL.template('S', 'Melbourne', 'd', 693, '24 October', 903, link, 'ccm', 4))
      .toContain('<strong>4 seats</strong> left')
    expect(WORKSHOP_UPGRADE_LAST_CALL.template('S', 'Melbourne', 'd', 693, '24 October', 903, link, 'ccm', 1))
      .toContain('<strong>one seat</strong> left')
    expect(WORKSHOP_UPGRADE_LAST_CALL.template('S', 'Melbourne', 'd', 693, '24 October', 903, link, 'ccm', null))
      .not.toMatch(/left\./)
  })

  it('no upgrade email offers a discount, bonus or incentive', async () => {
    const m = await import('@/lib/email-sequences')
    const all = [
      m.WORKSHOP_UPGRADE_OFFER.template('S', 'Melbourne', 'd', 693, '24 October', 903, link, 'ccm', 10),
      m.WORKSHOP_UPGRADE_LAST_CALL.template('S', 'Melbourne', 'd', 693, '24 October', 903, link, 'ccm', 4),
      m.WORKSHOP_FINAL_SEATS.template('S', 'Melbourne', 'd', 903, 11, 9, link, 'ccm'),
    ]
    for (const html of all) {
      expect(html).not.toMatch(/\b(discount|bonus|free (month|access|upgrade)|promo code|coupon|% off)\b/i)
    }
  })
})
