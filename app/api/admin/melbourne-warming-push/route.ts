/**
 * Send MELBOURNE_WORKSHOP_PUSH to warming preview leads.
 *
 * Targets:
 *  - access_level = 'preview'
 *  - nurture_unsubscribed = false (or null)
 *  - completed at least 2 of 3 SCAT modules (101/102/103)
 *  - signed up within the last 90 days (filters out long-dormant ghosts)
 *  - haven't already received this push (audit key `melbourne_push_v1_{userId}`)
 *
 * GET ?dryRun=1                       → preview targets, no sends (default for GET)
 * GET ?dryRun=0                       → actually send (use POST instead in normal flow)
 * POST                                → actually send
 * POST ?retry=foo@bar.com,baz@qux.com → DELETE the audit-keys for those emails first,
 *                                       so the next pass re-attempts the send. Used to
 *                                       recover from prior silent failures (e.g. Resend
 *                                       suppression-list rejection where the audit-key
 *                                       was written but no send fired).
 *
 * Auth: x-admin-key / Bearer / admin cookie (via isAdminRequest).
 * Idempotent — re-runs skip anyone already in email_audit_log.
 *
 * Failure semantics: if sendEmail returns false (Resend API rejected — suppression
 * list, validation error, transient API failure) the audit-key is rolled back so a
 * future POST can retry. Same for thrown exceptions. Without this rollback, a silent
 * Resend rejection would mark the user "sent" forever and lock them out of the push.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail } from '@/lib/resend-client'
import { isAdminRequest } from '@/lib/require-admin'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { MELBOURNE_WORKSHOP_PUSH } from '@/lib/email-sequences'
import { EmailScheduler } from '@/lib/email-scheduler'

export const maxDuration = 60

interface Target {
  id: string
  email: string
  name: string
  scatCompleted: number
}

// Manual exclusions for the v1 push:
//  - info@evergreenosteopathy.com.au  → clinic-shared inbox, prefer direct outreach
//  - bronwyn.claassen@disney.com      → corporate Disney domain, aggressive spam filtering
// Stored as a Set of lowercased emails so the comparison is case-insensitive.
const EXCLUDED_EMAILS = new Set<string>([
  'info@evergreenosteopathy.com.au',
  'bronwyn.claassen@disney.com',
])

async function findTargets(): Promise<Target[]> {
  const { rows } = await sql`
    SELECT u.id, u.email, u.name, up.progress
    FROM users u
    LEFT JOIN user_progress up ON up.user_id = u.id
    WHERE u.access_level = 'preview'
      -- A CRM (EP stream) buyer's access_level stays 'preview' because the two
      -- streams are isolated (lib/crm-course.ts). Excluded here so a PAYING EP
      -- customer is never swept into the free-course funnel.
      AND NOT EXISTS (
        SELECT 1 FROM course_purchases cp
        WHERE LOWER(cp.user_email) = LOWER(u.email) AND cp.course_slug = 'crm'
      )
      AND COALESCE(u.nurture_unsubscribed, false) = false
      AND COALESCE(u.is_test, false) = false
      -- Master blacklist — nurture_unsubscribed alone misses bounces,
      -- complaints, STOP replies and cold-prospect unsubs.
      AND NOT EXISTS (
        SELECT 1 FROM email_suppression es WHERE LOWER(es.email) = LOWER(u.email)
      )
      AND u.created_at > NOW() - INTERVAL '90 days'
  `

  const targets: Target[] = []
  for (const r of rows as Array<{ id: string; email: string; name: string | null; progress: Record<string, { completed?: boolean }> | null }>) {
    let scat = 0
    if (r.progress) {
      for (const m of [101, 102, 103]) {
        if (r.progress[String(m)]?.completed) scat++
      }
    }
    if (scat >= 2 && !EXCLUDED_EMAILS.has(r.email.toLowerCase())) {
      targets.push({
        id: r.id,
        email: r.email,
        name: r.name || 'there',
        scatCompleted: scat,
      })
    }
  }

  // Highest intent first: 3/3 completers ahead of 2/3 incomplete
  targets.sort((a, b) => b.scatCompleted - a.scatCompleted)
  return targets
}

/**
 * Parse a comma-separated `retry` query param into a lowercased Set.
 * Strips whitespace; ignores empty entries.
 */
function parseRetrySet(url: string): Set<string> {
  const raw = new URL(url).searchParams.get('retry')
  if (!raw) return new Set()
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0)
  )
}

/**
 * Delete audit-key rows for the given user IDs so a subsequent INSERT will succeed.
 * Returns the count actually deleted (for logging).
 */
async function clearAuditKeys(userIds: string[]): Promise<number> {
  if (userIds.length === 0) return 0
  // Vercel's sql template tag doesn't accept arrays as parameters, so loop.
  // Volumes here are tiny (≤20 retries at a time) — sequential is fine.
  let total = 0
  for (const id of userIds) {
    const auditKey = `melbourne_push_v1_${id}`
    const { rowCount } = await sql`
      DELETE FROM email_audit_log WHERE audit_key = ${auditKey}
    `
    total += rowCount ?? 0
  }
  return total
}

async function handle(request: NextRequest, dryRun: boolean) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const pricingLink = `${baseUrl}/pricing`
  const targets = await findTargets()
  const retryEmails = parseRetrySet(request.url)

  // Resolve which target user IDs match the retry list, then clear their audit-keys.
  // Only relevant on POST — dryRun has no side effects.
  let retryCleared: string[] = []
  if (!dryRun && retryEmails.size > 0) {
    const matched = targets.filter((t) => retryEmails.has(t.email.toLowerCase()))
    retryCleared = matched.map((t) => t.email)
    await clearAuditKeys(matched.map((t) => t.id))
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      count: targets.length,
      pricingLink,
      subject: MELBOURNE_WORKSHOP_PUSH.subject,
      targets: targets.map((t) => ({
        email: t.email,
        name: t.name,
        scatCompleted: `${t.scatCompleted}/3`,
      })),
    })
  }

  const scheduler = new EmailScheduler()
  let sent = 0
  let skipped = 0
  let failed = 0
  let errors = 0
  const failures: Array<{ email: string; reason: string }> = []

  for (const t of targets) {
    const auditKey = `melbourne_push_v1_${t.id}`
    const { rowCount: inserted } = await sql`
      INSERT INTO email_audit_log (audit_key, sent_at)
      VALUES (${auditKey}, NOW())
      ON CONFLICT (audit_key) DO NOTHING
    `
    if (!inserted || inserted === 0) {
      skipped++
      continue
    }

    let ok = false
    try {
      const unsubToken = generateUnsubscribeToken(t.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(t.email)}&token=${unsubToken}`
      const html = MELBOURNE_WORKSHOP_PUSH.template(t.name, pricingLink)
        .replace('{{unsubscribe_url}}', unsubscribeUrl)

      ok = await sendEmail({
        to: t.email,
        scheduledAt: scheduler.next(t.email),
        subject: MELBOURNE_WORKSHOP_PUSH.subject,
        html,
        tags: [
          { name: 'sequence', value: 'melbourne-push' },
          { name: 'variant', value: 'v1' },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
    } catch (err) {
      console.error(`[melbourne-warming-push] Threw for ${t.email}:`, err)
      errors++
      failures.push({ email: t.email, reason: err instanceof Error ? err.message : String(err) })
      // Roll back the audit-key so a future POST can retry
      await clearAuditKeys([t.id])
      continue
    }

    if (ok) {
      sent++
    } else {
      // Resend API returned an error response (e.g. suppression list, validation
      // error). sendEmail logs the detail to console.error. Surface the failure
      // and roll back the audit-key.
      failed++
      failures.push({ email: t.email, reason: 'sendEmail returned false (see Vercel runtime logs for Resend API error detail)' })
      await clearAuditKeys([t.id])
    }
  }

  return NextResponse.json({
    ok: true,
    found: targets.length,
    sent,
    skipped,
    failed,
    errors,
    retryCleared,
    failures,
  })
}

// GET is ALWAYS a dry run — the admin cookie is sameSite 'lax' and middleware's
// CSRF check only guards unsafe methods, so `?dryRun=0` on GET meant one clicked
// cross-site link could blast real email at the whole warming list, and
// `?dryRun=0&retry=` could additionally DELETE the send-dedupe audit keys and
// re-send to people already emailed. Sending requires POST.
export async function GET(request: NextRequest) {
  return handle(request, true)
}

export async function POST(request: NextRequest) {
  return handle(request, false)
}
