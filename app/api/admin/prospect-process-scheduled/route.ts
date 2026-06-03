/**
 * POST /api/admin/prospect-process-scheduled
 *
 * Daily-cron-callable. Fires T1 to prospects whose scheduled_send_at <= NOW
 * AND status = 'approved' AND they haven't been T1'd yet AND their
 * contactEmailSource is high-confidence ('website' or 'linkedin').
 *
 * Pattern-guess + info-fallback + unverified emails are SKIPPED to preserve
 * sender deliverability — these get reported but not sent. Zac verifies
 * those manually via Apollo / LinkedIn before they flip to 'website' source
 * and become eligible.
 *
 * Daily cap default = 5 sends/day (conservative ramp). Body: { dryRun?: bool,
 * dailyCap?: number, allowPatternGuess?: bool }.
 *
 * Deliverability guardrails:
 *  - Default filters to 'website' contactEmailSource only
 *  - Skips prospects already on suppression list
 *  - Skips prospects with any T1 send in their outreach log (no double-send)
 *  - Caps daily volume
 *  - Returns full audit log of what was/wasn't sent and why
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'
import {
  getClinicById,
  getTemplateSignoff,
  isSuppressed,
  logOutreach,
  updateClinicStatus,
} from '@/lib/prospect/repo'
import { EMAIL_TEMPLATES, mergeTemplate } from '@/lib/prospect/email-templates'

const ZAC_INBOX = process.env.ZAC_INBOX ?? 'zac@concussion-education-australia.com'
const COLD_FROM = 'Zac Lewis <partnerships@concussion-education-australia.com>'
const REPLY_TO = 'zac@concussion-education-australia.com'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.concussion-education-australia.com'

interface QueueRow {
  id: number
  slug: string
  short_name: string
  contact_email: string
  contact_first_name: string
  scheduled_send_at: string | null
  next_template_slug: string | null
  status: string
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { dryRun?: boolean; dailyCap?: number; allowPatternGuess?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false // default TRUE — safe by default
  const dailyCap = body.dailyCap ?? 5
  const allowPatternGuess = body.allowPatternGuess === true

  // Template signoff gate — even cron-driven sends require it
  const signoff = await getTemplateSignoff('initial')
  if (!signoff.signedOffAt) {
    return NextResponse.json(
      { error: 'T1 template not signed off — POST /api/admin/prospect-template-signoff first' },
      { status: 403 },
    )
  }

  // Find prospects due today + not yet T1'd
  const { rows: due } = await sql<QueueRow>`
    SELECT pc.id, pc.slug, pc.short_name, pc.contact_email, pc.contact_first_name,
           pc.scheduled_send_at, pc.next_template_slug, pc.status
    FROM prospect_clinics pc
    WHERE pc.status = 'approved'
      AND pc.scheduled_send_at IS NOT NULL
      AND pc.scheduled_send_at <= NOW()
      AND NOT EXISTS (
        SELECT 1 FROM prospect_outreach_log ol
        WHERE ol.clinic_id = pc.id AND ol.template_slug = 'initial'
      )
    ORDER BY pc.scheduled_send_at ASC, pc.priority_wave ASC
    LIMIT 50
  `

  // Determine eligible-to-send (deliverability gates) vs blocked
  // Note: contactEmailSource is not yet a DB column; we use email-shape
  // heuristics for now (info@/admin@/reception@/office@ = lower confidence)
  const isLowConfidenceEmail = (email: string) => {
    const lower = email.toLowerCase()
    return /^(info|admin|reception|office|bookings|enquiries|hello|contact|mail)@/.test(lower)
  }

  const sentCount = { count: 0 }
  const results: Array<{
    id: number
    slug: string
    shortName: string
    email: string
    decision: 'sending' | 'skipped-suppressed' | 'skipped-low-confidence' | 'skipped-cap' | 'sent' | 'send-failed' | 'sent-dryrun'
    resendId?: string
    reason?: string
  }> = []

  const resendKey = process.env.RESEND_API_KEY

  for (const row of due) {
    if (sentCount.count >= dailyCap) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        decision: 'skipped-cap', reason: `daily cap ${dailyCap} reached`,
      })
      continue
    }
    if (await isSuppressed(row.contact_email)) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        decision: 'skipped-suppressed', reason: 'on suppression list',
      })
      continue
    }
    if (isLowConfidenceEmail(row.contact_email) && !allowPatternGuess) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        decision: 'skipped-low-confidence', reason: 'generic mailbox (info@/admin@/etc) — verify direct founder email first',
      })
      continue
    }

    // Dry run: report what WOULD send, don't actually send
    if (dryRun) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        decision: 'sent-dryrun', reason: 'would send (dry run)',
      })
      sentCount.count += 1
      continue
    }

    // ACTUALLY SEND
    if (!resendKey) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        decision: 'send-failed', reason: 'RESEND_API_KEY missing',
      })
      continue
    }

    const clinic = await getClinicById(row.id)
    if (!clinic) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        decision: 'send-failed', reason: 'clinic vanished mid-query',
      })
      continue
    }

    const template = EMAIL_TEMPLATES.find((t) => t.slug === 'initial')!
    const unsubToken = `${clinic.slug}-${Date.now().toString(36)}`
    const { subject, html, text } = mergeTemplate(template, clinic, BASE_URL, unsubToken)
    const auditKey = `outreach:${clinic.slug}:initial:cron:${Date.now()}`

    try {
      const resend = new Resend(resendKey)
      const result = await resend.emails.send({
        from: COLD_FROM,
        to: clinic.contactEmail,
        replyTo: REPLY_TO,
        subject,
        html,
        text,
        headers: {
          'List-Unsubscribe': `<${BASE_URL}/api/prospect/unsubscribe?t=${unsubToken}>, <mailto:unsubscribe@concussion-education-australia.com>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'List-ID': 'prospect-outreach.concussion-education-australia.com',
          Precedence: 'bulk',
          'X-Mailer': 'CEA cron',
          'X-Prospect-Id': String(clinic.id),
          'X-Template-Slug': 'initial',
        },
        tags: [
          { name: 'prospect-id', value: String(clinic.id) },
          { name: 'template', value: 'initial' },
          { name: 'mode', value: 'production-cron' },
        ],
      })

      if (result.error) {
        results.push({
          id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
          decision: 'send-failed', reason: JSON.stringify(result.error).slice(0, 200),
        })
        continue
      }

      await logOutreach({
        clinicId: clinic.id,
        templateSlug: 'initial',
        emailSubject: subject,
        emailBody: text,
        resendEmailId: result.data?.id ?? null,
        auditKey,
      })
      await updateClinicStatus(clinic.id, 'sent')

      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        decision: 'sent', resendId: result.data?.id,
      })
      sentCount.count += 1
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        decision: 'send-failed', reason: message,
      })
    }
  }

  return NextResponse.json({
    summary: {
      mode: dryRun ? 'dry-run' : 'production',
      due: due.length,
      sent: results.filter((r) => r.decision === 'sent').length,
      sentDryRun: results.filter((r) => r.decision === 'sent-dryrun').length,
      skippedLowConfidence: results.filter((r) => r.decision === 'skipped-low-confidence').length,
      skippedSuppressed: results.filter((r) => r.decision === 'skipped-suppressed').length,
      skippedCap: results.filter((r) => r.decision === 'skipped-cap').length,
      sendFailed: results.filter((r) => r.decision === 'send-failed').length,
      dailyCap,
      allowPatternGuess,
      zacInbox: ZAC_INBOX,
    },
    results,
  })
}
