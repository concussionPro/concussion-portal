/**
 * Per-course ownership tracking for short courses (AI in Clinical
 * Practice, Vagus Nerve, future monthly drops). Sits alongside the
 * existing user.accessLevel which gates the full CCM flagship.
 *
 * One row per (email, course-slug) purchase. Idempotent on the unique
 * constraint so re-running a webhook is safe.
 */

import { sql } from './db'

export interface CoursePurchase {
  id: number
  user_email: string
  course_slug: string
  stripe_session_id: string | null
  /**
   * Amount ACTUALLY CHARGED, in `currency` — NOT necessarily AUD. The column
   * name is historical (it predates the international CRM lane, which charges
   * USD): a USD 347 international sale used to land here as `347` with nothing
   * saying it wasn't dollars-Australian, so any bare SUM() over this column
   * added USD to AUD. Never sum this column without grouping by `currency` —
   * use revenueByCurrency() below.
   */
  amount_aud: number
  /** ISO-4217 code of the charge ('AUD', 'USD', …). Rows written before the
   *  column existed are AUD — that is what the DEFAULT backfills. */
  currency: string
  purchased_at: string
}

// Per-process memo: the table is created once per cold start, not once per
// call. practicalDayAttendees() (lib/users.ts) runs this on hot paths — the
// workshop seat board loops it per city and the nurture cron per user — so a
// CREATE TABLE round-trip on every call is pure waste.
let tableEnsured = false

async function ensureTable(): Promise<void> {
  if (tableEnsured) return
  await sql`
    CREATE TABLE IF NOT EXISTS course_purchases (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      course_slug TEXT NOT NULL,
      stripe_session_id TEXT,
      amount_aud INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'AUD',
      purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_email, course_slug)
    )
  `
  // Lazy migration for tables created before the column existed. DEFAULT 'AUD'
  // is correct for every existing row: the only non-AUD lane (international
  // CRM, USD) went live 2026-07-26 and every row before this migration was
  // charged in AUD.
  await sql`ALTER TABLE course_purchases ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'AUD'`
  tableEnsured = true
}

/**
 * Public form of ensureTable — for callers that read `course_purchases` with
 * their OWN raw SQL (the practical-day roster, the CRM ownership maps) and
 * would otherwise 42P01 on a database where nothing has written a purchase yet.
 */
export function ensureCoursePurchasesTable(): Promise<void> {
  return ensureTable()
}

/**
 * `currency` is REQUIRED — pass Stripe's `session.currency` (upper-cased), not
 * an assumption. Before this it was implicit AUD, so the USD international CRM
 * sale was written into an AUD-named column and became indistinguishable from
 * an AUD one.
 */
export async function recordCoursePurchase(args: {
  email: string
  courseSlug: string
  stripeSessionId: string
  /** Amount charged, in `currency` — major units (dollars, not cents). */
  amount: number
  /** ISO-4217, e.g. 'AUD' | 'USD'. */
  currency: string
}): Promise<number> {
  await ensureTable()
  const email = args.email.trim().toLowerCase()
  const currency = (args.currency || 'AUD').trim().toUpperCase()
  const { rows } = await sql`
    INSERT INTO course_purchases (user_email, course_slug, stripe_session_id, amount_aud, currency)
    VALUES (${email}, ${args.courseSlug}, ${args.stripeSessionId}, ${Math.round(args.amount)}, ${currency})
    ON CONFLICT (user_email, course_slug) DO UPDATE
      SET stripe_session_id = EXCLUDED.stripe_session_id,
          amount_aud = EXCLUDED.amount_aud,
          currency = EXCLUDED.currency
    RETURNING id
  `
  return rows[0]?.id ?? 0
}

/**
 * Ledger revenue, SPLIT BY CURRENCY. The only safe way to total this table:
 * a bare SUM(amount_aud) silently adds USD 347 to AUD 1,400 and reports 1,747
 * of nothing. Callers must render each currency separately (or convert with a
 * rate they can name) — never add the values together here.
 */
export async function revenueByCurrency(
  since?: Date,
): Promise<Array<{ currency: string; total: number; purchases: number }>> {
  await ensureTable()
  const { rows } = since
    ? await sql<{ currency: string; total: string; purchases: string }>`
        SELECT currency, SUM(amount_aud)::text AS total, COUNT(*)::text AS purchases
        FROM course_purchases
        WHERE purchased_at >= ${since.toISOString()}
        GROUP BY currency
        ORDER BY currency
      `
    : await sql<{ currency: string; total: string; purchases: string }>`
        SELECT currency, SUM(amount_aud)::text AS total, COUNT(*)::text AS purchases
        FROM course_purchases
        GROUP BY currency
        ORDER BY currency
      `
  return rows.map((r) => ({
    currency: r.currency,
    total: Number(r.total ?? 0),
    purchases: Number(r.purchases ?? 0),
  }))
}

export async function userOwnsCourse(email: string, courseSlug: string): Promise<boolean> {
  if (!email || !courseSlug) return false
  await ensureTable()
  const normalised = email.trim().toLowerCase()
  const { rows } = await sql`
    SELECT 1 FROM course_purchases
    WHERE user_email = ${normalised} AND course_slug = ${courseSlug}
    LIMIT 1
  `
  return rows.length > 0
}

export async function getOwnedCourses(email: string): Promise<string[]> {
  if (!email) return []
  await ensureTable()
  const normalised = email.trim().toLowerCase()
  const { rows } = await sql<{ course_slug: string }>`
    SELECT course_slug FROM course_purchases
    WHERE user_email = ${normalised}
    ORDER BY purchased_at DESC
  `
  return rows.map((r) => r.course_slug)
}
