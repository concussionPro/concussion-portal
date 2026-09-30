/**
 * An email that quotes the UPGRADE price must link to the upgrade checkout.
 *
 * Found 2026-09-30: the deposit-balance email quoted Lilly Nolte a A$593
 * balance and linked to /melbourne-nov7, whose primary CTA charges
 * 'full-course' — the whole A$1,190. She already owned the A$497 online
 * course, so following the email would have billed A$1,587 for an A$1,190
 * course. The credit worked; the destination did not.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const cron = readFileSync(join(process.cwd(), 'app/api/cron/send-nurture-emails/route.ts'), 'utf8')

/** One cron section, from its `// ── n.` header to the next one. */
const block = (name: string) => {
  const i = cron.indexOf(name)
  expect(i, `${name} not found`).toBeGreaterThan(-1)
  const next = cron.indexOf('// ── ', i + name.length)
  return cron.slice(i, next > -1 ? next : i + 6000)
}

describe('priced upgrade emails link to the upgrade checkout', () => {
  it('the deposit-balance lane sends online owners to /upgrade, not the date page', () => {
    const b = block('2b. Secure-seat deposit')
    expect(b).toContain('/upgrade')
    // the date page may still appear, but only as the branch for someone who
    // owns nothing yet
    // the date page may still appear, but only as the final branch for someone
    // who owns nothing yet — the two preceding branches must be the owners
    const idx = b.indexOf('workshopDatePage(')
    if (idx > -1) {
      const ternary = b.slice(b.lastIndexOf('const checkoutLink', idx), idx)
      expect(ternary).toContain("'online-only'")
      expect(ternary).toContain('ownsCrmCourse')
    }
  })

  it('the upgrade-offer lane never points at the full-course date page', () => {
    const b = block('2c. Online owner')
    expect(b).toContain('/upgrade')
    expect(b).toContain('/concussion-rehab-mastery')
    expect(b).not.toContain('workshopDatePage')
  })

  it('a CCM user with a confirmed city is not in both upgrade lanes', () => {
    // ONLINE_UPGRADE_SEQUENCE is signup-anchored and generic; 2c is
    // deadline-anchored and priced. Both firing is two upgrade asks.
    expect(cron).toContain('cityConfirmed ? null : findCatchUp(ONLINE_UPGRADE_SEQUENCE')
  })

  it('deposit holders are excluded from the generic upgrade offer', () => {
    expect(block('2c. Online owner')).toContain('depositHolders.has')
  })
})
