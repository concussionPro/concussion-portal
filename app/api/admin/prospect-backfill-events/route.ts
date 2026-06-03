/**
 * POST /api/admin/prospect-backfill-events
 *
 * Recovers prospect outreach_log opened_count / clicked_count for events
 * that the Resend webhook received but dropped because of the
 * tag-parsing bug (tags came in as object form, handler only matched array).
 *
 * Walks email_events table for opened/clicked events and replays them
 * against prospect_outreach_log by joining on resend_email_id /
 * email_id. Idempotent — opened_count is rebuilt from scratch (SET =,
 * not +=) so re-running won't double-count.
 *
 * Body: { dryRun?: bool } — defaults true.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { dryRun?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false // default TRUE — safe

  // Aggregate opened + clicked counts per resend email id from email_events
  const { rows: aggregates } = await sql<{
    email_id: string
    opens: string
    clicks: string
  }>`
    SELECT email_id,
           SUM(CASE WHEN event_type = 'opened' THEN 1 ELSE 0 END)::text AS opens,
           SUM(CASE WHEN event_type = 'clicked' THEN 1 ELSE 0 END)::text AS clicks
    FROM email_events
    WHERE email_id IS NOT NULL
      AND project = 'cea'
    GROUP BY email_id
    HAVING SUM(CASE WHEN event_type IN ('opened', 'clicked') THEN 1 ELSE 0 END) > 0
  `

  // Join against prospect_outreach_log to find matching rows
  const updates: Array<{
    resend_email_id: string
    opens: number
    clicks: number
    clinic_id?: number
    template_slug?: string
  }> = []

  for (const agg of aggregates) {
    const opens = parseInt(agg.opens, 10) || 0
    const clicks = parseInt(agg.clicks, 10) || 0
    const { rows: matching } = await sql<{ id: number; clinic_id: number; template_slug: string }>`
      SELECT id, clinic_id, template_slug
      FROM prospect_outreach_log
      WHERE resend_email_id = ${agg.email_id}
    `
    if (matching.length === 0) continue

    for (const m of matching) {
      updates.push({
        resend_email_id: agg.email_id,
        opens,
        clicks,
        clinic_id: m.clinic_id,
        template_slug: m.template_slug,
      })

      if (!dryRun) {
        await sql`
          UPDATE prospect_outreach_log
          SET opened_count = ${opens},
              clicked_count = ${clicks}
          WHERE id = ${m.id}
        `
        // Bump clinic status if appropriate
        if (clicks > 0) {
          await sql`
            UPDATE prospect_clinics
            SET status = 'engaged', updated_at = NOW()
            WHERE id = ${m.clinic_id} AND status IN ('sent', 'opened', 'approved')
          `
        } else if (opens > 0) {
          await sql`
            UPDATE prospect_clinics
            SET status = 'opened', updated_at = NOW()
            WHERE id = ${m.clinic_id} AND status IN ('sent', 'approved')
          `
        }
      }
    }
  }

  return NextResponse.json({
    summary: {
      mode: dryRun ? 'dry-run' : 'applied',
      aggregatesFound: aggregates.length,
      outreachRowsUpdated: updates.length,
      totalOpensRestored: updates.reduce((acc, u) => acc + u.opens, 0),
      totalClicksRestored: updates.reduce((acc, u) => acc + u.clicks, 0),
    },
    updates,
  })
}
