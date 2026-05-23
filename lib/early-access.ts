/**
 * Early-access waitlist for coming-soon courses. One row per
 * (email, course_slug). Voters get a launch-week discount code per the
 * catalogue's earlyBirdDiscountPct.
 *
 * Table created lazily on first use. Idempotent insert — re-submitting
 * the same email/course pair is a no-op.
 */

import { sql } from './db'

async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS course_early_access (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      course_slug TEXT NOT NULL,
      signed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      source TEXT,
      UNIQUE (email, course_slug)
    )
  `
}

export async function recordEarlyAccess(args: {
  email: string
  courseSlug: string
  source?: string
}): Promise<{ ok: boolean; alreadySignedUp: boolean }> {
  await ensureTable()
  const email = args.email.trim().toLowerCase()
  if (!email || !args.courseSlug) return { ok: false, alreadySignedUp: false }

  const { rows } = await sql<{ id: number }>`
    INSERT INTO course_early_access (email, course_slug, source)
    VALUES (${email}, ${args.courseSlug}, ${args.source || null})
    ON CONFLICT (email, course_slug) DO NOTHING
    RETURNING id
  `
  return { ok: true, alreadySignedUp: rows.length === 0 }
}

export async function getEarlyAccessCount(courseSlug: string): Promise<number> {
  await ensureTable()
  const { rows } = await sql<{ count: string }>`
    SELECT COUNT(*)::text AS count
    FROM course_early_access
    WHERE course_slug = ${courseSlug}
  `
  return parseInt(rows[0]?.count ?? '0', 10)
}

export async function getAllEarlyAccessCounts(): Promise<Record<string, number>> {
  await ensureTable()
  const { rows } = await sql<{ course_slug: string; count: string }>`
    SELECT course_slug, COUNT(*)::text AS count
    FROM course_early_access
    GROUP BY course_slug
  `
  return Object.fromEntries(rows.map((r) => [r.course_slug, parseInt(r.count, 10)]))
}
