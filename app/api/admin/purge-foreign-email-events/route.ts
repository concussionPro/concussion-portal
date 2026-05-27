import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * POST /api/admin/purge-foreign-email-events
 *
 * One-shot cleanup: deletes rows in email_events that came from the
 * shared Resend account but weren't sent for CEA (the Byron Web
 * Studio Local Leads contamination). Identifies foreign rows by:
 *   - click_url that starts with byronwebstudio.com.au, OR
 *   - subject patterns that match the local-leads outreach copy
 *
 * The webhook now filters at ingest, so this only needs to run once
 * to clean historical data.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    // Count first so we can report
    const { rows: counts } = await sql<{ count: string }>`
      SELECT COUNT(*)::text AS count
      FROM email_events
      WHERE click_url LIKE 'https://byronwebstudio.com.au/%'
         OR subject ILIKE '%byron web studio%'
         OR subject ILIKE '%saw your site%'
         OR subject ILIKE '%new website for%'
         OR subject ILIKE '%sample for your%'
    `
    const willDelete = parseInt(counts[0]?.count || '0', 10)

    const { rowCount } = await sql`
      DELETE FROM email_events
      WHERE click_url LIKE 'https://byronwebstudio.com.au/%'
         OR subject ILIKE '%byron web studio%'
         OR subject ILIKE '%saw your site%'
         OR subject ILIKE '%new website for%'
         OR subject ILIKE '%sample for your%'
    `

    return NextResponse.json({
      success: true,
      matched: willDelete,
      deleted: rowCount ?? 0,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Purge failed' }, { status: 500 })
  }
}
