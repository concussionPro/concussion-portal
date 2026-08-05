import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { sql } from '@/lib/db'
import { sendDueAusNeuro } from '@/lib/aus-neuro-outreach'

/** GET /api/admin/aus-neuro — the 'aus neuro' outreach stream (owner
 *  2026-07-28): SST-specific AU neuro/vestibular/concussion clinics, tagged
 *  stream='aus-neuro' in prospect_clinics. Feeds the analytics panel.
 *  SEPARATE stream from the generic clinic lanes — its own cadence + copy
 *  (/clinics pitch, no ACC angle). */
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { rows } = await sql`
    SELECT name, city, state, contact_first_name, contact_full_name, contact_role,
           contact_email, status, verification_status, replied_at, clinic_website_url
    FROM prospect_clinics
    WHERE stream = 'aus-neuro'
    ORDER BY (status = 'approved') DESC, name ASC
  `
  // Stream traffic lane (14d): the /clinics funnel — visits, tour entries,
  // and auneuro-tagged cal clicks — so the panel reports outreach yield.
  const since = Date.now() - 14 * 24 * 3600 * 1000
  const { rows: traffic } = await sql`
    SELECT
      COUNT(*) FILTER (WHERE event_type = 'page_view' AND path = '/clinics')::int AS visits,
      -- Scope to THIS lane. An unscoped demo_tour_start count attributed every
      -- /demo/clinic entry portal-wide to the Aus Neuro stream, over-crediting a
      -- lane that has its own send budget (the sibling counters are both scoped).
      COUNT(*) FILTER (
        WHERE event_type = 'demo_tour_start'
          AND (event_data->>'source' LIKE 'auneuro%' OR path = '/clinics')
      )::int AS tours,
      COUNT(*) FILTER (WHERE event_type = 'cal_click' AND event_data->>'source' LIKE 'auneuro%')::int AS cal_clicks
    FROM analytics_events
    WHERE timestamp_ms > ${since}
  `
  return NextResponse.json({ clinics: rows, traffic: traffic[0] })
}

/** POST — { action: 'send', limit? }: fire due aus-neuro sends via Resend.
 *  Suppression fail-closed; bespoke-hook required; approved→sent one-way. */
export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { action?: string; limit?: number } = {}
  try { body = await request.json() } catch { /* empty ok */ }
  if (body.action !== 'send') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
  const result = await sendDueAusNeuro(Math.min(body.limit ?? 10, 25))
  return NextResponse.json(result)
}
