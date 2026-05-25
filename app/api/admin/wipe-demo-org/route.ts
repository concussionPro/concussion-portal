import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * POST /api/admin/wipe-demo-org?org=Heidi%20Health
 *
 * Deletes demo-attributed analytics events + NDA acceptance records for a
 * single organisation. Use after testing to clean the dashboard before
 * sending the demo link to the actual partner.
 *
 * Admin-gated. Returns counts deleted.
 *
 * Scoped to the specific org — won't touch other partner data.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const org = url.searchParams.get('org')
  if (!org || org.length < 2) {
    return NextResponse.json({ error: 'Missing org param' }, { status: 400 })
  }

  try {
    // 1. Delete demo analytics events for this org
    const eventsResult = await sql`
      DELETE FROM analytics_events
      WHERE (event_data->>'isDemo')::boolean = true
        AND (event_data->>'demoOrg') = ${org}
    `

    // 2. Delete NDA acceptances for this org
    const acceptancesResult = await sql`
      DELETE FROM ai_course_demo_acceptances
      WHERE organisation = ${org}
    `

    return NextResponse.json({
      success: true,
      org,
      analyticsEventsDeleted: eventsResult.rowCount ?? 0,
      acceptancesDeleted: acceptancesResult.rowCount ?? 0,
    })
  } catch (err) {
    console.error('[admin/wipe-demo-org] Wipe failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Wipe failed' },
      { status: 500 }
    )
  }
}
