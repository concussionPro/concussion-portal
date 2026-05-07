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
 * GET ?dryRun=1   → preview targets, no sends (default for GET)
 * GET ?dryRun=0   → actually send (use POST instead in normal flow)
 * POST            → actually send
 *
 * Auth: x-admin-key / Bearer / admin cookie (via isAdminRequest).
 * Idempotent — re-runs skip anyone already in email_audit_log.
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

async function findTargets(): Promise<Target[]> {
  const { rows } = await sql`
    SELECT u.id, u.email, u.name, up.progress
    FROM users u
    LEFT JOIN user_progress up ON up.user_id = u.id
    WHERE u.access_level = 'preview'
      AND COALESCE(u.nurture_unsubscribed, false) = false
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
    if (scat >= 2) {
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

async function handle(request: NextRequest, dryRun: boolean) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const pricingLink = `${baseUrl}/pricing`
  const targets = await findTargets()

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
  let errors = 0

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

    try {
      const unsubToken = generateUnsubscribeToken(t.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(t.email)}&token=${unsubToken}`
      const html = MELBOURNE_WORKSHOP_PUSH.template(t.name, pricingLink)
        .replace('{{unsubscribe_url}}', unsubscribeUrl)

      await sendEmail({
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
      sent++
    } catch (err) {
      console.error(`[melbourne-warming-push] Failed for ${t.email}:`, err)
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
