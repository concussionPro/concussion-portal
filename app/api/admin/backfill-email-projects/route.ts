import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * POST /api/admin/backfill-email-projects
 *
 * One-shot: tag historical email_events rows with project = 'cea' or
 * 'byronwebstudio' based on click_url + subject patterns. Going
 * forward the webhook tags at ingest. After running once, admin
 * queries can scope cleanly by project.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await sql`ALTER TABLE email_events ADD COLUMN IF NOT EXISTS project TEXT`

    // Tag rows that clearly belong to Byron Web Studio (cold-pitch click URLs)
    const { rowCount: bwsRows } = await sql`
      UPDATE email_events
      SET project = 'byronwebstudio'
      WHERE project IS NULL
        AND (
          click_url LIKE 'https://byronwebstudio.com.au/%'
          OR subject ILIKE '%byron web studio%'
          OR subject ILIKE '%saw your site%'
          OR subject ILIKE '%new website for%'
          OR subject ILIKE '%sample for your%'
        )
    `

    // Everything else with a CEA-shaped sequence or recipient on the CEA users
    // table belongs to CEA. Two-pass: first match by sequence tag, second by
    // recipient cross-reference.
    const { rowCount: bySeq } = await sql`
      UPDATE email_events
      SET project = 'cea'
      WHERE project IS NULL
        AND sequence IS NOT NULL
    `

    const { rowCount: byRecipient } = await sql`
      UPDATE email_events e
      SET project = 'cea'
      WHERE e.project IS NULL
        AND EXISTS (SELECT 1 FROM users u WHERE LOWER(u.email) = e.recipient)
    `

    // Catch-all: anything still NULL → 'other' so queries always have a value
    const { rowCount: other } = await sql`
      UPDATE email_events SET project = 'other' WHERE project IS NULL
    `

    return NextResponse.json({
      success: true,
      tagged: {
        byronwebstudio: bwsRows ?? 0,
        cea_by_sequence: bySeq ?? 0,
        cea_by_recipient: byRecipient ?? 0,
        other: other ?? 0,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Backfill failed' }, { status: 500 })
  }
}
