/**
 * Secure-your-seat deposit → credit against Complete / Workshop Upgrade.
 *
 * The A$100 deposit is sold with an explicit written promise, in two places
 * the buyer sees before paying:
 *   - the Stripe product description ("Credit toward Complete when the date
 *     opens"), and
 *   - the on-page copy above the button ("credited in full to Complete when
 *     you enrol", app/melbourne-nov7/page.tsx).
 *
 * Until 2026-09-29 nothing implemented it. `upgradePriceFor()` returned a flat
 * A$693 with no lookup, so a deposit holder who upgraded paid A$1,290 against
 * an A$1,190 course — an overcharge against a promise in the product
 * description they bought. Found when the first real deposit landed.
 *
 * The credit is applied SERVER-SIDE at checkout, inside the same function that
 * sets the charge, so the amount displayed on the Stripe page and the amount
 * captured cannot drift (the repo rule: display and charge derive from one
 * source).
 *
 * Two safety properties:
 *   - It credits the amount ACTUALLY CHARGED for the deposit, read from
 *     `course_purchases.amount_aud` — never a hardcoded 100 — so a deposit
 *     taken at a different price, or in another currency, cannot over-credit.
 *   - It is consumed exactly once. `credited_at` is stamped by the webhook
 *     when the upgrade/Complete purchase completes, and a stamped row is
 *     invisible to `secureSeatCreditCents()` from then on.
 */

import { sql } from './db'
import { ensureCoursePurchasesTable } from './course-purchases'

export const SECURE_SEAT_SLUG = 'ccm-secure-seat'

/** Course types whose price the deposit is credited against. */
export const CREDITABLE_COURSE_TYPES = ['full-course', 'workshop-upgrade'] as const
export type CreditableCourseType = (typeof CREDITABLE_COURSE_TYPES)[number]

export function isCreditableCourseType(t: string): t is CreditableCourseType {
  return (CREDITABLE_COURSE_TYPES as readonly string[]).includes(t)
}

let columnEnsured = false
async function ensureCreditedColumn(): Promise<void> {
  if (columnEnsured) return
  await ensureCoursePurchasesTable()
  await sql`ALTER TABLE course_purchases ADD COLUMN IF NOT EXISTS credited_at TIMESTAMPTZ`
  columnEnsured = true
}

/**
 * Cents of deposit credit this email can still apply, or 0.
 *
 * Returns 0 — never throws — on any database problem. A failed lookup must not
 * block a sale; the worst case is that the credit is missed on one checkout and
 * the deposit stays available for the next attempt, which is recoverable.
 * Charging someone for a course they cannot buy is not.
 *
 * AUD only: the deposit lane is domestic, and crediting a USD deposit against
 * an AUD charge would be a currency bug rather than a discount.
 */
export async function secureSeatCreditCents(email?: string | null): Promise<number> {
  if (!email) return 0
  try {
    await ensureCreditedColumn()
    const { rows } = await sql<{ amount_aud: number }>`
      SELECT amount_aud
      FROM course_purchases
      WHERE LOWER(user_email) = LOWER(${email})
        AND course_slug = ${SECURE_SEAT_SLUG}
        AND credited_at IS NULL
        AND UPPER(COALESCE(currency, 'AUD')) = 'AUD'
      ORDER BY purchased_at
      LIMIT 1
    `
    const dollars = rows[0]?.amount_aud
    if (!dollars || dollars <= 0) return 0
    return Math.round(dollars * 100)
  } catch (err) {
    console.error('[secure-seat-credit] lookup failed — proceeding without credit:', err)
    return 0
  }
}

/**
 * Mark the deposit consumed. Called from the Stripe webhook once the
 * upgrade/Complete purchase is confirmed paid — never at session creation,
 * because an abandoned checkout must leave the credit available.
 *
 * Idempotent: the `credited_at IS NULL` guard means a replayed webhook stamps
 * nothing the second time. Returns true only when this call consumed it.
 */
export async function consumeSecureSeatCredit(
  email: string,
  stripeSessionId?: string | null,
): Promise<boolean> {
  try {
    await ensureCreditedColumn()
    const { rowCount } = await sql`
      UPDATE course_purchases
      SET credited_at = NOW()
      WHERE id = (
        SELECT id FROM course_purchases
        WHERE LOWER(user_email) = LOWER(${email})
          AND course_slug = ${SECURE_SEAT_SLUG}
          AND credited_at IS NULL
          AND UPPER(COALESCE(currency, 'AUD')) = 'AUD'
        ORDER BY purchased_at
        LIMIT 1
      )
    `
    if (rowCount) {
      console.log(`[secure-seat-credit] consumed for ${email} (session ${stripeSessionId ?? 'n/a'})`)
    }
    return Boolean(rowCount)
  } catch (err) {
    // Log loudly: the charge already carried the discount, so a failure here
    // leaves the deposit re-creditable. It is a revenue leak, not a customer
    // problem, and it must be visible.
    console.error('[secure-seat-credit] FAILED TO CONSUME — deposit still creditable:', email, err)
    return false
  }
}

/** Everyone holding an unconsumed deposit, for the balance-request email. */
export async function openSecureSeatDeposits(): Promise<
  { email: string; amountAud: number; purchasedAt: string }[]
> {
  try {
    await ensureCreditedColumn()
    const { rows } = await sql<{ user_email: string; amount_aud: number; purchased_at: string }>`
      SELECT user_email, amount_aud, purchased_at
      FROM course_purchases
      WHERE course_slug = ${SECURE_SEAT_SLUG} AND credited_at IS NULL
      ORDER BY purchased_at
    `
    return rows.map(r => ({
      email: r.user_email,
      amountAud: r.amount_aud,
      purchasedAt: String(r.purchased_at),
    }))
  } catch (err) {
    console.error('[secure-seat-credit] openSecureSeatDeposits failed:', err)
    return []
  }
}
