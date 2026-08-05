/**
 * THE REVENUE LEDGER MUST KNOW WHAT CURRENCY IT IS IN — and must contain every
 * sale.
 *
 * Two defects this file locks down:
 *
 *  1. `course_purchases.amount_aud` was written for USD sales too. An
 *     international CRM purchase of USD 347 landed as `347` with nothing beside
 *     it saying which dollars, so any SUM() over the table added USD to AUD and
 *     produced a number that is true of no currency at all.
 *
 *  2. Hub Pack (A$1,497, full clinic team access) returned from its handler
 *     BEFORE the ledger write, so those sales appeared in no revenue view over
 *     the table — and, once recorded, must be removed again on refund so a
 *     refunded hub neither counts as revenue nor shields its owner from the
 *     member-downgrade sweep.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

interface Recorded { text: string; values: unknown[] }
const statements: Recorded[] = []
const rowsFor = new Map<RegExp, Array<Record<string, unknown>>>()

function fakeSql(strings: TemplateStringsArray, ...values: unknown[]) {
  const text = strings.join('?').replace(/\s+/g, ' ').trim()
  statements.push({ text, values })
  for (const [re, rows] of rowsFor) {
    if (re.test(text)) return Promise.resolve({ rows })
  }
  return Promise.resolve({ rows: [] })
}

vi.mock('@/lib/db', () => ({ sql: fakeSql }))
vi.mock('@vercel/postgres', () => ({ sql: fakeSql }))

beforeEach(() => {
  statements.length = 0
  rowsFor.clear()
})

const WEBHOOK = readFileSync(
  join(__dirname, '..', 'app', 'api', 'webhooks', 'stripe', 'route.ts'),
  'utf8',
)

describe('course_purchases carries the currency it was charged in', () => {
  it('adds the column lazily, defaulting existing rows to AUD', async () => {
    const { recordCoursePurchase } = await import('@/lib/course-purchases')
    await recordCoursePurchase({
      email: 'A@Clinic.com',
      courseSlug: 'crm',
      stripeSessionId: 'cs_1',
      amount: 347,
      currency: 'usd',
    })
    const migration = statements.find((s) => /ALTER TABLE course_purchases ADD COLUMN IF NOT EXISTS currency/i.test(s.text))
    expect(migration, 'lazy migration must run for tables created before the column').toBeTruthy()
    expect(migration!.text).toMatch(/NOT NULL DEFAULT 'AUD'/i)
  })

  it('records USD as USD — never as an AUD-shaped number', async () => {
    const { recordCoursePurchase } = await import('@/lib/course-purchases')
    await recordCoursePurchase({
      email: 'buyer@example.com',
      courseSlug: 'crm',
      stripeSessionId: 'cs_intl',
      amount: 347,
      currency: 'usd',
    })
    const insert = statements.find((s) => /^INSERT INTO course_purchases/i.test(s.text))!
    expect(insert.text).toMatch(/\(user_email, course_slug, stripe_session_id, amount_aud, currency\)/)
    expect(insert.values).toContain('USD')
    expect(insert.values).toContain(347)
    // A webhook retry must not flip a recorded USD sale back to a default.
    expect(insert.text).toMatch(/DO UPDATE[\s\S]*currency = EXCLUDED\.currency/i)
  })

  it('AUD sales are unchanged', async () => {
    const { recordCoursePurchase } = await import('@/lib/course-purchases')
    await recordCoursePurchase({
      email: 'buyer@example.com',
      courseSlug: 'ccm-complete',
      stripeSessionId: 'cs_aud',
      amount: 1400,
      currency: 'AUD',
    })
    const insert = statements.find((s) => /^INSERT INTO course_purchases/i.test(s.text))!
    expect(insert.values).toContain('AUD')
    expect(insert.values).toContain(1400)
  })

  it('revenue is only ever reported PER CURRENCY, never as one total', async () => {
    rowsFor.set(/SELECT currency, SUM\(amount_aud\)/i, [
      { currency: 'AUD', total: '2897', purchases: '2' },
      { currency: 'USD', total: '347', purchases: '1' },
    ])
    const { revenueByCurrency } = await import('@/lib/course-purchases')
    const rows = await revenueByCurrency()
    expect(rows).toEqual([
      { currency: 'AUD', total: 2897, purchases: 2 },
      { currency: 'USD', total: 347, purchases: 1 },
    ])
    const q = statements.find((s) => /SELECT currency, SUM\(amount_aud\)/i.test(s.text))!
    expect(q.text).toMatch(/GROUP BY currency/i)
  })

  it('every webhook ledger write states its currency', () => {
    const calls = WEBHOOK.match(/recordCoursePurchase\(\s*\{[\s\S]*?\}\s*\)/g) ?? []
    expect(calls.length).toBeGreaterThanOrEqual(5)
    for (const call of calls) {
      expect(call, `ledger write without a currency:\n${call}`).toMatch(/currency/)
      expect(call, `ledger write still using the AUD-assuming arg:\n${call}`).not.toMatch(/amountAud\s*:/)
    }
  })
})

describe('Hub Pack sales reach the revenue ledger', () => {
  it('the hub handler records the sale before it returns', () => {
    const handler = WEBHOOK.slice(
      WEBHOOK.indexOf('async function handleHubPackPurchase'),
      WEBHOOK.indexOf('async function handleBookPurchase'),
    )
    expect(handler.length).toBeGreaterThan(0)
    expect(handler).toMatch(/recordCoursePurchase\(/)
    // Recorded with the real charge + its currency, not a hardcoded price.
    const call = handler.match(/recordCoursePurchase\(\s*\{[\s\S]*?\}\s*\)/)![0]
    expect(call).toMatch(/amount,/)
    expect(call).toMatch(/currency,/)
    expect(call).toMatch(/stripeSessionId: session\.id/)
  })

  it('uses a per-session slug, so a second hub is a second row (and a retry is not)', () => {
    expect(WEBHOOK).toMatch(/const HUB_PACK_SLUG_PREFIX = 'ccm-hub-pack-'/)
    expect(WEBHOOK).toMatch(/\$\{HUB_PACK_SLUG_PREFIX\}\$\{session\.id\.slice\(-8\)\}/)
    // Must NOT collide with the practical-day roster prefix.
    expect('ccm-hub-pack-'.startsWith('ccm-complete')).toBe(false)
  })

  it('a refunded hub is deleted from the ledger BEFORE the member downgrade runs', () => {
    const refundBlock = WEBHOOK.slice(
      WEBHOOK.indexOf("if (courseType === 'clinic-hub-pack'"),
      WEBHOOK.indexOf("if (productType === 'crm-course' || productType === 'crm-upgrade')"),
    )
    expect(refundBlock.length).toBeGreaterThan(0)
    const deleteAt = refundBlock.search(/DELETE FROM course_purchases/)
    const downgradeAt = refundBlock.search(/UPDATE users SET access_level/)
    expect(deleteAt, 'refunded hub must be removed from the ledger').toBeGreaterThan(-1)
    expect(downgradeAt).toBeGreaterThan(-1)
    // Order matters: the downgrade guard treats any surviving course_purchases
    // row as an independent purchase and would leave the refunded buyer at
    // full-course forever.
    expect(deleteAt).toBeLessThan(downgradeAt)
    expect(refundBlock).toMatch(/DELETE FROM course_purchases[\s\S]*stripe_session_id = \$\{chargeSessionId\}/)
  })
})
