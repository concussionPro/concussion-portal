/**
 * POST /api/admin/prospect-unsubscribe
 *
 * Manual unsubscribe for a COLD-OUTREACH contact — the owner-triggered
 * equivalent of a STOP reply, with the same zero-tolerance semantics
 * (mirrors the resend-inbound opt-out handler):
 *
 *  1. email_suppression insert for the address (master blacklist, every lane).
 *  2. Pull the WHOLE clinic: every prospect_clinics row whose contact is at
 *     the same domain → status 'lost', scheduling cleared, note stamped; any
 *     other contact addresses at the clinic are suppressed too. (Doctrine:
 *     an unsub pulls the clinic — Aeon Health / Physio Focus precedent.)
 *  3. Cancel any Resend emails still SCHEDULED to those addresses (a queued
 *     T1/T2 fires even after suppression unless cancelled at Resend).
 *  4. users-table fallback: nurture_unsubscribed=true if they're a user.
 *
 * Body: { email: string, pullDomain?: boolean (default true) }
 * Auth: admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { suppress } from '@/lib/prospect/repo'
import { unsubscribeUser } from '@/lib/users'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { email?: string; pullDomain?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON body required' }, { status: 400 })
  }
  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }
  const pullDomain = body.pullDomain !== false
  const domain = email.split('@')[1]

  // 1. Master blacklist — the one write that guarantees no lane ever sends.
  await suppress(email, 'unsubscribed', 'admin-manual')

  // 4. users-table fallback (also idempotently re-inserts suppression).
  const wasUser = await unsubscribeUser(email)

  // 2. Pull the clinic(s). Domain match catches the info@/reception@ variants
  //    of the same practice; exact-only when pullDomain=false.
  const note = `\n[manual] ${new Date().toISOString()} owner-requested unsubscribe (${email}) — suppressed, clinic pulled`
  const { rows: clinics } = await sql<{ id: number; short_name: string; contact_email: string | null; status: string }>`
    UPDATE prospect_clinics
    SET status = 'lost',
        next_template_slug = NULL,
        scheduled_send_at = NULL,
        notes = COALESCE(notes, '') || ${note},
        updated_at = NOW()
    WHERE LOWER(contact_email) = ${email}
       OR (${pullDomain} AND LOWER(contact_email) LIKE ${'%@' + domain})
    RETURNING id, short_name, contact_email, status
  `

  // Suppress the sibling addresses the clinic pull surfaced.
  const siblingEmails = [...new Set(
    clinics
      .map((c) => c.contact_email?.toLowerCase())
      .filter((e): e is string => !!e && e !== email),
  )]
  for (const e of siblingEmails) {
    await suppress(e, 'unsubscribed', `admin-manual:domain-pull:${email}`)
  }

  // 3. Cancel Resend emails still scheduled to any suppressed address.
  const allEmails = [email, ...siblingEmails]
  let cancelled = 0
  let notCancellable = 0
  const key = process.env.RESEND_API_KEY
  if (key && clinics.length > 0) {
    // Tagged-template client can't bind a TS array to ANY() — jsonb bridge,
    // same pattern as prospect-approve.
    const emailsJson = JSON.stringify(allEmails)
    const { rows: pending } = await sql<{ resend_email_id: string; audit_key: string }>`
      SELECT ol.resend_email_id, ol.audit_key
      FROM prospect_outreach_log ol
      JOIN prospect_clinics pc ON pc.id = ol.clinic_id
      WHERE LOWER(pc.contact_email) = ANY(SELECT jsonb_array_elements_text(${emailsJson}::jsonb))
        AND ol.resend_email_id IS NOT NULL
        AND ol.sent_at > NOW() - INTERVAL '72 hours'
        AND ol.audit_key NOT LIKE '%:cancelled%'
    `
    const resend = new Resend(key)
    for (const p of pending) {
      try {
        const res = await resend.emails.cancel(p.resend_email_id)
        if (res.error) {
          notCancellable += 1
        } else {
          cancelled += 1
          await sql`UPDATE prospect_outreach_log SET audit_key = audit_key || ':cancelled' WHERE audit_key = ${p.audit_key}`
        }
      } catch {
        notCancellable += 1 // already delivered — nothing to cancel
      }
    }
  }

  return NextResponse.json({
    ok: true,
    suppressed: allEmails,
    clinicsPulled: clinics.map((c) => ({ id: c.id, name: c.short_name, email: c.contact_email })),
    resendCancelled: cancelled,
    resendNotCancellable: notCancellable,
    wasNurtureUser: wasUser,
  })
}
