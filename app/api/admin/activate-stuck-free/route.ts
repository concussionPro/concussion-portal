/**
 * One-off admin endpoint: send FREE_LOGGED_IN_NO_PROGRESS to preview
 * users who logged in at least once but have 0/3 SCAT modules completed.
 *
 * Most of these users are past the Day 7 trigger window of the cron, so
 * the new variant won't reach them automatically. This catches them up.
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
import { generateMagicLinkJWT } from '@/lib/magic-link-jwt'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { FREE_LOGGED_IN_NO_PROGRESS } from '@/lib/email-sequences'

export const maxDuration = 60

async function findTargets() {
  const { rows } = await sql`
    SELECT u.id, u.email, u.name, up.progress
    FROM users u
    LEFT JOIN user_progress up ON up.user_id = u.id
    WHERE u.access_level = 'preview'
      AND u.last_login_at IS NOT NULL
      AND COALESCE(u.nurture_unsubscribed, false) = false
  `
  const targets: Array<{ id: string; email: string; name: string }> = []
  for (const r of rows as any[]) {
    let done = 0
    if (r.progress) {
      for (const m of [101, 102, 103]) if (r.progress[String(m)]?.completed) done++
    }
    if (done === 0) {
      targets.push({ id: r.id, email: r.email, name: r.name || 'there' })
    }
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
    const auditKey = `free_activate_logged_in_${t.id}`
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
      const loginLink = generateMagicLinkJWT(t.id, t.email, t.name, 'preview', baseUrl)
      const unsubToken = generateUnsubscribeToken(t.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(t.email)}&token=${unsubToken}`
      const html = FREE_LOGGED_IN_NO_PROGRESS.template(t.name, loginLink)
        .replace('{{unsubscribe_url}}', unsubscribeUrl)
      await sendEmail({
        to: t.email,
        subject: FREE_LOGGED_IN_NO_PROGRESS.subject,
        html,
        tags: [
          { name: 'sequence', value: 'scat-mastery' },
          { name: 'variant', value: 'logged_in_no_progress_catchup' },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
      sent++
    } catch (err) {
      console.error(`[activate-stuck-free] Failed for ${t.email}:`, err)
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
