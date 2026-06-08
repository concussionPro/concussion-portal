/**
 * POST /api/admin/prospect-mx-verify
 *
 * Free pre-flight email validation using DNS MX-record lookup.
 * Drops prospects whose domain has no mail server configured (dead
 * domain = guaranteed bounce). Stop-gap deliverability scrub while
 * we don't have Hunter credits for full SMTP verification.
 *
 * Limitations (be honest):
 *   - MX-passes ≠ inbox exists. A live domain can still reject the
 *     specific username (e.g. `andrewshaw@alphingtonsportsmed.com.au`
 *     had valid MX but the inbox didn't exist → still bounced).
 *   - We catch the dead-domain subset (~5% in practice) and skip the
 *     bad-username subset (~10% in practice).
 *   - Paid Hunter API needed for the full fix.
 *
 * Decision matrix:
 *   MX records present                → keep (flag `[mx-verified=ok]`)
 *   MX lookup returns NODATA / NXDOMAIN → status='archived'
 *                                       (flag `[mx-verified=nomx]`)
 *   MX lookup returns DNS error / timeout → keep + flag (retry next pass)
 *
 * Audit trail in notes field with `[mx-verified=...]` tag makes
 * the pass idempotent — re-runs skip already-checked prospects unless
 * ?reverify=true.
 *
 * Body: {
 *   dryRun?: boolean (default true)
 *   limit?: number (default 100, max 500)
 *   reverify?: boolean (default false)
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import dns from 'node:dns/promises'

export const runtime = 'nodejs'
export const maxDuration = 300

async function checkMx(domain: string): Promise<{
  result: 'ok' | 'nomx' | 'error'
  detail?: string
}> {
  try {
    const records = await dns.resolveMx(domain)
    if (!records || records.length === 0) {
      return { result: 'nomx', detail: 'no MX records' }
    }
    return { result: 'ok' }
  } catch (e) {
    const code = (e as { code?: string })?.code
    // ENOTFOUND / ENODATA = domain has no MX → dead
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      return { result: 'nomx', detail: code }
    }
    // SERVFAIL / TIMEOUT etc → transient, don't penalise
    return { result: 'error', detail: code || (e as Error).message }
  }
}

function domainOf(email: string): string | null {
  const at = email.indexOf('@')
  if (at < 0) return null
  return email.slice(at + 1).toLowerCase().trim()
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { dryRun?: boolean; limit?: number; reverify?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false
  const limit = Math.max(1, Math.min(body.limit ?? 100, 500))
  const reverify = body.reverify === true

  const { rows: targets } = await sql<{
    id: number
    short_name: string
    contact_email: string
  }>`
    SELECT id, short_name, contact_email
    FROM prospect_clinics
    WHERE status IN ('researching', 'approved')
      AND contact_email IS NOT NULL
      AND contact_email LIKE '%@%'
      AND (${reverify} = TRUE OR COALESCE(notes, '') NOT LIKE '%[mx-verified=%')
    ORDER BY id
    LIMIT ${limit}
  `

  // Group by domain so we only resolve each domain once
  const byDomain = new Map<string, typeof targets>()
  for (const t of targets) {
    const d = domainOf(t.contact_email)
    if (!d) continue
    if (!byDomain.has(d)) byDomain.set(d, [])
    byDomain.get(d)!.push(t)
  }

  type Decision =
    | 'kept'
    | 'archived-by-mx'
    | 'kept-flagged'
    | 'dry-kept'
    | 'dry-archive'
    | 'dry-flag'
  const results: Array<{
    id: number
    email: string
    shortName: string
    domain: string
    mx: 'ok' | 'nomx' | 'error'
    decision: Decision
    mxDetail?: string
  }> = []

  for (const [domain, prospects] of byDomain) {
    const r = await checkMx(domain)
    for (const t of prospects) {
      let decision: Decision
      if (r.result === 'nomx') {
        decision = dryRun ? 'dry-archive' : 'archived-by-mx'
        if (!dryRun) {
          await sql`
            UPDATE prospect_clinics
            SET status = 'archived',
                notes = COALESCE(notes, '') || E'\n' || ${`[mx-verified=nomx/${r.detail || 'none'}/${new Date().toISOString().slice(0, 10)}]`} || ' auto-archived: domain has no mail server'
            WHERE id = ${t.id}
          `
        }
      } else if (r.result === 'error') {
        decision = dryRun ? 'dry-flag' : 'kept-flagged'
        if (!dryRun) {
          await sql`
            UPDATE prospect_clinics
            SET notes = COALESCE(notes, '') || E'\n' || ${`[mx-verified=error/${r.detail || 'unk'}/${new Date().toISOString().slice(0, 10)}]`}
            WHERE id = ${t.id}
          `
        }
      } else {
        decision = dryRun ? 'dry-kept' : 'kept'
        if (!dryRun) {
          await sql`
            UPDATE prospect_clinics
            SET notes = COALESCE(notes, '') || E'\n' || ${`[mx-verified=ok/${new Date().toISOString().slice(0, 10)}]`}
            WHERE id = ${t.id}
          `
        }
      }
      results.push({
        id: t.id,
        email: t.contact_email,
        shortName: t.short_name,
        domain,
        mx: r.result,
        decision,
        mxDetail: r.detail,
      })
    }
  }

  const summary = {
    mode: dryRun ? 'dry-run' : 'applied',
    examined: results.length,
    uniqueDomains: byDomain.size,
    kept: results.filter((r) => r.decision === 'kept' || r.decision === 'dry-kept').length,
    archivedByMx: results.filter((r) => r.decision === 'archived-by-mx' || r.decision === 'dry-archive').length,
    keptFlaggedTransient: results.filter((r) => r.decision === 'kept-flagged' || r.decision === 'dry-flag').length,
    cost: '$0 — DNS lookups only',
  }

  return NextResponse.json({
    summary,
    results: results.slice(0, 100),
    truncated: results.length > 100,
  })
}
