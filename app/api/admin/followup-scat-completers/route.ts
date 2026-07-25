/**
 * Send SCAT_COMPLETER_PERSONAL_FOLLOWUP to preview users who:
 *  - completed all 3 SCAT modules (101/102/103)
 *  - are still access_level='preview' (didn't convert)
 *  - haven't unsubscribed
 *  - haven't already received this follow-up
 *
 * Targets the 9 high-intent free-course completers who got the standard
 * SCAT_COMPLETION_UPSELL but didn't buy. The personal-tone follow-up is
 * a different angle (single question, reply-driven) intended to surface
 * the actual friction.
 *
 * GET ?dryRun=1 → preview targets, no sends.
 * POST          → actually send.
 *
 * Auth: x-admin-key / Bearer / admin cookie.
 * Idempotent — uses email_audit_log to skip anyone already sent.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail } from '@/lib/resend-client'
import { isAdminRequest } from '@/lib/require-admin'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { SCAT_COMPLETER_PERSONAL_FOLLOWUP } from '@/lib/email-sequences'

export const maxDuration = 60

async function findTargets() {
  const { rows } = await sql`
    SELECT u.id, u.email, u.name, up.progress
    FROM users u
    JOIN user_progress up ON up.user_id = u.id
    WHERE u.access_level = 'preview'
      -- A CRM (EP stream) buyer's access_level stays 'preview' because the two
      -- streams are isolated (lib/crm-course.ts). Excluded here so a PAYING EP
      -- customer is never swept into the free-course funnel.
      AND NOT EXISTS (
        SELECT 1 FROM course_purchases cp
        WHERE LOWER(cp.user_email) = LOWER(u.email) AND cp.course_slug = 'crm'
      )
      AND COALESCE(u.nurture_unsubscribed, false) = false
  `
  const targets: Array<{ id: string; email: string; name: string }> = []
  for (const r of rows as any[]) {
    let scat = 0
    if (r.progress) {
      for (const m of [101, 102, 103]) if (r.progress[String(m)]?.completed) scat++
    }
    if (scat === 3) targets.push({ id: r.id, email: r.email, name: r.name || 'there' })
  }
  return targets
}

async function handle(request: NextRequest, dryRun: boolean) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const targets = await findTargets()

  if (dryRun) {
    return NextResponse.json({ dryRun: true, count: targets.length, targets: targets.map((t) => ({ email: t.email, name: t.name })) })
  }

  let sent = 0
  let skipped = 0
  let errors = 0
  for (const t of targets) {
    // v2 audit key — switched to click-tracked button format. v1 entries
    // (reply-with-letter) stay in the log but don't dedup the new send.
    const auditKey = `scat_completer_personal_v2_${t.id}`
    const { rowCount: inserted } = await sql`
      INSERT INTO email_audit_log (audit_key, sent_at)
      VALUES (${auditKey}, NOW())
      ON CONFLICT (audit_key) DO NOTHING
    `
    if (!inserted || inserted === 0) {
      skipped++
      continue
    }

    try {
      const unsubToken = generateUnsubscribeToken(t.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(t.email)}&token=${unsubToken}`
      const html = SCAT_COMPLETER_PERSONAL_FOLLOWUP.template(t.name, t.id, baseUrl)
        .replace('{{unsubscribe_url}}', unsubscribeUrl)
      await sendEmail({
        to: t.email,
        subject: SCAT_COMPLETER_PERSONAL_FOLLOWUP.subject,
        html,
        tags: [
          { name: 'sequence', value: 'scat-completer-followup' },
          { name: 'variant', value: 'personal_question' },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
      sent++
    } catch (err) {
      console.error(`[followup-scat-completers] Failed for ${t.email}:`, err)
      errors++
    }
  }
  return NextResponse.json({ ok: true, found: targets.length, sent, skipped, errors })
}

export async function GET(request: NextRequest) {
  const dry = new URL(request.url).searchParams.get('dryRun') !== '0'
  return handle(request, dry)
}
export async function POST(request: NextRequest) {
  return handle(request, false)
}
