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

/** Thrown when Hunter is out of credits or rate-limited (HTTP 429 or a
 *  credit/usage error in the body). Callers should STOP the batch — there's
 *  no point hammering a maxed-out API — and surface it so a daily max-out is
 *  visible instead of silently stalling verification. */
export class HunterRateLimitError extends Error {
  constructor(detail: string) {
    super(detail)
    this.name = 'HunterRateLimitError'
  }
}

async function verifyOne(email: string, key: string): Promise<HunterVerifierResponse> {
  const url = `${HUNTER_BASE}/email-verifier?email=${encodeURIComponent(email)}&api_key=${key}`
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  // 429 = rate-limited / out of credits — the "maxing out per day" case.
  if (res.status === 429) {
    throw new HunterRateLimitError(`Hunter HTTP 429 (rate-limited / out of credits) for ${email.slice(0, 3)}***`)
  }
  const json = (await res.json()) as HunterVerifierResponse
  // Hunter also returns credit/usage exhaustion as a 200 with an errors array.
  const creditErr = json.errors?.find(
    (e) => e.code === 429 || /credit|too many requests|rate limit|usage|quota/i.test(e.details || ''),
  )
  if (creditErr) {
    throw new HunterRateLimitError(creditErr.details || `Hunter credit error code ${creditErr.code}`)
  }
  return json
}

export interface AutoVerifyResult {
  examined: number
  kept: number
  bounced: number
  apiErrors: number
  /** True when Hunter returned 429 / credit-exhaustion — i.e. maxed out for
   *  the day. Surfaced so the dashboard/monitoring can show it instead of the
   *  pass silently stalling. */
  creditExhausted: boolean
  /** Unverified active prospects still waiting for Hunter's algo after this run. */
  remaining: number
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
  const out: AutoVerifyResult = { examined: 0, kept: 0, bounced: 0, apiErrors: 0, creditExhausted: false, remaining: 0, skipped: null }
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
        // Credit exhaustion / rate-limit (the "maxing out" case): stop the
        // whole batch — no point burning the cron on a maxed API — and flag it.
        if (err instanceof HunterRateLimitError) {
          out.creditExhausted = true
          console.error('[hunter verify] credit/rate-limit hit — stopping batch:', err.message)
          break
        }
        out.apiErrors += 1
        console.error(`[hunter verify] API error for prospect ${t.id}:`, err)
        continue
      }
      out.examined += 1
      await applyVerification(t.id, t.contact_email, hunterData, out)
      // Tiny pause between Hunter calls to be a good API citizen
      await new Promise((r) => setTimeout(r, 80))
    }
  } catch (err) {
    // Never let verification kill the send run.
    out.skipped = err instanceof Error ? err.message : String(err)
    console.error('[hunter auto-verify] pass failed:', err)
  }

  out.remaining = await countUnverifiedActive()
  return out
}

/** Unverified, active (non-terminal) prospects still waiting on Hunter's algo. */
async function countUnverifiedActive(): Promise<number> {
  try {
    const { rows } = await sql<{ n: number }>`
      SELECT COUNT(*)::int AS n FROM prospect_clinics
      WHERE verification_score IS NULL
        AND status NOT IN ('archived', 'lost', 'bounced', 'engaged', 'won', 'engaged-elsewhere', 'replied')
        AND contact_email LIKE '%@%'
    `
    return rows[0]?.n ?? 0
  } catch {
    return 0
  }
}

/**
 * Drain the PENDING-APPROVAL backlog: every unverified active prospect, NOT
 * just those scheduled within 3 days. This is the dedicated verification pass
 * (its own cron) so the whole researching pool gets parsed by Hunter's algo
 * and becomes auto-promotable — independent of the send cron's just-in-time
 * pass. Stops immediately on credit exhaustion and reports it. Never throws.
 */
export async function verifyPendingApprovals(
  limit = 120,
  timeBudgetMs = 240000,
): Promise<AutoVerifyResult> {
  const out: AutoVerifyResult = { examined: 0, kept: 0, bounced: 0, apiErrors: 0, creditExhausted: false, remaining: 0, skipped: null }
  const key = process.env.HUNTER_API_KEY
  if (!key) {
    out.skipped = 'HUNTER_API_KEY not set'
    out.remaining = await countUnverifiedActive()
    return out
  }

  const started = Date.now()
  try {
    // Soonest-scheduled first (they're up next), then the rest of the pool.
    const { rows: targets } = await sql<{ id: number; contact_email: string }>`
      SELECT id, contact_email
      FROM prospect_clinics
      WHERE verification_score IS NULL
        AND status NOT IN ('archived', 'lost', 'bounced', 'engaged', 'won', 'engaged-elsewhere', 'replied')
        AND contact_email LIKE '%@%'
        AND contact_email NOT LIKE 'info@%'
        AND contact_email NOT LIKE 'admin@%'
        AND contact_email NOT LIKE 'reception@%'
      ORDER BY scheduled_send_at ASC NULLS LAST, id
      LIMIT ${limit}
    `

    for (const t of targets) {
      if (Date.now() - started > timeBudgetMs) break
      let hunterData: HunterVerifierResponse | null = null
      try {
        hunterData = await verifyOne(t.contact_email, key)
      } catch (err) {
        if (err instanceof HunterRateLimitError) {
          out.creditExhausted = true
          console.error('[hunter verify-pending] credit/rate-limit hit — stopping batch:', err.message)
          break
        }
        out.apiErrors += 1
        console.error(`[hunter verify-pending] API error for prospect ${t.id}:`, err)
        continue
      }
      out.examined += 1
      await applyVerification(t.id, t.contact_email, hunterData, out)
      await new Promise((r) => setTimeout(r, 80))
    }
  } catch (err) {
    out.skipped = err instanceof Error ? err.message : String(err)
    console.error('[hunter verify-pending] pass failed:', err)
  }

  out.remaining = await countUnverifiedActive()
  return out
}

/** Persist a Hunter verdict to a prospect row (shared by both passes). */
async function applyVerification(
  id: number,
  email: string,
  hunterData: HunterVerifierResponse | null,
  out: AutoVerifyResult,
): Promise<void> {
  const d = hunterData?.data
  const result = d?.result || 'unknown'
  const status = d?.status || 'unknown'
  const score = d?.score ?? 0
  const isAcceptAll = !!d?.accept_all || status === 'accept_all'
  const isWebmail = !!d?.webmail || status === 'webmail'
  const isDisposable = !!d?.disposable || status === 'disposable'
  const localPart = (email.split('@')[0] || '').toLowerCase()
  const isRoleByPattern = ROLE_PREFIXES.includes(localPart)
  const noteTag = `[hunter-verified=${result}/${status}/${score}/${new Date().toISOString().slice(0, 10)}]`
  const isBounce = result === 'undeliverable' || status === 'invalid' || isDisposable

  if (isBounce) {
    out.bounced += 1
    await sql`
      UPDATE prospect_clinics
      SET status = 'bounced',
          notes = COALESCE(notes, '') || E'\n' || ${noteTag} || ' auto-quarantined: Hunter says ' || ${result},
          verification_status = ${status}, verification_result = ${result}, verification_score = ${score},
          verification_role = ${isRoleByPattern}, verification_accept_all = ${isAcceptAll},
          verification_webmail = ${isWebmail}, verification_disposable = ${isDisposable}, last_verified_at = NOW()
      WHERE id = ${id}
    `
  } else {
    out.kept += 1
    await sql`
      UPDATE prospect_clinics
      SET notes = COALESCE(notes, '') || E'\n' || ${noteTag},
          verification_status = ${status}, verification_result = ${result}, verification_score = ${score},
          verification_role = ${isRoleByPattern}, verification_accept_all = ${isAcceptAll},
          verification_webmail = ${isWebmail}, verification_disposable = ${isDisposable}, last_verified_at = NOW()
      WHERE id = ${id}
    `
  }
}
