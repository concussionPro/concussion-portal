import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * GET /api/admin/signup-disciplines
 *
 * Signups categorized by discipline (owner ask 2026-07-27, ESSA launch week:
 * "categorize the sign ups so i know how many of each discipline").
 *
 * HONESTY: profession is NOT captured at signup, so this is INFERENCE, in
 * priority order:
 *   1. CRM ownership / ep-course signup source → Exercise Physiology (the
 *      stream is EP-only by construction);
 *   2. email keyword (osteo/physio/chiro/exercise-science patterns) — clinic
 *      domains and professional addresses carry the discipline surprisingly
 *      often;
 *   3. everything else → Unknown.
 * The UI must label this "inferred". Real capture is a signup-form field —
 * tracked separately.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { rows } = await sql`
      SELECT
        CASE
          WHEN EXISTS (
            SELECT 1 FROM course_purchases cp
            WHERE LOWER(cp.user_email) = LOWER(u.email) AND cp.course_slug IN ('crm', 'crm-practical')
          ) OR u.signup_source = 'ep-course'
            THEN 'Exercise Physiology'
          WHEN u.email ILIKE '%osteo%' THEN 'Osteopathy'
          WHEN u.email ILIKE '%physio%' OR u.email ILIKE '%physical%' THEN 'Physiotherapy'
          WHEN u.email ILIKE '%chiro%' THEN 'Chiropractic'
          WHEN u.email ILIKE '%exercise%' OR u.email ILIKE '%kinesi%' OR u.email ILIKE '%sportsci%' THEN 'Exercise Science'
          ELSE 'Unknown'
        END AS discipline,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE u.access_level IN ('online-only', 'full-course')
          OR EXISTS (
            SELECT 1 FROM course_purchases cp2
            WHERE LOWER(cp2.user_email) = LOWER(u.email) AND cp2.course_slug = 'crm'
          ))::int AS paid
      FROM users u
      WHERE COALESCE(u.is_test, false) = false
      GROUP BY 1
      ORDER BY total DESC
    `

    const disciplines = rows.map((r) => ({
      discipline: r.discipline as string,
      total: Number(r.total),
      paid: Number(r.paid),
      free: Number(r.total) - Number(r.paid),
    }))

    return NextResponse.json({ success: true, disciplines })
  } catch (error) {
    console.error('signup-disciplines error:', error)
    return NextResponse.json({ error: 'Failed to load discipline breakdown' }, { status: 500 })
  }
}
