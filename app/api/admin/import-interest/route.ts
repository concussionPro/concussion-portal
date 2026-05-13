import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { importInterestSchema } from '@/lib/schemas'

/**
 * POST /api/admin/import-interest
 *
 * Manually insert a workshop_interest row from the admin analytics page.
 * Used for Squarespace form-submission emails that arrive in Zac's inbox —
 * he pastes them in batches via the inline form on /admin/analytics.
 *
 * Idempotent: ON CONFLICT (email, city) DO NOTHING so re-submits are safe.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = importInterestSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { email, name, city } = parsed.data

  try {
    const { rowCount } = await sql`
      INSERT INTO workshop_interest (email, name, city, source)
      VALUES (${email}, ${name}, ${city}, 'admin-manual')
      ON CONFLICT (email, city) DO NOTHING
    `

    if (rowCount === 0) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: `${email} is already on the ${city} list.`,
      })
    }

    return NextResponse.json({ success: true, email, name, city })
  } catch (error) {
    console.error('[admin/import-interest] DB error:', error)
    return NextResponse.json({ error: 'Failed to save registration.' }, { status: 500 })
  }
}
