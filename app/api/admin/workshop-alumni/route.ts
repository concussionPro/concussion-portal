/**
 * GET /api/admin/workshop-alumni
 *
 * The warm base: everyone who SAT the practical day in a completed cohort,
 * grouped by location — ready for Level 2 / continuing-ed outreach. Auto-derived
 * (completed location + a paid seat), so it stays current with no manual
 * re-tagging as each workshop date passes.
 *
 * BOTH streams, because the practical day is shared: CCM via
 * users.access_level='full-course', and CRM via the 'crm-practical' entitlement
 * in course_purchases (a CRM buyer's access_level stays 'preview' — isolated
 * streams, lib/crm-course.ts). Mirrors isWorkshopAlumnus(), which the nurture
 * cron uses to suppress the same people from post-workshop nurture.
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
      `SELECT u.email, u.name, u.workshop_location, u.created_at,
              CASE WHEN u.access_level = 'full-course' THEN 'ccm' ELSE 'crm' END AS stream
       FROM users u
       WHERE u.workshop_location = ANY($1)
         AND (
           u.access_level = 'full-course'
           OR EXISTS (
             SELECT 1 FROM course_purchases cp
             WHERE LOWER(cp.user_email) = LOWER(u.email)
               AND cp.course_slug = 'crm-practical'
           )
         )
       ORDER BY u.workshop_location, u.created_at DESC`,
      [slugs],
    )

    const alumni = rows.map((r) => ({
      email: r.email,
      name: r.name,
      location: r.workshop_location,
      since: r.created_at,
      stream: r.stream as 'ccm' | 'crm',
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
