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
  amount_aud: number
  purchased_at: string
}

async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS course_purchases (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      course_slug TEXT NOT NULL,
      stripe_session_id TEXT,
      amount_aud INTEGER NOT NULL,
      purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_email, course_slug)
    )
  `
}

export async function recordCoursePurchase(args: {
  email: string
  courseSlug: string
  stripeSessionId: string
  amountAud: number
}): Promise<number> {
  await ensureTable()
  const email = args.email.trim().toLowerCase()
  const { rows } = await sql`
    INSERT INTO course_purchases (user_email, course_slug, stripe_session_id, amount_aud)
    VALUES (${email}, ${args.courseSlug}, ${args.stripeSessionId}, ${args.amountAud})
    ON CONFLICT (user_email, course_slug) DO UPDATE
      SET stripe_session_id = EXCLUDED.stripe_session_id,
          amount_aud = EXCLUDED.amount_aud
    RETURNING id
  `
  return rows[0]?.id ?? 0
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
