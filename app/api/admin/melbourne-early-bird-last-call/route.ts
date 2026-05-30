/**
 * Melbourne CCM workshop — early-bird-closes-tomorrow last call blast.
 *
 * Audience:
 *   - access_level IN ('preview', 'online-only') — anyone NOT already paid full-course
 *   - nurture_unsubscribed != true
 *   - created within last 180 days (filter long-dormant)
 *   - opened OR clicked any CEA-project email in last 60 days
 *   - NOT already enrolled at Melbourne workshop (full-course + workshop_location='melbourne')
 *
 * GET ?dryRun=1 (default)             → preview audience, no sends
 * POST ?confirm=mel-eb-last-call-2026-05-30 → actually fires
 *
 * Idempotent via email_audit_log key `melbourne_eb_last_call_v1_${userId}`.
 * Rolls back audit key on send failure for retry.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail } from '@/lib/resend-client'
import { isAdminRequest } from '@/lib/require-admin'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { MELBOURNE_EARLY_BIRD_LAST_CALL } from '@/lib/email-sequences'
import { EmailScheduler } from '@/lib/email-scheduler'

export const maxDuration = 60

const CONFIRM_FLAG = 'mel-eb-last-call-2026-05-30'

interface Target {
  id: string
  email: string
  name: string
  accessLevel: string
  opens60d: number
  clicks60d: number
  daysSinceLastEvent: number
}

async function findTargets(): Promise<Target[]> {
  const { rows } = await sql<{
    id: string
    email: string
    name: string | null
    access_level: string
    opens_60d: string
    clicks_60d: string
    days_since_last_event: string
  }>`
    WITH engaged AS (
      SELECT LOWER(recipient) AS email,
        COUNT(*) FILTER (WHERE event_type = 'opened')  AS opens_60d,
        COUNT(*) FILTER (WHERE event_type = 'clicked') AS clicks_60d,
        EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 86400 AS days_since_last_event
      FROM email_events
      WHERE created_at >= NOW() - INTERVAL '60 days'
        AND project = 'cea'  -- strict: excludes BWS (Byron Web Studio) + 'other' + null/unbackfilled
        AND event_type IN ('opened', 'clicked')
      GROUP BY LOWER(recipient)
    )
    SELECT u.id, u.email, u.name, u.access_level,
      COALESCE(e.opens_60d, 0)::text  AS opens_60d,
      COALESCE(e.clicks_60d, 0)::text AS clicks_60d,
      COALESCE(e.days_since_last_event, 999)::text AS days_since_last_event
    FROM users u
    LEFT JOIN engaged e ON e.email = LOWER(u.email)
    WHERE u.access_level IN ('preview', 'online-only')
      AND COALESCE(u.nurture_unsubscribed, false) = false
      AND u.created_at > NOW() - INTERVAL '180 days'
      AND (COALESCE(e.opens_60d, 0) > 0 OR COALESCE(e.clicks_60d, 0) > 0)
      AND NOT EXISTS (
        SELECT 1 FROM users u2
        WHERE LOWER(u2.email) = LOWER(u.email)
          AND u2.access_level = 'full-course'
          AND u2.workshop_location = 'melbourne'
      )
    ORDER BY (COALESCE(e.clicks_60d, 0) * 3 + COALESCE(e.opens_60d, 0)) DESC
  `

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name || 'there',
    accessLevel: r.access_level,
    opens60d: parseInt(r.opens_60d, 10),
    clicks60d: parseInt(r.clicks_60d, 10),
    daysSinceLastEvent: Math.round(parseFloat(r.days_since_last_event)),
  }))
}

async function handle(request: NextRequest, allowSend: boolean) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const confirm = searchParams.get('confirm')
  const willSend = allowSend && confirm === CONFIRM_FLAG

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const pricingLink = `${baseUrl}/pricing`
  const targets = await findTargets()

  if (!willSend) {
    return NextResponse.json({
      dryRun: true,
      count: targets.length,
      subject: MELBOURNE_EARLY_BIRD_LAST_CALL.subject,
      pricingLink,
      confirmFlagRequired: CONFIRM_FLAG,
      audience: targets.map((t) => ({
        email: t.email,
        name: t.name,
        accessLevel: t.accessLevel,
        opens60d: t.opens60d,
        clicks60d: t.clicks60d,
        daysSinceLastEvent: t.daysSinceLastEvent,
      })),
    })
  }

  const scheduler = new EmailScheduler()
  let sent = 0
  let skipped = 0
  let failed = 0
  const failures: Array<{ email: string; reason: string }> = []

  for (const t of targets) {
    const auditKey = `melbourne_eb_last_call_v1_${t.id}`
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
      const html = MELBOURNE_EARLY_BIRD_LAST_CALL.template(t.name, pricingLink).replace(
        '{{unsubscribe_url}}',
        unsubscribeUrl
      )

      ok = await sendEmail({
        to: t.email,
        scheduledAt: scheduler.next(t.email),
        subject: MELBOURNE_EARLY_BIRD_LAST_CALL.subject,
        html,
        tags: [
          { name: 'sequence', value: 'melbourne-eb-last-call' },
          { name: 'variant', value: 'v1' },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
    } catch (err) {
      failed++
      failures.push({ email: t.email, reason: err instanceof Error ? err.message : String(err) })
      await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`
      continue
    }

    if (ok) {
      sent++
    } else {
      failed++
      failures.push({ email: t.email, reason: 'sendEmail returned false (see Vercel logs)' })
      await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`
    }
  }

  return NextResponse.json({
    ok: true,
    found: targets.length,
    sent,
    skipped,
    failed,
    failures,
  })
}

export async function GET(request: NextRequest) {
  return handle(request, false)
}

export async function POST(request: NextRequest) {
  return handle(request, true)
}
