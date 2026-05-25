import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * GET /api/admin/early-access-list
 *
 * Returns every row in course_early_access — email, course, source, when.
 * Admin-gated. Use to verify nothing has been missed before launch day.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    // Ensure table exists (lazy create pattern — won't error if empty)
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
    const { rows } = await sql<{ email: string; course_slug: string; source: string | null; signed_up_at: string }>`
      SELECT email, course_slug, source, signed_up_at
      FROM course_early_access
      ORDER BY signed_up_at DESC
    `
    const counts = await sql<{ course_slug: string; count: string }>`
      SELECT course_slug, COUNT(*)::text AS count
      FROM course_early_access
      GROUP BY course_slug
    `
    return NextResponse.json({
      success: true,
      total: rows.length,
      countsByCourse: Object.fromEntries(counts.rows.map((r) => [r.course_slug, parseInt(r.count, 10)])),
      signups: rows,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Query failed' }, { status: 500 })
  }
}
