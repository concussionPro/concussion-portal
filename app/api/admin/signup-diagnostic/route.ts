import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * GET /api/admin/signup-diagnostic
 *
 * Diagnostic: surfaces signups per day for the last 30 days, grouped by
 * signupSource. Used to identify when + where the 90% WoW signup drop
 * happened.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    // Per-day count for last 30 days
    const { rows: byDay } = await sql<{ day: string; count: string }>`
      SELECT
        TO_CHAR(created_at AT TIME ZONE 'Australia/Sydney', 'YYYY-MM-DD') AS day,
        COUNT(*)::text AS count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 DESC
    `

    // Per-day-per-source breakdown
    const { rows: byDaySource } = await sql<{ day: string; source: string; count: string }>`
      SELECT
        TO_CHAR(created_at AT TIME ZONE 'Australia/Sydney', 'YYYY-MM-DD') AS day,
        COALESCE(signup_source, '(none)') AS source,
        COUNT(*)::text AS count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1, 2
      ORDER BY 1 DESC, 3::int DESC
    `

    // Total by source (30 days)
    const { rows: bySource } = await sql<{ source: string; count: string }>`
      SELECT
        COALESCE(signup_source, '(none)') AS source,
        COUNT(*)::text AS count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 2::int DESC
    `

    // Last 30 most recent signups with timestamp + source + UTM/referrer hints
    const { rows: recent } = await sql<{
      email: string
      created_at: string
      signup_source: string | null
      converted_from: string | null
    }>`
      SELECT email, created_at, signup_source, converted_from
      FROM users
      ORDER BY created_at DESC
      LIMIT 30
    `

    return NextResponse.json({
      byDay: byDay.map((r) => ({ day: r.day, count: parseInt(r.count, 10) })),
      byDaySource: byDaySource.map((r) => ({
        day: r.day,
        source: r.source,
        count: parseInt(r.count, 10),
      })),
      bySource30d: bySource.map((r) => ({ source: r.source, count: parseInt(r.count, 10) })),
      recent: recent.map((r) => ({
        email: r.email,
        createdAt: r.created_at,
        signupSource: r.signup_source,
        convertedFrom: r.converted_from,
      })),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Diagnostic failed' },
      { status: 500 }
    )
  }
}
