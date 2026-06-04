/**
 * POST /api/admin/prospect-mark-already-sent
 *
 * Records a sentinel prospect_outreach_log row for a clinic so the cron's
 * "not already T1'd" filter excludes it. Use when a clinic was contacted
 * outside this engine (via Apollo sequences, manual one-off email, prior
 * partnership outreach) and a duplicate from the cron would be embarrassing
 * or burn the relationship.
 *
 * Body: { slug: string, reason?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'
import { getClinicBySlug } from '@/lib/prospect/repo'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { slug?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const reason = (body.reason || 'manual-pre-engine').replace(/[^a-z0-9-]/gi, '-').slice(0, 64)

  const clinic = await getClinicBySlug(body.slug)
  if (!clinic) return NextResponse.json({ error: `Clinic not found for slug=${body.slug}` }, { status: 404 })

  const auditKey = `outreach:${clinic.slug}:initial:${reason}:${Date.now()}`
  const noteAppend = `\n[manual-dedup] ${new Date().toISOString()} marked as already sent (reason=${reason}) — engine will skip`

  // Insert a sentinel outreach_log row so the cron's NOT EXISTS filter
  // ('initial' template) excludes this clinic. Subject/body intentionally
  // explain the row's purpose so anyone auditing the log understands it
  // wasn't a real send from this engine.
  const { rows: existing } = await sql`
    SELECT id FROM prospect_outreach_log
    WHERE clinic_id = ${clinic.id} AND template_slug = 'initial'
    LIMIT 1
  `
  if (existing.length > 0) {
    return NextResponse.json({
      ok: true,
      idempotent: true,
      note: 'Clinic already has an initial outreach_log row — no change',
      clinic: { id: clinic.id, slug: clinic.slug, shortName: clinic.shortName },
    })
  }

  await sql`
    INSERT INTO prospect_outreach_log (
      clinic_id, template_slug, audit_key, email_subject, email_body, resend_email_id, sent_at
    ) VALUES (
      ${clinic.id}, 'initial', ${auditKey},
      ${'[SENTINEL] Marked already-sent outside engine — see notes'},
      ${'[SENTINEL] No real email was sent from this engine. Reason: ' + reason},
      NULL, NOW()
    )
  `
  await sql`
    UPDATE prospect_clinics
    SET notes = COALESCE(notes, '') || ${noteAppend},
        updated_at = NOW()
    WHERE id = ${clinic.id}
  `

  return NextResponse.json({
    ok: true,
    idempotent: false,
    clinic: { id: clinic.id, slug: clinic.slug, shortName: clinic.shortName, contactEmail: clinic.contactEmail },
    auditKey,
  })
}
