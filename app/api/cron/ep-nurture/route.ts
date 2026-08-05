/**
 * Cron Job: EP (Exercise Physiologist) Lead Nurture
 *
 * Vercel Cron: daily. Configured in vercel.json.
 *
 * Follows up the ESSA-newsletter lead burst captured with
 * signup_source = 'ep-course'. The capture form sends its own Day-0
 * confirmation; this cron fires the Day 3 → Day 21 nurture that converts
 * captured EP leads to the Concussion Rehabilitation Mastery course.
 *
 * Conventions mirror app/api/cron/send-nurture-emails/route.ts:
 *  - CRON_SECRET (timing-safe Bearer) OR isAdminRequest() for manual runs
 *  - primary-project guard (skip the secondary Vercel project)
 *  - email_suppression checked and FAIL CLOSED (abort run if it can't load)
 *  - users.nurture_unsubscribed honoured
 *  - email_audit_log INSERT-first dedupe, key `ep_nurture_day{N}_{userId}`
 *  - sendOrRollbackAudit: roll back the audit row when a send fails so the
 *    next run retries (sendEmail returns false, never throws)
 *  - one stage per run per user (findCatchUp picks the most-recent-eligible
 *    step; earlier missed stages fall outside the window and are silently
 *    skipped — the same pattern the rest of the codebase uses)
 */

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { loadUsers } from '@/lib/users'
import { userOwnsCrm } from '@/lib/crm-course'
import { sendEmail } from '@/lib/resend-client'
import { EP_NURTURE_SEQUENCE } from '@/lib/email-sequences'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { isAdminRequest } from '@/lib/require-admin'
import { sql } from '@/lib/db'
import { EmailScheduler } from '@/lib/email-scheduler'

function redact(e: string) {
  return e.length > 3 ? e.slice(0, 3) + '***' : '***'
}

// Catch-up window: a missed cron day must not permanently skip a step. Match
// when daysSince is within [e.day, e.day + CATCHUP_WINDOW_DAYS]. The per-step
// audit key (keyed on the step's day, not the calendar day) prevents
// double-sends inside the window. Pick the LATEST eligible step so a user who
// crossed two stages while the cron was down gets the most recent one.
const CATCHUP_WINDOW_DAYS = 2
function findCatchUp<T extends { day: number }>(seq: readonly T[], daysSince: number): T | undefined {
  let match: T | undefined
  for (const e of seq) {
    if (daysSince >= e.day && daysSince <= e.day + CATCHUP_WINDOW_DAYS) {
      if (!match || e.day > match.day) match = e
    }
  }
  return match
}

/**
 * Send + honour sendEmail's boolean contract. sendEmail never throws — it
 * returns false on failure — so the audit-log dedupe row inserted BEFORE the
 * send must be explicitly rolled back here, otherwise a failed send is
 * permanently marked as sent and never retried.
 */
async function sendOrRollbackAudit(
  options: Parameters<typeof sendEmail>[0],
  auditKey: string,
  label: string,
): Promise<boolean> {
  let sent = false
  try {
    sent = await sendEmail(options)
  } catch (err) {
    console.error(`[EP Nurture] ${label} send threw:`, err)
  }
  if (!sent) {
    console.error(`[EP Nurture] ${label} → ${redact(options.to)} failed — rolling back audit row so next run retries`)
    try {
      await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`
    } catch (err) {
      console.error(`[EP Nurture] Failed to roll back audit row ${auditKey}:`, err)
    }
  }
  return sent
}

export const maxDuration = 120

export async function GET(request: Request) {
  try {
    // Guard: only run on the primary project (custom domain). Prevents
    // duplicate cron runs from the second Vercel project.
    const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
    if (prodUrl && !prodUrl.includes('concussion-education-australia.com')) {
      return NextResponse.json({ skipped: true, reason: 'Not primary project' })
    }

    // Auth: CRON_SECRET Bearer (timing-safe) OR an authenticated admin request
    // (cookie / x-admin-key) for manual triggering.
    const authHeader = request.headers.get('authorization')
    const secret = process.env.CRON_SECRET
    let authorized = false
    if (secret) {
      const expected = `Bearer ${secret}`
      if (authHeader && authHeader.length === expected.length && crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) {
        authorized = true
      }
    }
    if (!authorized && isAdminRequest(request)) authorized = true
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure audit table exists (prevents silent failures if it was dropped).
    await sql`CREATE TABLE IF NOT EXISTS email_audit_log (audit_key TEXT PRIMARY KEY, sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`

    // Global suppression list — FAIL CLOSED. If it can't be read we abort the
    // whole run rather than proceed with an empty set (which would email
    // suppressed addresses). Unsubs are zero-tolerance.
    let suppressedEmails: Set<string>
    try {
      const { rows } = await sql<{ email: string }>`SELECT LOWER(email) AS email FROM email_suppression`
      suppressedEmails = new Set(rows.map((r) => r.email))
      // register-quiet (2026-08-03): workshop-interest registrants are
      // date-waiting — no drip; their next touch is the date announcement.
      const { rows: regRows } = await sql<{ email: string }>`SELECT DISTINCT LOWER(email) AS email FROM workshop_interest`
      for (const r of regRows) suppressedEmails.add(r.email)
    } catch (err) {
      console.error('[EP Nurture] Failed to load email_suppression — ABORTING run (fail closed):', err)
      return NextResponse.json(
        { error: 'email_suppression load failed — run aborted (fail closed)' },
        { status: 503 },
      )
    }

    const allUsers = await loadUsers()
    // Only EP-course leads, minus unsubscribes, suppressed addresses and
    // internal test accounts.
    const candidates = allUsers.filter(
      (u) =>
        u.signupSource === 'ep-course' &&
        !u.nurtureUnsubscribed &&
        !u.isTest &&
        !suppressedEmails.has(u.email.toLowerCase()),
    )
    // OWNERS OUT (2026-08-05 final sweep #8): the CRM purchase webhook stamps
    // buyers signup_source='ep-course' too — paying customers were getting
    // the days-3/7/14/21 SELL sequence for the course they own. Mirrors
    // completer-conversion's exclusion.
    const users: typeof candidates = []
    for (const u of candidates) {
      if (!(await userOwnsCrm(u.email))) users.push(u)
    }

    const now = new Date()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const courseLink = `${baseUrl}/concussion-rehab-mastery`
    const scheduler = new EmailScheduler()
    let emailsSent = 0
    const errors: string[] = []

    for (const user of users) {
      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      // Day 0 confirmation is sent by the capture form — never fire it here.
      if (daysSinceSignup < EP_NURTURE_SEQUENCE[0].day) continue

      const stage = findCatchUp(EP_NURTURE_SEQUENCE, daysSinceSignup)
      if (!stage) continue

      // INSERT-first dedupe. If the row already exists (rowCount 0), this stage
      // was already sent — skip. One stage per run per user.
      const auditKey = `ep_nurture_day${stage.day}_${user.id}`
      const { rowCount: inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
      if (!inserted || inserted === 0) continue

      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      const html = stage.template(user.name || 'there', courseLink)
        .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

      const sent = await sendOrRollbackAudit({
        to: user.email,
        scheduledAt: scheduler.next(user.email),
        subject: stage.subject,
        html,
        tags: [
          { name: 'sequence', value: 'ep-nurture' },
          { name: 'day', value: String(stage.day) },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }, auditKey, `Day ${stage.day}`)

      if (sent) {
        emailsSent++
        console.log(`[EP Nurture] Day ${stage.day} → ${redact(user.email)}`)
      } else {
        errors.push(`ep-nurture day${stage.day}: send failed`)
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      totalUsers: users.length,
      ...(errors.length > 0 ? { errors } : {}),
    })
  } catch (error) {
    console.error('[EP Nurture] Cron job error:', error)
    return NextResponse.json({ error: 'Failed to send EP nurture emails' }, { status: 500 })
  }
}
