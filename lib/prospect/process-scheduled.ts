/**
 * Shared core for prospect cold-outreach scheduled sends.
 *
 * Both the admin POST handler (`/api/admin/prospect-process-scheduled`) and
 * the Vercel cron GET handler (`/api/cron/prospect-process-scheduled`) call
 * into this. Logic isn't duplicated.
 *
 * Sequence model:
 *   T1 'initial'  → T2 'followup' (+4 business days) → T3 'final' (+5 BD) → DONE
 *
 * The cron sends whatever `next_template_slug` says, then advances state:
 *   - After 'initial' sent:  next='followup', scheduled = today + 4 BD, status='sent'
 *   - After 'followup' sent: next='final',    scheduled = today + 5 BD
 *   - After 'final' sent:    next=NULL,       scheduled=NULL  (sequence end)
 *
 * Guardrails:
 *  - next_template_slug not NULL (anything else is sequence-complete / archived)
 *  - signoff required for the specific template being sent
 *  - status NOT IN ('archived','lost','bounced','engaged','won') — engaged
 *    clinics already clicked; auto-following-up would be aggressive. 'lost'
 *    and 'bounced' are opt-outs already handled by the suppression invariant.
 *  - high-confidence email source only (rejects info@/admin@/etc unless
 *    allowPatternGuess=true)
 *  - email_suppression check
 *  - daily cap (adaptive, computed in cron)
 *  - no double-send: NOT EXISTS outreach_log row for the same template
 */
import { Resend } from 'resend'
import { sql } from '@vercel/postgres'
import {
  getClinicById,
  getTemplateSignoff,
  isSuppressed,
  logOutreach,
} from '@/lib/prospect/repo'
import { EMAIL_TEMPLATES, mergeTemplate } from '@/lib/prospect/email-templates'
import type { EmailTemplateSlug } from '@/lib/prospect/types'

const COLD_FROM = 'Zac Lewis <partnerships@concussion-education-australia.com>'
const REPLY_TO = 'zac@concussion-education-australia.com'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.concussion-education-australia.com'

const FOLLOWUP_GAP_BUSINESS_DAYS = 4 // T1 → T2
const FINAL_GAP_BUSINESS_DAYS = 5    // T2 → T3

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
  // Bypass the "scheduled_send_at <= NOW()" filter. Fires every eligible
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
    skippedSignoffMissing: number
    sendFailed: number
    dailyCap: number
    allowPatternGuess: boolean
    byTemplate: { initial: number; followup: number; final: number }
  }
  results: Array<{
    id: number
    slug: string
    shortName: string
    email: string
    template: EmailTemplateSlug | null
    decision:
      | 'skipped-suppressed'
      | 'skipped-low-confidence'
      | 'skipped-cap'
      | 'skipped-signoff-missing'
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

// Skip weekends. Result is at 00:00 UTC so the morning cron picks it up.
function addBusinessDays(from: Date, n: number): Date {
  const d = new Date(from)
  d.setUTCHours(0, 0, 0, 0)
  let added = 0
  while (added < n) {
    d.setUTCDate(d.getUTCDate() + 1)
    const dow = d.getUTCDay()
    if (dow !== 0 && dow !== 6) added += 1
  }
  return d
}

function isValidTemplateSlug(s: string | null): s is EmailTemplateSlug {
  return s === 'initial' || s === 'followup' || s === 'final'
}

export async function processScheduledSends(
  opts: ProcessScheduledOptions,
): Promise<ProcessScheduledResult> {
  const { dryRun, dailyCap, allowPatternGuess, force = false } = opts

  // Pre-load signoff state for every template so we can per-row skip
  // without re-querying.
  const signoffByTemplate = new Map<EmailTemplateSlug, boolean>()
  for (const slug of ['initial', 'followup', 'final'] as const) {
    const so = await getTemplateSignoff(slug)
    signoffByTemplate.set(slug, !!so.signedOffAt)
  }

  // Driver query: every clinic whose next_template_slug says something is
  // due, that's not in a dead state, and that hasn't already had this
  // specific template logged.
  const { rows: due } = force
    ? await sql<QueueRow>`
        SELECT pc.id, pc.slug, pc.short_name, pc.contact_email, pc.contact_first_name,
               pc.scheduled_send_at, pc.next_template_slug, pc.status
        FROM prospect_clinics pc
        WHERE pc.next_template_slug IS NOT NULL
          AND pc.status NOT IN ('archived', 'lost', 'bounced', 'engaged', 'won')
          AND pc.scheduled_send_at IS NOT NULL
          AND pc.scheduled_send_at::date = CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM prospect_outreach_log ol
            WHERE ol.clinic_id = pc.id AND ol.template_slug = pc.next_template_slug
          )
        ORDER BY pc.scheduled_send_at ASC, pc.priority_wave ASC
        LIMIT 50
      `
    : await sql<QueueRow>`
        SELECT pc.id, pc.slug, pc.short_name, pc.contact_email, pc.contact_first_name,
               pc.scheduled_send_at, pc.next_template_slug, pc.status
        FROM prospect_clinics pc
        WHERE pc.next_template_slug IS NOT NULL
          AND pc.status NOT IN ('archived', 'lost', 'bounced', 'engaged', 'won')
          AND pc.scheduled_send_at IS NOT NULL
          AND pc.scheduled_send_at <= NOW()
          AND NOT EXISTS (
            SELECT 1 FROM prospect_outreach_log ol
            WHERE ol.clinic_id = pc.id AND ol.template_slug = pc.next_template_slug
          )
        ORDER BY pc.scheduled_send_at ASC, pc.priority_wave ASC
        LIMIT 50
      `

  const results: ProcessScheduledResult['results'] = []
  let sentCount = 0
  const resendKey = process.env.RESEND_API_KEY

  for (const row of due) {
    const templateSlug = row.next_template_slug
    if (!isValidTemplateSlug(templateSlug)) {
      // Defensive — DB has a slug we don't know how to handle. Skip.
      continue
    }

    if (sentCount >= dailyCap) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'skipped-cap', reason: `daily cap ${dailyCap} reached`,
      })
      continue
    }
    if (!signoffByTemplate.get(templateSlug)) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'skipped-signoff-missing',
        reason: `${templateSlug} template not signed off — POST /api/admin/prospect-template-signoff`,
      })
      continue
    }
    if (await isSuppressed(row.contact_email)) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'skipped-suppressed', reason: 'on suppression list',
      })
      continue
    }
    if (isLowConfidenceEmail(row.contact_email) && !allowPatternGuess) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'skipped-low-confidence',
        reason: 'generic mailbox (info@/admin@/etc) — verify direct founder email first',
      })
      continue
    }

    if (dryRun) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'sent-dryrun', reason: `would send ${templateSlug} (dry run)`,
      })
      sentCount += 1
      continue
    }

    if (!resendKey) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'send-failed', reason: 'RESEND_API_KEY missing',
      })
      continue
    }

    const clinic = await getClinicById(row.id)
    if (!clinic) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'send-failed', reason: 'clinic vanished mid-query',
      })
      continue
    }

    const template = EMAIL_TEMPLATES.find((t) => t.slug === templateSlug)!
    const unsubToken = `${clinic.slug}-${Date.now().toString(36)}`
    const { subject, html, text } = mergeTemplate(template, clinic, BASE_URL, unsubToken)
    const auditKey = `outreach:${clinic.slug}:${templateSlug}:cron:${Date.now()}`

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
          'X-Template-Slug': templateSlug,
        },
        tags: [
          { name: 'prospect-id', value: String(clinic.id) },
          { name: 'template', value: templateSlug },
          { name: 'mode', value: 'production-cron' },
        ],
      })

      if (result.error) {
        results.push({
          id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
          template: templateSlug,
          decision: 'send-failed', reason: JSON.stringify(result.error).slice(0, 200),
        })
        continue
      }

      await logOutreach({
        clinicId: clinic.id,
        templateSlug: templateSlug,
        emailSubject: subject,
        emailBody: text,
        resendEmailId: result.data?.id ?? null,
        auditKey,
      })

      // Advance sequence state — drives the next cron run.
      if (templateSlug === 'initial') {
        const nextScheduled = addBusinessDays(new Date(), FOLLOWUP_GAP_BUSINESS_DAYS).toISOString()
        await sql`
          UPDATE prospect_clinics
          SET next_template_slug = 'followup',
              scheduled_send_at = ${nextScheduled},
              status = CASE WHEN status IN ('researching', 'approved') THEN 'sent' ELSE status END,
              updated_at = NOW()
          WHERE id = ${clinic.id}
        `
      } else if (templateSlug === 'followup') {
        const nextScheduled = addBusinessDays(new Date(), FINAL_GAP_BUSINESS_DAYS).toISOString()
        await sql`
          UPDATE prospect_clinics
          SET next_template_slug = 'final',
              scheduled_send_at = ${nextScheduled},
              updated_at = NOW()
          WHERE id = ${clinic.id}
        `
      } else if (templateSlug === 'final') {
        await sql`
          UPDATE prospect_clinics
          SET next_template_slug = NULL,
              scheduled_send_at = NULL,
              updated_at = NOW()
          WHERE id = ${clinic.id}
        `
      }

      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'sent', resendId: result.data?.id,
      })
      sentCount += 1
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'send-failed', reason: message,
      })
    }
  }

  const byTemplate = { initial: 0, followup: 0, final: 0 }
  for (const r of results) {
    if (r.template && (r.decision === 'sent' || r.decision === 'sent-dryrun')) {
      byTemplate[r.template] += 1
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
      skippedSignoffMissing: results.filter((r) => r.decision === 'skipped-signoff-missing').length,
      sendFailed: results.filter((r) => r.decision === 'send-failed').length,
      dailyCap,
      allowPatternGuess,
      byTemplate,
    },
    results,
  }
}
