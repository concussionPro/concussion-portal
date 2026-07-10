/**
 * Hub Pack seat-uptake reminders — stage selection + owner email copy.
 *
 * The cron (app/api/cron/hub-seat-reminders) sends the owner ONE email at
 * day 3 and ONE at day 10 while claimed < cap, picking the LATEST eligible
 * stage so an old hub never gets a stale day-3 catch-up. These tests pin the
 * pure pieces: eligibility windows and the copy rules (key + link present,
 * no "free", unsubscribe footer present).
 */
import { describe, it, expect } from 'vitest'
import {
  eligibleHubReminderStages,
  HUB_SEAT_REMINDER_EMAILS,
  HUB_SEAT_REMINDER_STAGES,
} from '@/lib/email-sequences'

describe('eligibleHubReminderStages', () => {
  it('is empty before day 3', () => {
    expect(eligibleHubReminderStages(0)).toEqual([])
    expect(eligibleHubReminderStages(2)).toEqual([])
  })

  it('offers only day3 between day 3 and day 9', () => {
    expect(eligibleHubReminderStages(3)).toEqual(['day3'])
    expect(eligibleHubReminderStages(9)).toEqual(['day3'])
  })

  it('offers both stages from day 10 (cron sends the LATEST unsent one)', () => {
    expect(eligibleHubReminderStages(10)).toEqual(['day3', 'day10'])
    expect(eligibleHubReminderStages(45)).toEqual(['day3', 'day10'])
    // send order: last entry is what the cron actually sends first-pass
    expect(eligibleHubReminderStages(45).at(-1)).toBe('day10')
  })
})

describe('HUB_SEAT_REMINDER_EMAILS copy', () => {
  const opts = {
    name: 'Sarah Chen',
    claimed: 2,
    cap: 6,
    hubKey: 'CEA-A1B2-C3D4',
    redeemUrl: 'https://portal.concussion-education-australia.com/join-clinic?key=CEA-A1B2-C3D4',
    clinicName: 'Northside Physio',
  }

  for (const { stage } of HUB_SEAT_REMINDER_STAGES) {
    const tpl = HUB_SEAT_REMINDER_EMAILS[stage]
    const html = tpl.template(opts)
    const subject = tpl.subject(opts.claimed, opts.cap)

    it(`${stage}: subject carries the seat status`, () => {
      expect(subject).toContain(stage === 'day3' ? '2 of 6' : '4')
      expect(subject.toLowerCase()).not.toContain('free')
    })

    it(`${stage}: body has the key, the redeem link, a forward nudge and the seat count`, () => {
      expect(html).toContain(opts.hubKey)
      expect(html).toContain(opts.redeemUrl)
      expect(html.toLowerCase()).toContain('forward')
      expect(html).toContain('2 of 6')
      expect(html).toContain('Northside Physio')
      expect(html).toContain('Hi Sarah,')
    })

    it(`${stage}: never says "free" and keeps the standing unsubscribe footer`, () => {
      expect(html.toLowerCase()).not.toContain('free')
      // {{unsubscribe_url}} placeholder is replaced by the cron before send
      expect(html).toContain('{{unsubscribe_url}}')
      expect(html).toContain('Unsubscribe')
    })
  }

  it('escapes owner-supplied clinic names', () => {
    const html = HUB_SEAT_REMINDER_EMAILS.day3.template({
      ...opts,
      clinicName: '<script>alert(1)</script>',
    })
    expect(html).not.toContain('<script>alert(1)</script>')
  })
})
