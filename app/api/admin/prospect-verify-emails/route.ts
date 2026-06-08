/**
 * POST /api/admin/prospect-verify-emails
 *
 * Hunter.io email-verifier pass on queued prospects to drop bounces
 * BEFORE the cold cron fires them. Stops the adaptive cap from auto-
 * throttling every time Apollo-pattern-guess emails get sent into
 * non-existent mailboxes.
 *
 * Why this exists separately from prospect-hunter-enrich:
 *   - hunter-enrich: takes a generic mailbox (info@/admin@) and finds a
 *     senior named contact instead.
 *   - verify-emails (this): takes a direct named email and asks Hunter
 *     "does this inbox actually deliver?". Catches the
 *     andrewshaw@alphingtonsportsmed.com.au pattern-guess bounces
 *     that look legit on the surface.
 *
 * Hunter result mapping:
 *   deliverable                    → keep (verified=true)
 *   undeliverable                  → status='bounced' (cron skip)
 *   risky AND result='accept_all'  → keep but flag — accept-all domains
 *                                    are higher risk but not auto-fail
 *   risky AND result='disposable'  → status='bounced'
 *   risky AND result='webmail'     → keep (it's a person's gmail/etc)
 *   unknown                        → keep, retry on next pass
 *
 * Notes-field audit trail with [hunter-verified=...] tag for
 * idempotency (default mode skips already-verified prospects).
 *
 * Body: {
 *   dryRun?: boolean (default true)
 *   limit?: number (default 50, max 200) — Hunter credits cost real $
 *   reverify?: boolean (default false) — re-check already-verified
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

export const maxDuration = 300

const HUNTER_BASE = 'https://api.hunter.io/v2'

interface HunterVerifierResponse {
  data?: {
    status?: 'valid' | 'invalid' | 'accept_all' | 'webmail' | 'disposable' | 'unknown'
    result?: 'deliverable' | 'undeliverable' | 'risky' | 'unknown'
    score?: number
    email?: string
    regexp?: boolean
    gibberish?: boolean
    disposable?: boolean
    webmail?: boolean
    mx_records?: boolean
    smtp_server?: boolean
    smtp_check?: boolean
    accept_all?: boolean
    block?: boolean
  }
  meta?: { params?: object }
  errors?: Array<{ id?: string; code?: number; details?: string }>
}

async function verifyOne(email: string, key: string): Promise<HunterVerifierResponse> {
  const url = `${HUNTER_BASE}/email-verifier?email=${encodeURIComponent(email)}&api_key=${key}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  return res.json() as Promise<HunterVerifierResponse>
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const key = process.env.HUNTER_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'HUNTER_API_KEY env var not set in production' },
      { status: 500 },
    )
  }

  let body: { dryRun?: boolean; limit?: number; reverify?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false
  const limit = Math.max(1, Math.min(body.limit ?? 50, 200))
  const reverify = body.reverify === true

  // Pick the next batch — queued prospects that haven't been Hunter-verified yet.
  // Skip generic mailboxes (different endpoint handles those).
  // Skip already-bounced status.
  const { rows: targets } = await sql<{
    id: number
    short_name: string
    contact_email: string
    contact_first_name: string
    scheduled_send_at: string | null
  }>`
    SELECT id, short_name, contact_email, contact_first_name, scheduled_send_at
    FROM prospect_clinics
    WHERE status IN ('researching', 'approved')
      AND contact_email IS NOT NULL
      AND contact_email LIKE '%@%'
      AND contact_email NOT LIKE 'info@%'
      AND contact_email NOT LIKE 'admin@%'
      AND contact_email NOT LIKE 'reception@%'
      AND contact_email NOT LIKE 'enquiries@%'
      AND contact_email NOT LIKE 'office@%'
      AND ${reverify} = TRUE OR COALESCE(notes, '') NOT LIKE '%[hunter-verified=%'
    ORDER BY
      -- Prioritise the prospects scheduled soonest
      CASE WHEN scheduled_send_at IS NULL THEN '9999-12-31'::timestamptz ELSE scheduled_send_at END,
      id
    LIMIT ${limit}
  `

  const results: Array<{
    id: number
    email: string
    shortName: string
    decision: 'kept' | 'kept-flagged' | 'bounced-by-hunter' | 'api-error' | 'dry-kept' | 'dry-flagged' | 'dry-bounce'
    hunterResult?: string
    hunterStatus?: string
    hunterScore?: number
    note?: string
  }> = []

  for (const t of targets) {
    let hunterData: HunterVerifierResponse | null = null
    try {
      hunterData = await verifyOne(t.contact_email, key)
    } catch (e) {
      results.push({
        id: t.id,
        email: t.contact_email,
        shortName: t.short_name,
        decision: 'api-error',
        note: e instanceof Error ? e.message : String(e),
      })
      continue
    }

    const d = hunterData?.data
    const result = d?.result || 'unknown'
    const status = d?.status || 'unknown'
    const score = d?.score ?? 0

    // Decision matrix
    let decision: typeof results[number]['decision']
    let newProspectStatus: 'bounced' | undefined
    if (result === 'undeliverable' || status === 'invalid' || status === 'disposable') {
      decision = dryRun ? 'dry-bounce' : 'bounced-by-hunter'
      newProspectStatus = dryRun ? undefined : 'bounced'
    } else if (status === 'accept_all' || result === 'risky') {
      // Accept-all domains: keep but flag; they're higher bounce risk
      decision = dryRun ? 'dry-flagged' : 'kept-flagged'
    } else {
      // deliverable / webmail / valid / unknown — keep
      decision = dryRun ? 'dry-kept' : 'kept'
    }

    const noteTag = `[hunter-verified=${result}/${status}/${score}/${new Date().toISOString().slice(0, 10)}]`

    if (!dryRun) {
      if (newProspectStatus) {
        await sql`
          UPDATE prospect_clinics
          SET status = ${newProspectStatus},
              notes = COALESCE(notes, '') || E'\n' || ${noteTag} || ' auto-quarantined: Hunter says ' || ${result}
          WHERE id = ${t.id}
        `
      } else {
        await sql`
          UPDATE prospect_clinics
          SET notes = COALESCE(notes, '') || E'\n' || ${noteTag}
          WHERE id = ${t.id}
        `
      }
    }

    results.push({
      id: t.id,
      email: t.contact_email,
      shortName: t.short_name,
      decision,
      hunterResult: result,
      hunterStatus: status,
      hunterScore: score,
    })

    // Tiny pause between Hunter calls to be a good API citizen
    await new Promise((r) => setTimeout(r, 80))
  }

  const summary = {
    mode: dryRun ? 'dry-run' : 'applied',
    examined: results.length,
    kept: results.filter((r) => r.decision === 'kept' || r.decision === 'dry-kept').length,
    keptFlagged: results.filter((r) => r.decision === 'kept-flagged' || r.decision === 'dry-flagged').length,
    bounced: results.filter((r) => r.decision === 'bounced-by-hunter' || r.decision === 'dry-bounce').length,
    apiErrors: results.filter((r) => r.decision === 'api-error').length,
    hunterCreditsConsumed: results.length - results.filter((r) => r.decision === 'api-error').length,
  }

  return NextResponse.json({
    summary,
    results: results.slice(0, 60),
    truncated: results.length > 60,
  })
}
