/**
 * GET /api/admin/prospect-engagement
 *
 * Returns engagement metrics for all prospects + per-prospect drill-down.
 * Used by the admin pipeline dashboard.
 *
 * Optional ?clinicId=N narrows to a single clinic.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

interface EngagementRow {
  id: number
  slug: string
  short_name: string
  contact_email: string
  status: string
  region: string
  travel_band: string
  last_sent_at: string | null
  last_sent_template: string | null
  total_sends: number
  total_opens: number
  total_clicks: number
  total_portal_views: number
  first_portal_view_at: string | null
  last_portal_view_at: string | null
  reply_count: number
  updated_at: string
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const clinicIdFilter = url.searchParams.get('clinicId')

  try {
    const filterId = clinicIdFilter ? parseInt(clinicIdFilter, 10) : null
    const result = filterId !== null && !isNaN(filterId)
      ? await sql<EngagementRow>`
          SELECT
            c.id, c.slug, c.short_name, c.contact_email, c.status, c.region, c.travel_band, c.updated_at,
            (SELECT MAX(sent_at) FROM prospect_outreach_log WHERE clinic_id = c.id) AS last_sent_at,
            (SELECT template_slug FROM prospect_outreach_log WHERE clinic_id = c.id ORDER BY sent_at DESC LIMIT 1) AS last_sent_template,
            (SELECT COUNT(*) FROM prospect_outreach_log WHERE clinic_id = c.id) AS total_sends,
            (SELECT COALESCE(SUM(opened_count), 0) FROM prospect_outreach_log WHERE clinic_id = c.id) AS total_opens,
            (SELECT COALESCE(SUM(clicked_count), 0) FROM prospect_outreach_log WHERE clinic_id = c.id) AS total_clicks,
            (SELECT COUNT(*) FROM prospect_portal_views WHERE clinic_id = c.id) AS total_portal_views,
            (SELECT MIN(viewed_at) FROM prospect_portal_views WHERE clinic_id = c.id) AS first_portal_view_at,
            (SELECT MAX(viewed_at) FROM prospect_portal_views WHERE clinic_id = c.id) AS last_portal_view_at,
            (SELECT COUNT(*) FROM prospect_outreach_log WHERE clinic_id = c.id AND replied_at IS NOT NULL) AS reply_count
          FROM prospect_clinics c
          WHERE c.id = ${filterId}
          ORDER BY c.updated_at DESC
        `
      : await sql<EngagementRow>`
          SELECT
            c.id, c.slug, c.short_name, c.contact_email, c.status, c.region, c.travel_band, c.updated_at,
            (SELECT MAX(sent_at) FROM prospect_outreach_log WHERE clinic_id = c.id) AS last_sent_at,
            (SELECT template_slug FROM prospect_outreach_log WHERE clinic_id = c.id ORDER BY sent_at DESC LIMIT 1) AS last_sent_template,
            (SELECT COUNT(*) FROM prospect_outreach_log WHERE clinic_id = c.id) AS total_sends,
            (SELECT COALESCE(SUM(opened_count), 0) FROM prospect_outreach_log WHERE clinic_id = c.id) AS total_opens,
            (SELECT COALESCE(SUM(clicked_count), 0) FROM prospect_outreach_log WHERE clinic_id = c.id) AS total_clicks,
            (SELECT COUNT(*) FROM prospect_portal_views WHERE clinic_id = c.id) AS total_portal_views,
            (SELECT MIN(viewed_at) FROM prospect_portal_views WHERE clinic_id = c.id) AS first_portal_view_at,
            (SELECT MAX(viewed_at) FROM prospect_portal_views WHERE clinic_id = c.id) AS last_portal_view_at,
            (SELECT COUNT(*) FROM prospect_outreach_log WHERE clinic_id = c.id AND replied_at IS NOT NULL) AS reply_count
          FROM prospect_clinics c
          ORDER BY
            CASE c.status
              WHEN 'replied' THEN 1
              WHEN 'engaged' THEN 2
              WHEN 'opened' THEN 3
              WHEN 'sent' THEN 4
              WHEN 'approved' THEN 5
              WHEN 'researching' THEN 6
              ELSE 7
            END,
            c.updated_at DESC
        `

    return NextResponse.json({ ok: true, count: result.rows.length, prospects: result.rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Query failed', detail: message }, { status: 500 })
  }
}
