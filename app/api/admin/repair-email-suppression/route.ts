/**
 * POST /api/admin/repair-email-suppression
 *
 * Backfills email_suppression for any contactEmail whose clinic is already
 * marked 'lost' or 'bounced' in prospect_clinics, AND for any recipient
 * with a 'complained' event in email_events that doesn't already have a
 * suppression row. Idempotent.
 *
 * Why: /api/prospect/unsubscribe was a 404 from launch until 2026-06-04.
 * Recipients who clicked the Gmail/Outlook one-click Unsubscribe had no
 * working opt-out — some hit Spam (recorded in Resend as complaints,
 * webhook auto-suppressed) but the historical 'lost' / 'bounced' clinic
 * rows that were marked manually or via earlier webhook variants may not
 * have a matching email_suppression row, so they could still be sent to.
 * This route guarantees the invariant: status ∈ {lost, bounced} →
 * email_suppression row exists.
 *
 * Body: { dryRun?: boolean } — default true
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

export const runtime = 'nodejs'

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
  const dryRun = body.dryRun !== false

  // 1. Clinics in opt-out states. Lower-cased contactEmail because
  // email_suppression always stores lowercase.
  const { rows: optOutClinics } = await sql<{
    id: number
    slug: string
    contact_email: string
    status: string
  }>`
    SELECT id, slug, LOWER(contact_email) AS contact_email, status
    FROM prospect_clinics
    WHERE status IN ('lost', 'bounced')
      AND contact_email IS NOT NULL
      AND contact_email <> ''
  `

  // 2. Recipients with a complaint event (CEA project only).
  const { rows: complainedRecipients } = await sql<{ recipient: string }>`
    SELECT DISTINCT LOWER(recipient) AS recipient
    FROM email_events
    WHERE event_type = 'complained'
      AND COALESCE(project, 'cea') = 'cea'
      AND recipient IS NOT NULL
  `

  // 3. Existing suppression rows so we know what's already covered.
  const allEmailsToCheck = [
    ...optOutClinics.map((c) => c.contact_email),
    ...complainedRecipients.map((r) => r.recipient),
  ]
  const uniqueEmails = [...new Set(allEmailsToCheck)]

  const alreadySuppressed = new Set<string>()
  if (uniqueEmails.length > 0) {
    const uniqueEmailsJson = JSON.stringify(uniqueEmails)
    const { rows: existing } = await sql<{ email: string }>`
      SELECT LOWER(email) AS email FROM email_suppression
      WHERE LOWER(email) = ANY(SELECT jsonb_array_elements_text(${uniqueEmailsJson}::jsonb))
    `
    for (const r of existing) alreadySuppressed.add(r.email)
  }

  const toAdd: Array<{ email: string; reason: string; source: string }> = []
  for (const c of optOutClinics) {
    if (alreadySuppressed.has(c.contact_email)) continue
    toAdd.push({
      email: c.contact_email,
      reason: c.status === 'bounced' ? 'hard-bounce' : 'manual-unsubscribe',
      source: `repair:clinic-status-${c.status}:slug-${c.slug}`,
    })
    alreadySuppressed.add(c.contact_email)
  }
  for (const r of complainedRecipients) {
    if (alreadySuppressed.has(r.recipient)) continue
    toAdd.push({
      email: r.recipient,
      reason: 'complained',
      source: 'repair:email-events-complaint',
    })
    alreadySuppressed.add(r.recipient)
  }

  let inserted = 0
  if (!dryRun) {
    for (const entry of toAdd) {
      const { rowCount } = await sql`
        INSERT INTO email_suppression (email, reason, source)
        VALUES (${entry.email}, ${entry.reason}, ${entry.source})
        ON CONFLICT (email) DO NOTHING
      `
      if (rowCount && rowCount > 0) inserted += 1
    }
  }

  return NextResponse.json({
    summary: {
      mode: dryRun ? 'dry-run' : 'applied',
      optOutClinics: optOutClinics.length,
      complainedRecipients: complainedRecipients.length,
      alreadyCovered: uniqueEmails.length - toAdd.length,
      wouldAdd: toAdd.length,
      inserted,
    },
    sample: toAdd.slice(0, 25),
    fullList: toAdd.length <= 100 ? toAdd : undefined,
  })
}
