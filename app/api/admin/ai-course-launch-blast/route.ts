/**
 * AI Course Launch Blast — targets engaged portal users with the
 * launch-week 50% discount on AI in Clinical Practice.
 *
 * Audience:
 *  - access_level IN ('preview', 'online-only')
 *  - nurture_unsubscribed = false (or null)
 *  - created within last 120 days
 *  - has at least one opened or clicked email in the last 60 days
 *    (project = 'cea' only)
 *  - does NOT own the AI course (course_purchases)
 *
 * NOTE (bug fixed 2026-08-05): the ownership exclusion joined
 * `LOWER(cp.email)`, but the column is `user_email` (lib/course-purchases.ts) —
 * so it 42703'd / never applied and existing owners stayed in the audience.
 *
 * GET ?dryRun=1  → preview audience, no sends (default)
 * POST           → preview audience, no sends (default — same as GET)
 * POST ?confirm=ai-course-launch-2026-06-17  → actually fires
 *
 * Idempotent via email_audit_log key `ai_course_launch_v1_${userId}`.
 * Hard-coded confirm flag prevents accidental fire — must be updated
 * in code if launch slips.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail } from '@/lib/resend-client'
import { isAdminRequest } from '@/lib/require-admin'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { AI_COURSE_LAUNCH_BLAST } from '@/lib/email-sequences'
import { EmailScheduler } from '@/lib/email-scheduler'

export const maxDuration = 60

const CONFIRM_FLAG = 'ai-course-launch-2026-06-17'

interface Target {
  id: string
  email: string
  name: string
  accessLevel: string
  opens60d: number
  clicks60d: number
}

async function findTargets(): Promise<Target[]> {
  const { rows } = await sql<{
    id: string
    email: string
    name: string | null
    access_level: string
    opens_60d: string
    clicks_60d: string
  }>`
    WITH engaged AS (
      SELECT LOWER(recipient) AS email,
        COUNT(*) FILTER (WHERE event_type = 'opened')  AS opens_60d,
        COUNT(*) FILTER (WHERE event_type = 'clicked') AS clicks_60d
      FROM email_events
      WHERE created_at >= NOW() - INTERVAL '60 days'
        AND COALESCE(project, 'cea') = 'cea'
        AND event_type IN ('opened', 'clicked')
      GROUP BY LOWER(recipient)
    )
    SELECT u.id, u.email, u.name, u.access_level,
      COALESCE(e.opens_60d, 0)::text  AS opens_60d,
      COALESCE(e.clicks_60d, 0)::text AS clicks_60d
    FROM users u
    LEFT JOIN engaged e ON e.email = LOWER(u.email)
    WHERE u.access_level IN ('preview', 'online-only')
      AND COALESCE(u.nurture_unsubscribed, false) = false
      AND COALESCE(u.is_test, false) = false
      -- Master blacklist. nurture_unsubscribed alone MISSES hard bounces,
      -- complaints, STOP replies and cold-prospect unsubs (lib/email-suppression.ts).
      -- The query throwing is the fail-closed path — nothing sends.
      AND NOT EXISTS (
        SELECT 1 FROM email_suppression es WHERE LOWER(es.email) = LOWER(u.email)
      )
      AND u.created_at > NOW() - INTERVAL '120 days'
      AND (COALESCE(e.opens_60d, 0) > 0 OR COALESCE(e.clicks_60d, 0) > 0)
      AND NOT EXISTS (
        SELECT 1 FROM course_purchases cp
        WHERE LOWER(cp.user_email) = LOWER(u.email)
          AND cp.course_slug = 'ai-in-clinical-practice'
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
  const courseLink = `${baseUrl}/courses/ai-in-clinical-practice`
  const targets = await findTargets()

  if (!willSend) {
    return NextResponse.json({
      dryRun: true,
      count: targets.length,
      subject: AI_COURSE_LAUNCH_BLAST.subject,
      courseLink,
      confirmFlagRequired: CONFIRM_FLAG,
      sample: targets.slice(0, 20).map((t) => ({
        email: t.email,
        name: t.name,
        accessLevel: t.accessLevel,
        opens60d: t.opens60d,
        clicks60d: t.clicks60d,
      })),
    })
  }

  const scheduler = new EmailScheduler()
  let sent = 0
  let skipped = 0
  let failed = 0
  const failures: Array<{ email: string; reason: string }> = []

  for (const t of targets) {
    const auditKey = `ai_course_launch_v1_${t.id}`
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
      const html = AI_COURSE_LAUNCH_BLAST.template(t.name, courseLink).replace(
        '{{unsubscribe_url}}',
        unsubscribeUrl
      )

      ok = await sendEmail({
        to: t.email,
        scheduledAt: scheduler.next(t.email),
        subject: AI_COURSE_LAUNCH_BLAST.subject,
        html,
        tags: [
          { name: 'sequence', value: 'ai-course-launch' },
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
