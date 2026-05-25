import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * GET /api/admin/workshop-interest-list
 *
 * Returns every workshop_interest row. Used to verify nothing has been
 * missed and to retroactively follow up on registrants who didn't get
 * a notification email.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS workshop_interest (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT,
        city TEXT NOT NULL,
        source TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (email, city)
      )
    `
    const { rows } = await sql<{
      id: number
      email: string
      name: string | null
      city: string
      source: string | null
      created_at: string
    }>`
      SELECT id, email, name, city, source, created_at
      FROM workshop_interest
      ORDER BY created_at DESC
      LIMIT 500
    `
    const counts = await sql<{ city: string; count: string }>`
      SELECT city, COUNT(*)::text AS count
      FROM workshop_interest
      GROUP BY city
      ORDER BY COUNT(*) DESC
    `
    return NextResponse.json({
      success: true,
      total: rows.length,
      countsByCity: Object.fromEntries(counts.rows.map((r) => [r.city, parseInt(r.count, 10)])),
      registrations: rows,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Query failed' }, { status: 500 })
  }
}
