import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * POST /api/admin/update-user-access
 * Body: { email: string, accessLevel: 'preview' | 'online-only' | 'full-course', workshopLocation?: string }
 *
 * Direct UPDATE on users — used for corrections (e.g. fixing a
 * Squarespace-import bug that bumped someone to full-course when they
 * only paid for online). createUser's ON CONFLICT clause cannot
 * downgrade access_level so this is the only path.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { email?: string; accessLevel?: string; workshopLocation?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const email = body.email?.trim().toLowerCase()
  const accessLevel = body.accessLevel
  if (!email || !accessLevel) {
    return NextResponse.json({ error: 'email and accessLevel required' }, { status: 400 })
  }
  if (!['preview', 'online-only', 'full-course'].includes(accessLevel)) {
    return NextResponse.json({ error: 'invalid accessLevel' }, { status: 400 })
  }

  try {
    // Read previous state first so the response reports what changed
    const { rows: before } = await sql`
      SELECT access_level, workshop_location FROM users WHERE LOWER(email) = ${email} LIMIT 1
    `
    if (before.length === 0) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 })
    }

    if (body.workshopLocation !== undefined) {
      await sql`
        UPDATE users
        SET access_level = ${accessLevel}, workshop_location = ${body.workshopLocation}
        WHERE LOWER(email) = ${email}
      `
    } else {
      await sql`
        UPDATE users SET access_level = ${accessLevel} WHERE LOWER(email) = ${email}
      `
    }

    return NextResponse.json({
      success: true,
      previous: { accessLevel: before[0].access_level, workshopLocation: before[0].workshop_location },
      updated: { accessLevel, ...(body.workshopLocation !== undefined ? { workshopLocation: body.workshopLocation } : {}) },
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Update failed' }, { status: 500 })
  }
}
