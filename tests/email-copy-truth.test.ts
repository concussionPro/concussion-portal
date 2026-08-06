/**
 * Email copy + opt-out guards (2026-08-06 email audit).
 *
 * Every claim a lifecycle email makes has to derive from lib/config.ts or the
 * course catalogue, and every marketing lane has to carry a real opt-out.
 * These lock in the specific regressions the audit found rather than restating
 * the rules in prose:
 *
 *  - the Complete Course was quoted at PRICE_REGULAR ($1,400) in five emails
 *    while every buyer is actually charged PRICE_EARLY_BIRD ($1,190);
 *  - the AI course was described as "3 CPD hours" after the catalogue was
 *    corrected to 2;
 *  - a retired "12-month certificate" validity claim survived in an email
 *    after being removed from the web pages;
 *  - an unsubscribe whose master-blacklist write failed still reported success;
 *  - two cold-outreach lanes in lib/ shipped with no List-Unsubscribe (the
 *    admin-send-lane-suppression walk only covers app/api).
 */
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')

beforeAll(() => {
  // signSurveyAnswer() refuses to run without a secret; the value is irrelevant
  // here because we only inspect rendered copy.
  process.env.SESSION_SECRET ||= 'email-copy-truth-test-secret'
})

describe('workshop price copy derives from the charged price, not the sticker', () => {
  const src = read('lib/email-sequences.ts')

  it('the file it scans still contains the thing being policed', () => {
    // Non-vacuity. This guard filters lines interpolating PRICE_REGULAR and
    // asserts the survivors are none. If PRICE_REGULAR stopped appearing in
    // this file at all — renamed constant, templates moved elsewhere — the
    // filter returns empty and the guard reports a pass while policing nothing.
    // (Register F sweep, 2026-08-06.)
    expect(src).toMatch(/\$\{CONFIG\.COURSE\.PRICE_REGULAR/)
    expect(src.length).toBeGreaterThan(10_000)
  })

  it('no template presents CONFIG.COURSE.PRICE_REGULAR as the Complete Course price', () => {
    // PRICE_REGULAR is legitimate only as the "then A$1,400" half of an
    // early-bird sentence, which completeCourseCaveat() owns. Any other
    // interpolation is quoting a price nobody is charged today.
    const offenders = src
      .split('\n')
      .map((line, i) => ({ line, n: i + 1 }))
      // only interpolations into copy count; comparisons and comments do not
      .filter(({ line }) => line.includes('${CONFIG.COURSE.PRICE_REGULAR'))
      .filter(({ line }) => !/then A\$/.test(line))
    expect(
      offenders,
      `quote workshopPriceFor()/completeCoursePrice() instead:\n${offenders.map((o) => `  L${o.n}: ${o.line.trim()}`).join('\n')}`,
    ).toEqual([])
  })

  it('completeCoursePrice() tracks workshopPriceFor()', async () => {
    const { workshopPriceFor, CONFIG } = await import('@/lib/config')
    // Nothing is 'confirmed' with a future date, so early bird is universal.
    expect(workshopPriceFor()).toBe(CONFIG.COURSE.PRICE_EARLY_BIRD)
    const { SCAT_MASTERY_SEQUENCE } = await import('@/lib/email-sequences')
    const d42 = SCAT_MASTERY_SEQUENCE.find((e) => e.day === 42)!
    const html = d42.template('Sarah Chen', 'https://portal.concussion-education-australia.com/pricing')
    expect(html).toContain(`A$${workshopPriceFor().toLocaleString('en-AU')}`)
  })
})

describe('CPD claims derive from the catalogue', () => {
  it('the AI course emails quote the catalogue cpdHours, not a literal', async () => {
    const { findCourse } = await import('@/lib/ai-course/provider-catalogue')
    const hours = findCourse('ai-in-clinical-practice')!.cpdHours
    const { AI_COURSE_LAUNCH_BLAST, AI_SAFETY_CHECKLIST_DAY14 } = await import('@/lib/email-sequences')
    for (const tpl of [AI_COURSE_LAUNCH_BLAST, AI_SAFETY_CHECKLIST_DAY14]) {
      const html = tpl.template('Sarah', 'https://portal.concussion-education-australia.com/courses/ai-in-clinical-practice')
      expect(html).toContain(`${hours} CPD hours`)
      expect(html, 'stale hardcoded CPD figure').not.toMatch(/\b3 CPD hours\b/)
    }
  })
})

describe('accreditation is attached to the right stream', () => {
  it('EP/CRM emails never foot Osteopathy Australia (that endorsement is the CCM course)', async () => {
    const S = await import('@/lib/email-sequences')
    const LINK = 'https://portal.concussion-education-australia.com/concussion-rehab-mastery'
    const ep: string[] = [
      ...S.CRM_POST_PURCHASE_SEQUENCE.map((e) => e.template('Sarah', LINK)),
      ...S.EP_NURTURE_SEQUENCE.map((e) => e.template('Sarah', LINK)),
      S.CRM_NO_PROGRESS_NUDGE.template('Sarah', LINK),
      S.CRM_ALMOST_DONE_EMAIL.template('Sarah', LINK),
    ]
    for (const html of ep) {
      expect(html, 'OA endorses CCM, not the EP stream').not.toContain('Endorsed by Osteopathy Australia')
    }
  })

  it('CCM emails keep the Osteopathy Australia endorsement', async () => {
    const { POST_PURCHASE_SEQUENCE } = await import('@/lib/email-sequences')
    const html = POST_PURCHASE_SEQUENCE[0].template('Sarah', 'https://x/y')
    expect(html).toContain('Endorsed by Osteopathy Australia')
  })
})

describe('retired claims do not survive in email copy', () => {
  const EMAIL_SOURCES = [
    'lib/email-sequences.ts',
    'lib/resend-client.ts',
    'app/api/webhooks/stripe/route.ts',
    'app/api/certificate/route.ts',
  ]

  it('no email asserts a 12-month certificate validity', () => {
    // Certificates carry no expiry — lib/course-certificates.ts actively
    // clears any legacy expires_at so age can never read as invalidity.
    for (const rel of EMAIL_SOURCES) {
      expect(read(rel), `${rel} still claims a 12-month certificate`).not.toMatch(
        /12[- ]month certificate|certificate.{0,20}valid for 12/i,
      )
    }
  })
})

describe('no lifecycle email can render a broken merge field', () => {
  it('an empty name never produces "Hi ,"', async () => {
    const S = await import('@/lib/email-sequences')
    const LINK = 'https://portal.concussion-education-australia.com/api/auth/verify?token=T'
    const rendered: string[] = []
    for (const seq of [
      S.POST_PURCHASE_SEQUENCE,
      S.SCAT_MASTERY_SEQUENCE,
      S.CRM_POST_PURCHASE_SEQUENCE,
      S.EP_NURTURE_SEQUENCE,
      S.ONLINE_UPGRADE_SEQUENCE,
      S.REFERENCE_UPGRADE_SEQUENCE,
    ]) {
      for (const e of seq as Array<{ template: (n: string, l: string) => string }>) {
        rendered.push(e.template('', LINK))
      }
    }
    for (const e of S.ABANDONED_CHECKOUT_SEQUENCE) rendered.push(e.template('', undefined))
    for (const tpl of [
      S.REENGAGEMENT_EMAIL, S.FREE_USER_REENGAGEMENT, S.FREE_LOGGED_IN_NO_PROGRESS,
      S.PDF_LEAD_TOOLS, S.FREE_ALMOST_DONE, S.PAID_NO_PROGRESS_NUDGE, S.ALMOST_DONE_EMAIL,
      S.CRM_NO_PROGRESS_NUDGE, S.CRM_ALMOST_DONE_EMAIL, S.COMPLETER_CONVERT_PRICE,
      S.COMPLETER_CONVERT_RELEVANCE, S.SCAT_COMPLETION_UPSELL, S.MELBOURNE_WORKSHOP_PUSH,
      S.MELBOURNE_EARLY_BIRD_LAST_CALL, S.AI_COURSE_LAUNCH_BLAST, S.AI_SAFETY_CHECKLIST_DAY0,
      S.AI_SAFETY_CHECKLIST_DAY3, S.AI_SAFETY_CHECKLIST_DAY14,
    ]) {
      rendered.push(tpl.template('', LINK))
    }

    for (const html of rendered) {
      const text = html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
      expect(text, 'empty greeting — use greetingName()').not.toMatch(/\b(Hi|Hello)\s+,/)
      expect(text).not.toMatch(/\bundefined\b|\bNaN\b/)
    }
  })

  it('the Afterpay instalment is never interpolated as a bare number', () => {
    const src = read('lib/email-sequences.ts')
    // afterpayInstalment() returns "111.75" with no currency and no sentence.
    // afterpayLine() itself renders "A$${afterpayInstalment(price)}"; anything
    // else interpolating it without a currency prefix is the bare-number bug.
    const bare = [...src.matchAll(/(.{0,3})\$\{[^}]*\bafterpayInstalment\(/g)]
      .filter((m) => !m[1].endsWith('A$'))
      .map((m) => m[0])
    expect(bare, 'wrap it in afterpayLine()').toEqual([])
  })
})

describe('cold-outreach personalisation cannot mislabel the recipient', () => {
  it('dominantDiscipline can actually return every discipline it accepts', async () => {
    const { dominantDiscipline } = await import('@/lib/prospect/pricing')
    const zero = {
      osteopaths: 0, physiotherapists: 0, chiropractors: 0, generalPractitioners: 0,
      sportsMedicineDoctors: 0, exercisePhys: 0, myotherapists: 0, remedialMassage: 0,
      practiceManager: 0, admin: 0,
    }
    for (const d of Object.keys(zero) as Array<keyof typeof zero>) {
      // A clinic that is ONLY this discipline must resolve to it. 'chiropractors'
      // was missing from the ranking array, so chiro clinics silently resolved
      // to 'osteopaths' and were told "most osteos in <city> aren't set up yet".
      expect(dominantDiscipline({ ...zero, [d]: 5 }), `${d} is unreachable`).toBe(d)
    }
  })

  it('partner greetings never render a title or a role word as a first name', async () => {
    const { partnerFirstName } = await import('@/app/api/cron/partner-process-scheduled/route')
    expect(partnerFirstName('Dr Michael Rowe')).toBe('Michael')
    expect(partnerFirstName('Prof. Anna Lee')).toBe('Anna')
    expect(partnerFirstName('Head of Sport')).toBe('there')
    expect(partnerFirstName('Reception')).toBe('there')
    expect(partnerFirstName('John (Director)')).toBe('John')
    expect(partnerFirstName('')).toBe('there')
    expect(partnerFirstName(null)).toBe('there')
  })
})

describe('opt-out plumbing', () => {
  it('unsubscribeUser does not swallow the email_suppression write', () => {
    const src = read('lib/users.ts')
    // A swallowed INSERT reported success while leaving the address off the
    // master blacklist — reachable by every prospect/partner/cold lane.
    expect(src).not.toMatch(
      /\[unsubscribeUser\] email_suppression insert failed|\[updateUserProfile\] email_suppression insert failed/,
    )
    const fn = src.slice(src.indexOf('export async function unsubscribeUser'))
    const body = fn.slice(0, fn.indexOf('\n}\n') + 3)
    expect(body).toContain('INSERT INTO email_suppression')
    expect(body, 'the suppression INSERT must not sit inside a try/catch').not.toContain('catch')
  })

  it('cold-outreach lanes outside app/api carry List-Unsubscribe', () => {
    // The admin-send-lane-suppression walk only covers app/api, so these two
    // shipped with "reply STOP" as the only opt-out.
    for (const rel of ['lib/aus-neuro-outreach.ts', 'lib/prospect/process-scheduled.ts']) {
      expect(read(rel), `${rel} sends cold mail with no List-Unsubscribe`).toMatch(/List-Unsubscribe/)
    }
  })

  it('the ACC follow-up blast carries one-click unsubscribe', () => {
    const src = read('app/api/admin/acc-followup/route.ts')
    expect(src).toMatch(/List-Unsubscribe/)
    expect(src).toMatch(/List-Unsubscribe-Post/)
  })
})
