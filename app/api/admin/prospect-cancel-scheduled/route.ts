/**
 * POST /api/admin/prospect-cancel-scheduled
 *
 * Cancels Resend SCHEDULED sends (staggered cold-outreach emails that haven't
 * delivered yet) for prospects that have since been archived as out-of-ICP.
 * The DB archive/suppress stops T2/T3, but a T1 already queued at Resend with
 * a future scheduledAt will still fire unless cancelled here.
 *
 * Resend `emails.cancel(id)` only works while the email is still scheduled;
 * an already-delivered one returns an error (reported as 'already-sent').
 *
 * Body: { hours?: number (default 12) } — look-back window for queued sends.
 * Auth: admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const key = process.env.RESEND_API_KEY
  if (!key) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  let body: { hours?: number }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const hours = Math.max(1, Math.min(body.hours ?? 12, 72))

  const { rows } = await sql<{
    short_name: string
    contact_email: string
    resend_email_id: string
    audit_key: string
  }>`
    SELECT pc.short_name, pc.contact_email, ol.resend_email_id, ol.audit_key
    FROM prospect_clinics pc
    JOIN prospect_outreach_log ol ON ol.clinic_id = pc.id
    WHERE pc.status = 'archived'
      AND pc.notes LIKE '%out-of-ICP%'
      AND ol.resend_email_id IS NOT NULL
      AND ol.sent_at > NOW() - (${hours} || ' hours')::interval
      AND ol.audit_key NOT LIKE '%:test:%'
      AND ol.audit_key NOT LIKE '%:cancelled%'
  `

  const resend = new Resend(key)
  const results: Array<{ email: string; id: string; outcome: string }> = []
  let cancelled = 0
  let alreadySent = 0

  for (const r of rows) {
    try {
      const res = await resend.emails.cancel(r.resend_email_id)
      if (res.error) {
        alreadySent += 1
        results.push({ email: r.contact_email, id: r.resend_email_id, outcome: `not-cancelled: ${res.error.message}` })
      } else {
        cancelled += 1
        results.push({ email: r.contact_email, id: r.resend_email_id, outcome: 'cancelled' })
        // Mark the log row so it isn't re-attempted and reads correctly.
        await sql`UPDATE prospect_outreach_log SET audit_key = audit_key || ':cancelled' WHERE audit_key = ${r.audit_key}`
      }
    } catch (err) {
      alreadySent += 1
      results.push({ email: r.contact_email, id: r.resend_email_id, outcome: `error: ${err instanceof Error ? err.message : String(err)}` })
    }
  }

  return NextResponse.json({ ok: true, examined: rows.length, cancelled, alreadySent, results })
}
