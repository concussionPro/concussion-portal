/**
 * Cron: Completer Conversion (behaviour-triggered, agent B)
 *
 * Free-course completers (all 3 SCAT modules, still access_level='preview')
 * who didn't convert get ONE targeted conversion email, chosen by what they
 * DID — never by the survey answer (the survey promises no automated
 * sequence, so we branch off behaviour instead):
 *
 *   workshop-interest registered   → COMPLETER_CONVERT_WORKSHOP
 *   viewed pricing / checkout_start → COMPLETER_CONVERT_PRICE
 *   neither                         → COMPLETER_CONVERT_RELEVANCE
 *
 * Guardrails:
 *  - preview only, respects nurture_unsubscribed
 *  - fires ≥18 days after signup, so it lands AFTER the day-0 completion
 *    upsell and the ~14-day personal follow-up (no collision)
 *  - one email per user ever (email_audit_log key completer_convert_*_<id>)
 *  - international viewers are routed to relevance (the $50 code is a
 *    domestic offer — don't imply a discount that doesn't apply)
 *  - per-run send cap
 *
 * Auth:
 *  - Vercel cron / scripts: Bearer CRON_SECRET → live send
 *  - Admin (cookie / x-admin-key): defaults to dry-run; add ?send=1 to send
 *
 * Configured in vercel.json.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { sendEmail } from '@/lib/resend-client'
import { isAdminRequest } from '@/lib/require-admin'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import {
  COMPLETER_CONVERT_PRICE,
  COMPLETER_CONVERT_RELEVANCE,
  COMPLETER_CONVERT_WORKSHOP,
} from '@/lib/email-sequences'

export const maxDuration = 60

const SEND_CAP = 40
const MIN_AGE_DAYS = 18

// Excluded from this sequence — leads already on a separate bespoke track.
// Micah is on the Purpose EP pitch (/p/purpose-healthcare); don't double-touch.
const EXCLUDED_EMAILS = new Set(['micah@purposehealthcare.com.au'])

type Branch = 'workshop' | 'price' | 'relevance'
const BRANCH = {
  workshop: { seq: COMPLETER_CONVERT_WORKSHOP, tag: 'completer_convert_workshop' },
  price: { seq: COMPLETER_CONVERT_PRICE, tag: 'completer_convert_price' },
  relevance: { seq: COMPLETER_CONVERT_RELEVANCE, tag: 'completer_convert_relevance' },
} as const

function bearerValid(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization')
  const expected = `Bearer ${secret}`
  if (!header || header.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected))
}

type Target = { id: string; email: string; name: string; branch: Branch }

/** Completers still on preview, past the min-age window, not unsubscribed,
 *  and never yet sent a completer_convert branch. */
async function findTargets(): Promise<Target[]> {
  const { rows } = await sql`
    SELECT u.id, u.email, u.name, up.progress
    FROM users u
    JOIN user_progress up ON up.user_id = u.id
    WHERE u.access_level = 'preview'
      AND COALESCE(u.nurture_unsubscribed, false) = false
      AND NOT EXISTS (SELECT 1 FROM email_suppression es WHERE LOWER(es.email) = LOWER(u.email))
      AND u.created_at <= NOW() - (${MIN_AGE_DAYS} || ' days')::interval
      AND NOT EXISTS (
        SELECT 1 FROM email_audit_log l
        WHERE l.audit_key = 'completer_convert_price_' || u.id
           OR l.audit_key = 'completer_convert_relevance_' || u.id
           OR l.audit_key = 'completer_convert_workshop_' || u.id
      )
  `
  const targets: Target[] = []
  for (const r of rows as any[]) {
    // Completed all 3 SCAT modules
    let scat = 0
    if (r.progress) for (const m of [101, 102, 103]) if (r.progress[String(m)]?.completed) scat++
    if (scat !== 3) continue

    const email: string = r.email
    if (EXCLUDED_EMAILS.has(email.toLowerCase())) continue
    const branch = await classify(email)
    targets.push({ id: r.id, email, name: r.name || 'there', branch })
  }
  return targets
}

/** Behaviour classifier — priority: workshop-interest > pricing-view > relevance.
 *  International pricing viewers fall through to relevance (no domestic-only
 *  discount claim). */
async function classify(email: string): Promise<Branch> {
  const { rows: wi } = await sql`
    SELECT 1 FROM workshop_interest WHERE LOWER(email) = LOWER(${email}) LIMIT 1
  `
  if (wi.length) return 'workshop'

  const { rows: pv } = await sql`
    SELECT
      BOOL_OR(event_type IN ('pricing_page', 'pricing_cards_in_view', 'checkout_start')
              OR (event_type IN ('page_view', 'pageview') AND path ILIKE '%/pricing%')) AS domestic,
      BOOL_OR(event_type = 'international_pricing_view' OR path ILIKE '%pricing-international%') AS intl
    FROM analytics_events
    WHERE LOWER(user_email) = LOWER(${email})
  `
  const row = pv[0] as { domestic: boolean | null; intl: boolean | null } | undefined
  // Domestic pricing intent (and not purely international) → price branch
  if (row?.domestic && !row?.intl) return 'price'
  return 'relevance'
}

async function handle(request: NextRequest, live: boolean) {
  const targets = await findTargets()

  if (!live) {
    const byBranch = targets.reduce((a, t) => ((a[t.branch] = (a[t.branch] || 0) + 1), a), {} as Record<string, number>)
    return NextResponse.json({
      dryRun: true,
      found: targets.length,
      byBranch,
      targets: targets.slice(0, 100).map((t) => ({ email: t.email, name: t.name, branch: t.branch })),
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const pricingLink = `${baseUrl}/pricing`
  let sent = 0, skipped = 0, errors = 0
  const sends = targets.slice(0, SEND_CAP)

  for (const t of sends) {
    const { seq, tag } = BRANCH[t.branch]
    const auditKey = `${tag}_${t.id}`
    // Atomic dedup — also blocks any OTHER branch from firing later, since
    // findTargets excludes anyone with any completer_convert_* key.
    const { rowCount: inserted } = await sql`
      INSERT INTO email_audit_log (audit_key, sent_at)
      VALUES (${auditKey}, NOW())
      ON CONFLICT (audit_key) DO NOTHING
    `
    if (!inserted) { skipped++; continue }

    // sendEmail returns false on failure — it never throws — so honour the
    // boolean and roll the audit-key claim back on ANY failure (ported from
    // send-nurture-emails' sendOrRollbackAudit, 2026-07-02). Without the
    // rollback a failed send permanently burned this user's ONE conversion
    // email: findTargets excludes anyone with a completer_convert_* key.
    let ok = false
    try {
      const unsubToken = generateUnsubscribeToken(t.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(t.email)}&token=${unsubToken}`
      const html = seq.template(t.name, pricingLink).replace('{{unsubscribe_url}}', unsubscribeUrl)
      ok = await sendEmail({
        to: t.email,
        subject: seq.subject,
        html,
        tags: [
          { name: 'sequence', value: 'completer-conversion' },
          { name: 'branch', value: t.branch },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
    } catch (err) {
      console.error(`[completer-conversion] Send threw for ${t.email.slice(0, 3)}***:`, err)
    }

    if (ok) {
      sent++
    } else {
      errors++
      console.error(`[completer-conversion] Send failed for ${t.email.slice(0, 3)}*** — rolling back audit key so next run retries`)
      try {
        await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`
      } catch (rollbackErr) {
        console.error(`[completer-conversion] Failed to roll back audit key ${auditKey}:`, rollbackErr)
      }
    }
  }

  return NextResponse.json({ ok: true, found: targets.length, sent, skipped, errors, capped: targets.length > SEND_CAP })
}

export async function GET(request: NextRequest) {
  if (bearerValid(request)) return handle(request, true)
  if (isAdminRequest(request)) {
    const send = new URL(request.url).searchParams.get('send') === '1'
    return handle(request, send)
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
