import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { holdsPracticalDaySeat, holdsOnlineWithoutPracticalDay } from '@/lib/practical-day-seat'
import { CONFIG } from '@/lib/config'

/**
 * HUB PACK MEMBERS ARE ONLINE-ONLY (fixed 2026-08-06).
 *
 * The Clinic Hub Pack sells ONLINE seats. The in-person practical day is a
 * separate A$600/clinician add-on (CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE).
 * Both hub provisioning paths nonetheless write access_level 'full-course' —
 * the repo's marker for "owns a seat at the practical day" — so hub members
 * were badged "Included", told they held CONFIG.COURSE.TOTAL_CPD_POINTS CPD
 * hours, had the add-on CTA suppressed entirely, and could self-serve onto the
 * practical-day roster for free, moving CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD
 * and pushing Zac to book a venue for seats nobody bought.
 *
 * The fix is ONE distinct signal (users.hub_pack_seat_at → hubPackSeat) that
 * every practical-day surface reads. access_level is untouched, so no existing
 * member loses any online access they paid for.
 */

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('holdsPracticalDaySeat', () => {
  it('a real Complete buyer holds the day', () => {
    expect(holdsPracticalDaySeat({ accessLevel: 'full-course' })).toBe(true)
  })

  it('a Hub Pack seat does NOT hold the day, despite full-course access', () => {
    expect(holdsPracticalDaySeat({ accessLevel: 'full-course', hubPackSeat: true })).toBe(false)
  })

  it('an online-only buyer does not hold the day', () => {
    expect(holdsPracticalDaySeat({ accessLevel: 'online-only' })).toBe(false)
  })

  it('a CRM practical buyer holds the day even at preview access', () => {
    // The streams are isolated: a CRM buyer's CCM access_level stays 'preview'.
    expect(holdsPracticalDaySeat({ accessLevel: 'preview', ownsCrmPractical: true })).toBe(true)
  })

  it('a preview/free user never holds the day', () => {
    expect(holdsPracticalDaySeat({ accessLevel: 'preview' })).toBe(false)
    expect(holdsPracticalDaySeat({})).toBe(false)
  })
})

describe('holdsOnlineWithoutPracticalDay — the add-on audience', () => {
  it('includes classic online-only buyers', () => {
    expect(holdsOnlineWithoutPracticalDay({ accessLevel: 'online-only' })).toBe(true)
  })

  it('includes Hub Pack seats — this is what un-suppresses their add-on CTA', () => {
    expect(holdsOnlineWithoutPracticalDay({ accessLevel: 'full-course', hubPackSeat: true })).toBe(true)
  })

  it('excludes real Complete buyers (they already hold the day)', () => {
    expect(holdsOnlineWithoutPracticalDay({ accessLevel: 'full-course' })).toBe(false)
  })

  it('excludes CRM practical owners', () => {
    expect(
      holdsOnlineWithoutPracticalDay({ accessLevel: 'online-only', ownsCrmPractical: true }),
    ).toBe(false)
  })

  it('excludes free users — there is nothing to add on to', () => {
    expect(holdsOnlineWithoutPracticalDay({ accessLevel: 'preview' })).toBe(false)
  })
})

describe('the two hub provisioning paths mark the seat', () => {
  it('/api/hub/redeem stamps hubPackSeat', () => {
    const src = read('app/api/hub/redeem/route.ts')
    expect(src).toMatch(/hubPackSeat:\s*true/)
    // Access level is deliberately unchanged — no member is downgraded.
    expect(src).toContain("accessLevel: 'full-course'")
  })

  it('the Stripe Hub Pack branch stamps hubPackSeat for the buyer', () => {
    const src = read('app/api/webhooks/stripe/route.ts')
    const fn = src.match(/async function handleHubPackPurchase[\s\S]*?\n\}/)?.[0] ?? ''
    expect(fn).toMatch(/hubPackSeat:\s*true/)
  })
})

describe('the practical-day roster excludes hub seats', () => {
  const src = read('lib/users.ts')

  it('every full-course seat branch requires hub_pack_seat_at IS NULL', () => {
    // The three roster queries (practicalDayAttendees × 2 + the no-location
    // board) each test the level twice: once in the WHERE predicate, once in
    // the stream CASE. All six must carry the hub-seat guard. The backfill's
    // own `u.access_level = 'full-course'` filter is a READ and is excluded.
    const roster = src.slice(src.indexOf('export async function practicalDayAttendees'))
    const branches = roster.match(/u\.access_level = 'full-course'[^\n]*/g) ?? []
    expect(branches.length).toBe(6)
    for (const b of branches) {
      expect(b).toContain('hub_pack_seat_at IS NULL')
    }
  })

  it('a CRM practical purchase still counts (the day is shared)', () => {
    expect(src).toContain('OR cp.id IS NOT NULL')
  })

  it('the backfill marks existing rows WITHOUT downgrading access_level', () => {
    const fn = src.match(/async function backfillHubPackSeats[\s\S]*?\n\}/)?.[0] ?? ''
    expect(fn).toContain('SET hub_pack_seat_at = m.created_at')
    // access_level appears ONLY as a read filter, never in the SET clause —
    // the backfill must not downgrade a single existing member.
    const setClause = fn.slice(fn.indexOf('SET '), fn.indexOf('FROM course_hub_members'))
    expect(setClause).not.toContain('access_level')
    // Guarded so a genuine Complete buyer who also sits in a hub is untouched.
    expect(fn).toContain('NOT EXISTS')
    expect(fn).toContain('course_purchases')
  })

  it('a genuine Complete purchase CLEARS the marker (they bought the day)', () => {
    expect(src).toMatch(/WHEN EXCLUDED\.access_level = 'full-course' THEN NULL/)
  })
})

describe('/api/workshop/nominate', () => {
  const src = read('app/api/workshop/nominate/route.ts')

  it('decides the paid seat via the shared predicate, not access_level', () => {
    expect(src).toContain('holdsPracticalDaySeat')
    expect(src).not.toMatch(/holdsPaidSeat = user\.accessLevel === 'full-course'/)
  })

  it('still writes workshop_location ONLY for a real paid seat', () => {
    // The interest-row branch is what a hub seat now falls to.
    expect(src).toContain('INSERT INTO workshop_interest')
    expect(src).toMatch(/if \(!holdsPaidSeat\)/)
  })
})

describe('customer-facing claims', () => {
  it('/learning gates the 16-CPD line on a real practical-day seat', () => {
    const src = read('app/learning/page.tsx')
    expect(src).toContain('holdsPracticalSeat')
    expect(src).not.toMatch(/Complete your 16 CPD hours/)
    // CPD numbers are always derived (CLAUDE.md).
    expect(src).toContain('CONFIG.COURSE.TOTAL_CPD_POINTS')
  })

  it('the dashboard badges "Included" only for a real seat', () => {
    const src = read('components/dashboard/BentoGrid.tsx')
    const badge = src.match(/\{holdsSeat && \(\s*\n\s*<span[\s\S]{0,200}?Included/)
    expect(badge).toBeTruthy()
    expect(src).not.toMatch(/\{isFullCourse && \(/)
  })

  it('the add-on price on every hub surface derives from CONFIG', () => {
    for (const p of ['components/dashboard/BentoGrid.tsx', 'components/dashboard/Sidebar.tsx']) {
      const src = read(p)
      expect(src).toContain('CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE')
      expect(src).not.toMatch(/A\$600/)
    }
    // Sanity: the constant is the clinic add-on, not the solo upgrade.
    expect(CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE).toBeGreaterThan(0)
    expect(CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE).not.toBe(
      CONFIG.COURSE.PRICE_EARLY_BIRD - CONFIG.COURSE.PRICE_ONLINE,
    )
  })

  it('the certificate email does not tell a hub seat their workshop is included', () => {
    const src = read('app/api/certificate/route.ts')
    expect(src).toMatch(/userAccessLevel === 'full-course' && !opts\.hubPackSeat/)
  })

  it('workshop nurture lanes do not treat a hub seat as holding a seat', () => {
    const src = read('app/api/cron/send-nurture-emails/route.ts')
    expect(src).toContain('holdsPracticalDaySeat')
  })
})
