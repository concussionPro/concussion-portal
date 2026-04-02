// Admin monitoring dashboard endpoint
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Admin auth (timing-safe)
    const adminKey = request.headers.get('x-admin-key')
    const expected = process.env.ADMIN_API_KEY
    if (!expected || !adminKey || !crypto.timingSafeEqual(
      crypto.createHmac('sha256', 'compare').update(adminKey).digest(),
      crypto.createHmac('sha256', 'compare').update(expected).digest()
    )) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Today's event count from Postgres
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const { rows: eventRows } = await sql`
      SELECT COUNT(*) as cnt FROM analytics_events
      WHERE timestamp_ms >= ${todayStart.getTime()}
    `
    const todayEvents = Number(eventRows[0].cnt)

    // User count from Postgres
    const { rows: userRows } = await sql`SELECT COUNT(*) as cnt FROM users`
    const userCount = Number(userRows[0].cnt)

    // Abandoned checkouts
    const { rows: abandonedRows } = await sql`
      SELECT email, course_type, amount, abandoned_at, emails_sent, recovered
      FROM abandoned_checkouts
      ORDER BY abandoned_at DESC
      LIMIT 20
    `

    // Squarespace sync stats
    const { rows: sqRows } = await sql`
      SELECT COUNT(*) as cnt FROM users WHERE signup_source = 'squarespace'
    `

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      storage: 'postgres',
      metrics: {
        userCount,
        todayEvents,
        squarespaceUsers: Number(sqRows[0].cnt),
      },
      abandonedCheckouts: abandonedRows,
      systemHealth: {
        database: true,
        authentication: true,
      }
    })
  } catch (error: unknown) {
    console.error('Monitoring endpoint error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
