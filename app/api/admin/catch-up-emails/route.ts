/**
 * One-time catch-up email sender for users who missed nurture sequences
 * due to RESEND_API_KEY being unset.
 *
 * For each user, checks email_audit_log to see what they actually received,
 * then sends the single most relevant email based on their current state.
 *
 * GET  ?dryRun=true  — preview what would be sent (no emails)
 * POST               — actually send catch-up emails
 *
 * Requires x-admin-key header.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { loadUsers } from '@/lib/users'
import { sendEmail } from '@/lib/resend-client'
import { sql } from '@/lib/db'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import {
  SCAT_MASTERY_SEQUENCE,
  FREE_USER_REENGAGEMENT,
  SCAT_DAY10_ENGAGEMENT,
  SCAT_COMPLETION_UPSELL,
  FREE_ALMOST_DONE,
  POST_PURCHASE_SEQUENCE,
  REENGAGEMENT_EMAIL,
} from '@/lib/email-sequences'

export const maxDuration = 120

function timingSafeCompare(a: string, b: string): boolean {
  const aH = crypto.createHmac('sha256', 'cmp').update(a).digest()
  const bH = crypto.createHmac('sha256', 'cmp').update(b).digest()
  return crypto.timingSafeEqual(aH, bH)
}

interface CatchUpAction {
  email: string
  name: string
  accessLevel: string
  daysSinceSignup: number
  scatModules: number
  paidModules: number
  hasLoggedIn: boolean
  emailsReceived: number
  action: string
  subject: string
}

export async function GET(request: NextRequest) {
  return handleCatchUp(request, true)
}

export async function POST(request: NextRequest) {
  return handleCatchUp(request, false)
}

async function handleCatchUp(request: NextRequest, dryRun: boolean) {
  const adminKey = request.headers.get('x-admin-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  if (!process.env.ADMIN_API_KEY || !adminKey || !timingSafeCompare(adminKey, process.env.ADMIN_API_KEY)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Allow dryRun override via query param
  const url = new URL(request.url)
  if (url.searchParams.get('dryRun') === 'true') dryRun = true

  const users = await loadUsers()
  const now = new Date()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const actions: CatchUpAction[] = []
  let sent = 0
  let skipped = 0

  for (const user of users) {
    if (user.nurtureUnsubscribed) { skipped++; continue }

    const signupDate = new Date(user.createdAt)
    const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

    // Skip users who signed up today or yesterday — they'll get normal sequence
    if (daysSinceSignup < 2) { skipped++; continue }

    // Check how many audit log entries exist for this user (= emails they actually received)
    const { rows: auditRows } = await sql`
      SELECT COUNT(*) as cnt FROM email_audit_log
      WHERE audit_key LIKE ${'%_' + user.id}
    `
    const emailsReceived = Number(auditRows[0]?.cnt || 0)

    // If they've received 2+ emails, the sequence was partially working — skip
    if (emailsReceived >= 2) { skipped++; continue }

    // Load progress
    let scatCompleted = 0
    let paidCompleted = 0
    try {
      const { rows: progressRows } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
      if (progressRows.length > 0 && progressRows[0].progress) {
        const progress = progressRows[0].progress
        for (let i = 101; i <= 106; i++) {
          if (progress[String(i)]?.completed) scatCompleted++
        }
        for (let i = 1; i <= 8; i++) {
          if (progress[String(i)]?.completed) paidCompleted++
        }
      }
    } catch { /* no progress record */ }

    const hasLoggedIn = !!user.lastLoginAt
    const loginLink = `${baseUrl}/login?redirect=/learning`
    const pricingLink = `${baseUrl}/pricing`
    const unsubToken = generateUnsubscribeToken(user.email)
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

    let html: string | null = null
    let subject: string | null = null
    let actionDesc: string | null = null
    let auditKey: string | null = null

    // ── PREVIEW (FREE) USERS ──
    if (user.accessLevel === 'preview') {
      if (scatCompleted === 6) {
        // Completed all SCAT modules — send completion upsell
        subject = SCAT_COMPLETION_UPSELL.subject
        html = SCAT_COMPLETION_UPSELL.template(user.name || 'there', pricingLink)
        actionDesc = 'scat-completion-upsell (completed all 6 SCAT modules)'
        auditKey = `catchup_scat_complete_${user.id}`
      } else if (scatCompleted === 5) {
        // Almost done — one more module
        subject = FREE_ALMOST_DONE.subject
        html = FREE_ALMOST_DONE.template(user.name || 'there', loginLink)
        actionDesc = 'free-almost-done (5/6 SCAT modules)'
        auditKey = `catchup_free_almost_${user.id}`
      } else if (!hasLoggedIn) {
        // Never logged in — re-engagement
        subject = FREE_USER_REENGAGEMENT.subject
        html = FREE_USER_REENGAGEMENT.template(user.name || 'there', loginLink)
        actionDesc = 'free-reengagement (never logged in)'
        auditKey = `catchup_free_reengagement_${user.id}`
      } else if (scatCompleted < 3) {
        // Logged in but low progress — encouragement
        subject = SCAT_DAY10_ENGAGEMENT.subject
        html = SCAT_DAY10_ENGAGEMENT.template(user.name || 'there', loginLink, scatCompleted)
        actionDesc = `scat-engagement (${scatCompleted}/6 modules)`
        auditKey = `catchup_scat_engagement_${user.id}`
      } else {
        // 3-4 modules done, engaged — send the Day 14 full course breakdown
        const day14 = SCAT_MASTERY_SEQUENCE.find(e => e.day === 14)!
        subject = day14.subject
        html = day14.template(user.name || 'there', pricingLink)
        actionDesc = `scat-day14-cpd-breakdown (${scatCompleted}/6 modules, engaged)`
        auditKey = `catchup_scat_day14_${user.id}`
      }
    }

    // ── PAID USERS ──
    if (user.accessLevel === 'online-only' || user.accessLevel === 'full-course') {
      if (paidCompleted === 7) {
        // Almost done — 7/8 modules
        const { ALMOST_DONE_EMAIL } = await import('@/lib/email-sequences')
        subject = ALMOST_DONE_EMAIL.subject
        html = ALMOST_DONE_EMAIL.template(user.name || 'there', loginLink)
        actionDesc = 'almost-done (7/8 modules)'
        auditKey = `catchup_almost_done_${user.id}`
      } else if (!hasLoggedIn || (user.lastLoginAt && (now.getTime() - new Date(user.lastLoginAt).getTime()) > 7 * 24 * 60 * 60 * 1000)) {
        // Inactive for 7+ days or never logged in
        subject = REENGAGEMENT_EMAIL.subject
        html = REENGAGEMENT_EMAIL.template(user.name || 'there', loginLink)
        actionDesc = 'paid-reengagement (inactive 7+ days)'
        auditKey = `catchup_paid_reengagement_${user.id}`
      } else if (daysSinceSignup >= 3 && paidCompleted < 4) {
        // Early in course — send day 3 nudge
        const day3 = POST_PURCHASE_SEQUENCE.find(e => e.day === 3)
        if (day3) {
          subject = day3.subject
          html = day3.template(user.name || 'there', loginLink)
          actionDesc = `paid-day3-nudge (${paidCompleted}/8 modules)`
          auditKey = `catchup_paid_day3_${user.id}`
        }
      } else {
        skipped++
        continue
      }
    }

    if (!html || !subject || !auditKey) { skipped++; continue }

    // Dedup — check if catch-up already sent (don't INSERT on dry run)
    const { rows: existingAudit } = await sql`
      SELECT 1 FROM email_audit_log WHERE audit_key = ${auditKey} LIMIT 1
    `
    if (existingAudit.length > 0) { skipped++; continue }

    html = html.replace('{{unsubscribe_url}}', unsubscribeUrl)

    const action: CatchUpAction = {
      email: user.email,
      name: user.name || '(no name)',
      accessLevel: user.accessLevel,
      daysSinceSignup,
      scatModules: scatCompleted,
      paidModules: paidCompleted,
      hasLoggedIn,
      emailsReceived,
      action: actionDesc!,
      subject,
    }
    actions.push(action)

    if (!dryRun) {
      // Claim the audit key before sending
      const { rowCount: inserted } = await sql`
        INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING
      `
      if (inserted === 0) { skipped++; continue }

      try {
        await sendEmail({
          to: user.email,
          subject,
          html,
          tags: [
            { name: 'sequence', value: 'catch-up' },
            { name: 'action', value: actionDesc! },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
        sent++
      } catch (err) {
        console.error(`[Catch-up] Failed to send to ${user.email}:`, err)
        // Remove audit entry so it can be retried
        await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`
        actions[actions.length - 1].action = `FAILED: ${actionDesc}`
      }
    } else {
      sent++
    }
  }

  return NextResponse.json({
    dryRun,
    summary: {
      totalUsers: users.length,
      wouldSend: actions.length,
      sent: dryRun ? 0 : sent,
      skipped,
    },
    actions,
  })
}
