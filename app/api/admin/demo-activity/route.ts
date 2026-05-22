import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * GET /api/admin/demo-activity
 *
 * Returns demo-attributed analytics events grouped by organisation.
 * Powers the admin demo-activity dashboard so Zac can see exactly what
 * each partner did during their pitch demo.
 *
 * Query params:
 *   ?org=<organisation>  optional — filter to a specific partner
 *   ?days=<n>            optional — restrict to last N days (default 90)
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const org = url.searchParams.get('org')
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') || '90', 10)))
  const sinceMs = Date.now() - days * 24 * 60 * 60 * 1000

  try {
    // Per-organisation summary
    const summaryResult = org
      ? await sql`
          SELECT
            (event_data->>'demoOrg') AS organisation,
            MIN(timestamp_ms) AS first_seen_ms,
            MAX(timestamp_ms) AS last_seen_ms,
            COUNT(*)::int AS event_count,
            COUNT(DISTINCT session_id)::int AS sessions,
            COUNT(DISTINCT path)::int AS unique_pages,
            COUNT(*) FILTER (WHERE event_type = 'demo_nda_accepted')::int AS nda_acceptances,
            COUNT(*) FILTER (WHERE event_type = 'demo_pageview')::int AS pageviews,
            COUNT(*) FILTER (WHERE event_type = 'demo_module_open')::int AS modules_opened,
            COUNT(*) FILTER (WHERE event_type = 'demo_quiz_submitted')::int AS quizzes_submitted
          FROM analytics_events
          WHERE (event_data->>'isDemo')::boolean = true
            AND timestamp_ms >= ${sinceMs}
            AND (event_data->>'demoOrg') = ${org}
          GROUP BY (event_data->>'demoOrg')
          ORDER BY last_seen_ms DESC
        `
      : await sql`
          SELECT
            (event_data->>'demoOrg') AS organisation,
            MIN(timestamp_ms) AS first_seen_ms,
            MAX(timestamp_ms) AS last_seen_ms,
            COUNT(*)::int AS event_count,
            COUNT(DISTINCT session_id)::int AS sessions,
            COUNT(DISTINCT path)::int AS unique_pages,
            COUNT(*) FILTER (WHERE event_type = 'demo_nda_accepted')::int AS nda_acceptances,
            COUNT(*) FILTER (WHERE event_type = 'demo_pageview')::int AS pageviews,
            COUNT(*) FILTER (WHERE event_type = 'demo_module_open')::int AS modules_opened,
            COUNT(*) FILTER (WHERE event_type = 'demo_quiz_submitted')::int AS quizzes_submitted
          FROM analytics_events
          WHERE (event_data->>'isDemo')::boolean = true
            AND timestamp_ms >= ${sinceMs}
          GROUP BY (event_data->>'demoOrg')
          ORDER BY last_seen_ms DESC
        `

    // NDA acceptance records
    const acceptancesResult = org
      ? await sql`
          SELECT id, email, organisation, nda_version, ip_address, accepted_at
          FROM ai_course_demo_acceptances
          WHERE accepted_at >= NOW() - (${days} || ' days')::interval
            AND organisation = ${org}
          ORDER BY accepted_at DESC
          LIMIT 100
        `
      : await sql`
          SELECT id, email, organisation, nda_version, ip_address, accepted_at
          FROM ai_course_demo_acceptances
          WHERE accepted_at >= NOW() - (${days} || ' days')::interval
          ORDER BY accepted_at DESC
          LIMIT 100
        `

    // Top pages
    const topPagesResult = org
      ? await sql`
          SELECT
            path,
            COUNT(*)::int AS views,
            ROUND(AVG((event_data->>'previousDwellMs')::numeric / 1000), 1) AS avg_dwell_seconds
          FROM analytics_events
          WHERE event_type = 'demo_pageview'
            AND (event_data->>'isDemo')::boolean = true
            AND timestamp_ms >= ${sinceMs}
            AND (event_data->>'demoOrg') = ${org}
          GROUP BY path
          ORDER BY views DESC
          LIMIT 30
        `
      : await sql`
          SELECT
            path,
            COUNT(*)::int AS views,
            ROUND(AVG((event_data->>'previousDwellMs')::numeric / 1000), 1) AS avg_dwell_seconds
          FROM analytics_events
          WHERE event_type = 'demo_pageview'
            AND (event_data->>'isDemo')::boolean = true
            AND timestamp_ms >= ${sinceMs}
          GROUP BY path
          ORDER BY views DESC
          LIMIT 30
        `

    // Timeline (last 200 events)
    const timelineResult = org
      ? await sql`
          SELECT
            event_type, event_data, path, timestamp_ms, session_id
          FROM analytics_events
          WHERE (event_data->>'isDemo')::boolean = true
            AND timestamp_ms >= ${sinceMs}
            AND (event_data->>'demoOrg') = ${org}
          ORDER BY timestamp_ms DESC
          LIMIT 200
        `
      : await sql`
          SELECT
            event_type, event_data, path, timestamp_ms, session_id
          FROM analytics_events
          WHERE (event_data->>'isDemo')::boolean = true
            AND timestamp_ms >= ${sinceMs}
          ORDER BY timestamp_ms DESC
          LIMIT 200
        `

    return NextResponse.json({
      success: true,
      filters: { org, days },
      summary: summaryResult.rows,
      acceptances: acceptancesResult.rows,
      topPages: topPagesResult.rows,
      timeline: timelineResult.rows,
    })
  } catch (err) {
    console.error('[admin/demo-activity] Query failed:', err)
    return NextResponse.json(
      { error: 'Query failed. Check analytics_events table exists.' },
      { status: 500 }
    )
  }
}
