/**
 * Hunter.io email verification — shared by the cron auto-verify pass.
 *
 * Mirrors the decision matrix in /api/admin/prospect-verify-emails (the
 * manual batch endpoint) so the two paths can never disagree:
 *
 *   undeliverable / invalid / disposable → status='bounced' (cron skip)
 *   everything else                      → keep, structured columns updated
 *
 * The cron's HARD GATE (verification_score >= 80, non-role, non-accept-all,
 * non-disposable) then decides who actually sends. This module just makes
 * sure due prospects don't sit stranded with verification_score IS NULL —
 * which the gate treats as "never send".
 *
 * Credits cost real money: callers cap lookups per run (cron uses 25) and
 * a time budget stops a slow Hunter API from eating the cron window.
 */
import { sql } from '@/lib/db'

const HUNTER_BASE = 'https://api.hunter.io/v2'

interface HunterVerifierResponse {
  data?: {
    status?: 'valid' | 'invalid' | 'accept_all' | 'webmail' | 'disposable' | 'unknown'
    result?: 'deliverable' | 'undeliverable' | 'risky' | 'unknown'
    score?: number
    disposable?: boolean
    webmail?: boolean
    accept_all?: boolean
  }
  errors?: Array<{ id?: string; code?: number; details?: string }>
}

const ROLE_PREFIXES = ['info', 'admin', 'reception', 'enquiries', 'office', 'contact', 'hello', 'mail', 'team', 'support', 'sales', 'help', 'enquiry', 'bookings', 'appointments']

async function verifyOne(email: string, key: string): Promise<HunterVerifierResponse> {
  const url = `${HUNTER_BASE}/email-verifier?email=${encodeURIComponent(email)}&api_key=${key}`
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  return res.json() as Promise<HunterVerifierResponse>
}

export interface AutoVerifyResult {
  examined: number
  kept: number
  bounced: number
  apiErrors: number
  skipped: string | null
}

/**
 * Verify due/approaching prospects that have never been Hunter-verified
 * (verification_score IS NULL). Capped at `limit` lookups per run plus a
 * wall-clock budget so the cron send pass always gets its turn.
 *
 * Never throws — a verification failure must not block a send run.
 */
export async function autoVerifyDueProspects(
  limit = 25,
  timeBudgetMs = 25000,
): Promise<AutoVerifyResult> {
  const out: AutoVerifyResult = { examined: 0, kept: 0, bounced: 0, apiErrors: 0, skipped: null }
  const key = process.env.HUNTER_API_KEY
  if (!key) {
    out.skipped = 'HUNTER_API_KEY not set'
    return out
  }

  const started = Date.now()
  try {
    const { rows: targets } = await sql<{ id: number; contact_email: string }>`
      SELECT id, contact_email
      FROM prospect_clinics
      WHERE next_template_slug IS NOT NULL
        AND status NOT IN ('archived', 'lost', 'bounced', 'engaged', 'won', 'engaged-elsewhere', 'replied')
        AND scheduled_send_at IS NOT NULL
        AND scheduled_send_at <= NOW() + INTERVAL '3 days'
        AND verification_score IS NULL
        AND contact_email LIKE '%@%'
      ORDER BY scheduled_send_at ASC, id
      LIMIT ${limit}
    `

    for (const t of targets) {
      if (Date.now() - started > timeBudgetMs) break

      let hunterData: HunterVerifierResponse | null = null
      try {
        hunterData = await verifyOne(t.contact_email, key)
      } catch (err) {
        out.apiErrors += 1
        console.error(`[hunter auto-verify] API error for prospect ${t.id}:`, err)
        continue
      }
      out.examined += 1

      const d = hunterData?.data
      const result = d?.result || 'unknown'
      const status = d?.status || 'unknown'
      const score = d?.score ?? 0
      const isAcceptAll = !!d?.accept_all || status === 'accept_all'
      const isWebmail = !!d?.webmail || status === 'webmail'
      const isDisposable = !!d?.disposable || status === 'disposable'
      const localPart = (t.contact_email.split('@')[0] || '').toLowerCase()
      const isRoleByPattern = ROLE_PREFIXES.includes(localPart)

      const noteTag = `[hunter-verified=${result}/${status}/${score}/${new Date().toISOString().slice(0, 10)}]`
      const isBounce = result === 'undeliverable' || status === 'invalid' || isDisposable

      if (isBounce) {
        out.bounced += 1
        await sql`
          UPDATE prospect_clinics
          SET status = 'bounced',
              notes = COALESCE(notes, '') || E'\n' || ${noteTag} || ' auto-quarantined: Hunter says ' || ${result},
              verification_status = ${status},
              verification_result = ${result},
              verification_score = ${score},
              verification_role = ${isRoleByPattern},
              verification_accept_all = ${isAcceptAll},
              verification_webmail = ${isWebmail},
              verification_disposable = ${isDisposable},
              last_verified_at = NOW()
          WHERE id = ${t.id}
        `
      } else {
        out.kept += 1
        await sql`
          UPDATE prospect_clinics
          SET notes = COALESCE(notes, '') || E'\n' || ${noteTag},
              verification_status = ${status},
              verification_result = ${result},
              verification_score = ${score},
              verification_role = ${isRoleByPattern},
              verification_accept_all = ${isAcceptAll},
              verification_webmail = ${isWebmail},
              verification_disposable = ${isDisposable},
              last_verified_at = NOW()
          WHERE id = ${t.id}
        `
      }

      // Tiny pause between Hunter calls to be a good API citizen
      await new Promise((r) => setTimeout(r, 80))
    }
  } catch (err) {
    // Never let verification kill the send run.
    out.skipped = err instanceof Error ? err.message : String(err)
    console.error('[hunter auto-verify] pass failed:', err)
  }

  return out
}
