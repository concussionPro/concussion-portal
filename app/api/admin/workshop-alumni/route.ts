/**
 * GET /api/admin/workshop-alumni
 *
 * The warm base: full-course buyers whose workshop has RUN (completed cohort),
 * grouped by location — ready for Level 2 / continuing-ed outreach. Auto-derived
 * (completed location + full-course access), so it stays current with no manual
 * re-tagging as each workshop date passes.
 *
 * Auth: admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { completedWorkshopSlugs } from '@/lib/workshop-alumni'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slugs = completedWorkshopSlugs()
  if (slugs.length === 0) {
    return NextResponse.json({ ok: true, completedLocations: [], total: 0, alumni: [] })
  }

  try {
    const { rows } = await sql.query(
      `SELECT email, name, workshop_location, created_at
       FROM users
       WHERE access_level = 'full-course'
         AND workshop_location = ANY($1)
       ORDER BY workshop_location, created_at DESC`,
      [slugs],
    )

    const alumni = rows.map((r) => ({
      email: r.email,
      name: r.name,
      location: r.workshop_location,
      since: r.created_at,
    }))

    // Group counts per completed location.
    const byLocation: Record<string, number> = {}
    for (const a of alumni) byLocation[a.location] = (byLocation[a.location] ?? 0) + 1

    return NextResponse.json({
      ok: true,
      completedLocations: slugs,
      byLocation,
      total: alumni.length,
      alumni,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
