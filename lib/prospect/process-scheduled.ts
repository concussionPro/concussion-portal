/**
 * Shared core for prospect cold-outreach scheduled sends.
 *
 * Both the admin POST handler (`/api/admin/prospect-process-scheduled`) and
 * the Vercel cron GET handler (`/api/cron/prospect-process-scheduled`) call
 * into this. Logic isn't duplicated.
 *
 * Guardrails (see /api/admin/prospect-process-scheduled docstring for the
 * full set):
 *  - status='approved' only
 *  - signoff required
 *  - high-confidence email source only (rejects info@/admin@/etc unless
 *    allowPatternGuess=true)
 *  - email_suppression check
 *  - clinic-status guard (lost/bounced — defence-in-depth)
 *  - daily cap
 */
import { Resend } from 'resend'
import { sql } from '@vercel/postgres'
import {
  getClinicById,
  getTemplateSignoff,
  isSuppressed,
  logOutreach,
  updateClinicStatus,
} from '@/lib/prospect/repo'
import { EMAIL_TEMPLATES, mergeTemplate } from '@/lib/prospect/email-templates'

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

export interface ProcessScheduledOptions {
  dryRun: boolean
  dailyCap: number
  allowPatternGuess: boolean
  // Bypass the "scheduled_send_at <= NOW()" filter. Fires every approved
  // clinic scheduled for the current UTC date regardless of time-of-day.
  // Used for manual "fire today's queue now" runs. Cron never sets this.
  force?: boolean
}

export interface ProcessScheduledResult {
  summary: {
    mode: 'dry-run' | 'production'
    due: number
    sent: number
    sentDryRun: number
    skippedLowConfidence: number
    skippedSuppressed: number
    skippedCap: number
    sendFailed: number
    dailyCap: number
    allowPatternGuess: boolean
    signoffMissing?: boolean
  }
  results: Array<{
    id: number
    slug: string
    shortName: string
    email: string
    decision:
      | 'sending'
      | 'skipped-suppressed'
      | 'skipped-low-confidence'
      | 'skipped-cap'
      | 'sent'
      | 'send-failed'
      | 'sent-dryrun'
    resendId?: string
    reason?: string
  }>
}

function isLowConfidenceEmail(email: string): boolean {
  const lower = email.toLowerCase()
  return /^(info|admin|reception|office|bookings|enquiries|hello|contact|mail)@/.test(lower)
}

export async function processScheduledSends(
  opts: ProcessScheduledOptions,
): Promise<ProcessScheduledResult> {
  const { dryRun, dailyCap, allowPatternGuess, force = false } = opts

  const signoff = await getTemplateSignoff('initial')
  if (!signoff.signedOffAt) {
    return {
      summary: {
        mode: dryRun ? 'dry-run' : 'production',
        due: 0,
        sent: 0,
        sentDryRun: 0,
        skippedLowConfidence: 0,
        skippedSuppressed: 0,
        skippedCap: 0,
        sendFailed: 0,
        dailyCap,
        allowPatternGuess,
        signoffMissing: true,
      },
      results: [],
    }
  }

  // Time-window filter:
  //  - Default (cron mode): scheduled_send_at <= NOW()
  //  - force=true: any clinic scheduled for the current UTC date — used
  //    when manually firing today's batch before its scheduled time.
  const { rows: due } = force
    ? await sql<QueueRow>`
        SELECT pc.id, pc.slug, pc.short_name, pc.contact_email, pc.contact_first_name,
               pc.scheduled_send_at, pc.next_template_slug, pc.status
        FROM prospect_clinics pc
        WHERE pc.status = 'approved'
          AND pc.scheduled_send_at IS NOT NULL
          AND pc.scheduled_send_at::date = CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM prospect_outreach_log ol
            WHERE ol.clinic_id = pc.id AND ol.template_slug = 'initial'
          )
        ORDER BY pc.scheduled_send_at ASC, pc.priority_wave ASC
        LIMIT 50
      `
    : await sql<QueueRow>`
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

  const results: ProcessScheduledResult['results'] = []
  let sentCount = 0
  const resendKey = process.env.RESEND_API_KEY

  for (const row of due) {
    if (sentCount >= dailyCap) {
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

    if (dryRun) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        decision: 'sent-dryrun', reason: 'would send (dry run)',
      })
      sentCount += 1
      continue
    }

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
      sentCount += 1
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        decision: 'send-failed', reason: message,
      })
    }
  }

  return {
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
    },
    results,
  }
}
