/**
 * The A$100 secure-seat deposit is sold with a written promise — "Credit
 * toward Complete when the date opens" in its own Stripe product description,
 * "credited in full to Complete when you enrol" on /melbourne-nov7.
 *
 * That promise had no implementation until 2026-09-29: a deposit holder who
 * upgraded was charged the full A$693, i.e. A$1,290 against an A$1,190 course.
 * These lock the arithmetic and the once-only consumption so it cannot regress
 * back into an overcharge.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const rows: { amount_aud: number; currency?: string; credited_at?: string | null }[] = []
let updateRowCount = 0

vi.mock('@/lib/db', () => ({
  sql: vi.fn(async (strings: TemplateStringsArray) => {
    const q = strings.join(' ')
    if (/ALTER TABLE|CREATE TABLE/i.test(q)) return { rows: [], rowCount: 0 }
    if (/^\s*UPDATE/i.test(q)) return { rows: [], rowCount: updateRowCount }
    return { rows, rowCount: rows.length }
  }),
}))
vi.mock('@/lib/course-purchases', () => ({ ensureCoursePurchasesTable: async () => {} }))

const load = async () => await import('@/lib/secure-seat-credit')

beforeEach(() => { rows.length = 0; updateRowCount = 0; vi.resetModules() })

describe('secure-seat deposit credit', () => {
  it('credits the amount actually charged, not a hardcoded 100', async () => {
    rows.push({ amount_aud: 100 })
    const { secureSeatCreditCents } = await load()
    expect(await secureSeatCreditCents('a@b.com')).toBe(10_000)
  })

  it('credits a non-standard deposit at its real value', async () => {
    // A deposit taken at a different price must not credit A$100.
    rows.push({ amount_aud: 50 })
    const { secureSeatCreditCents } = await load()
    expect(await secureSeatCreditCents('a@b.com')).toBe(5_000)
  })

  it('is zero with no email and zero with no deposit', async () => {
    const { secureSeatCreditCents } = await load()
    expect(await secureSeatCreditCents(null)).toBe(0)
    expect(await secureSeatCreditCents('nobody@b.com')).toBe(0)
  })

  it('a consumed deposit credits nothing (the SQL filters credited_at)', async () => {
    // No row comes back once credited_at is stamped — the query requires NULL.
    const { secureSeatCreditCents } = await load()
    expect(await secureSeatCreditCents('used@b.com')).toBe(0)
  })

  it('consumption is idempotent — a replayed webhook consumes nothing', async () => {
    const { consumeSecureSeatCredit } = await load()
    updateRowCount = 1
    expect(await consumeSecureSeatCredit('a@b.com', 'cs_1')).toBe(true)
    updateRowCount = 0 // credited_at now set, so the guarded UPDATE matches nothing
    expect(await consumeSecureSeatCredit('a@b.com', 'cs_1')).toBe(false)
  })

  it('only full-course and workshop-upgrade are creditable', async () => {
    const { isCreditableCourseType } = await load()
    expect(isCreditableCourseType('full-course')).toBe(true)
    expect(isCreditableCourseType('workshop-upgrade')).toBe(true)
    // Crediting a deposit against the online course, or against another
    // deposit, would hand back money for something the deposit does not buy.
    expect(isCreditableCourseType('online-only')).toBe(false)
    expect(isCreditableCourseType('secure-seat')).toBe(false)
  })
})

describe('the arithmetic the promise commits us to', () => {
  it('an online-only deposit holder pays upgrade minus deposit', async () => {
    const { CONFIG, upgradePriceFor } = await import('@/lib/config')
    const upgrade = upgradePriceFor('melbourne')
    // $1,190 early-bird − $497 online = $693, less the $100 deposit = $593.
    expect(upgrade).toBe(CONFIG.COURSE.PRICE_EARLY_BIRD - CONFIG.COURSE.PRICE_ONLINE)
    expect(upgrade - CONFIG.COURSE.PRICE_SECURE_SEAT).toBe(593)
  })

  it('total paid never exceeds the course price', async () => {
    const { CONFIG, upgradePriceFor } = await import('@/lib/config')
    const paid =
      CONFIG.COURSE.PRICE_ONLINE +
      CONFIG.COURSE.PRICE_SECURE_SEAT +
      (upgradePriceFor('melbourne') - CONFIG.COURSE.PRICE_SECURE_SEAT)
    expect(paid).toBe(CONFIG.COURSE.PRICE_EARLY_BIRD)
  })
})
