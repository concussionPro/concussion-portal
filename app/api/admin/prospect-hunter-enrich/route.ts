/**
 * POST /api/admin/prospect-hunter-enrich
 *
 * Hunter.io enrichment for clinics whose contactEmail is still generic
 * (info@/admin@/reception@) after Apollo enrichment ran. Hunter's
 * domain-search returns up to 25 emails per domain with confidence scores
 * and seniority tags — better hit rate than Apollo's free /contacts/search
 * for AU allied-health clinics where Zac hadn't previously emailed them.
 *
 * Same quality bars as the Apollo enricher:
 *  - Strict domain match (Hunter only returns same-domain by default — extra safety)
 *  - Title score ≥ 30 (owner/founder/principal/director/head/manager only)
 *  - Founder boost: surname matches clinic name → score 100
 *  - Confidence ≥ 70 required (Hunter's verified-similar threshold)
 *
 * Updates contact_email + contact_first_name + contact_full_name +
 * contact_role. Original generic mailbox preserved in notes with
 * [hunter-enriched] tag for idempotency.
 *
 * Body: { dryRun?: boolean }  — default true.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

const HUNTER_BASE = 'https://api.hunter.io/v2'

interface HunterEmail {
  value?: string
  type?: string
  confidence?: number
  first_name?: string
  last_name?: string
  position?: string
  seniority?: string
  verification?: { date?: string; status?: string }
}

interface HunterDomainSearchResponse {
  data?: {
    domain?: string
    emails?: HunterEmail[]
  }
}

const GENERIC_MAILBOX_RE = /^(info|admin|reception|office|bookings|enquiries|hello|contact|mail|practice|clinic|enquiry)@/i

function isGenericMailbox(email: string): boolean {
  return GENERIC_MAILBOX_RE.test(email)
}

function extractDomain(email: string): string | null {
  const at = email.indexOf('@')
  if (at < 0) return null
  return email.slice(at + 1).toLowerCase()
}

const TITLE_SCORE: Array<{ pattern: RegExp; score: number; label: string }> = [
  { pattern: /\b(owner|founder|co-founder)\b/i, score: 100, label: 'owner/founder' },
  { pattern: /\bprincipal\b/i, score: 95, label: 'principal' },
  { pattern: /\b(managing director|md|ceo)\b/i, score: 90, label: 'managing director' },
  { pattern: /\bdirector\b/i, score: 80, label: 'director' },
  { pattern: /\bpractice (owner|manager|principal)\b/i, score: 75, label: 'practice manager' },
  { pattern: /\b(clinic|practice) (lead|head)\b/i, score: 70, label: 'clinic lead' },
  { pattern: /\b(head|chief)\b/i, score: 65, label: 'head' },
  { pattern: /\bsenior\b/i, score: 40, label: 'senior' },
  { pattern: /\bmanager\b/i, score: 35, label: 'manager' },
]

const TITLE_BLOCKLIST = /\b(reception|receptionist|admin assistant|intern|student|junior|graduate|in training|trainee)\b/i

function scoreCandidate(e: HunterEmail): { score: number; reason: string } {
  const title = (e.position || '').trim()
  if (!title) {
    // Hunter sometimes only has seniority, not position
    if (e.seniority === 'executive') return { score: 80, reason: 'seniority=executive (no position)' }
    if (e.seniority === 'senior') return { score: 40, reason: 'seniority=senior (no position)' }
    return { score: 0, reason: 'no title or seniority' }
  }
  if (TITLE_BLOCKLIST.test(title)) return { score: -1, reason: `blocked title: ${title}` }
  for (const t of TITLE_SCORE) {
    if (t.pattern.test(title)) return { score: t.score, reason: `matched ${t.label}: ${title}` }
  }
  return { score: 10, reason: `clinical title (unranked): ${title}` }
}

interface ClinicRow {
  id: number
  slug: string
  short_name: string
  contact_email: string
  contact_full_name: string
  contact_first_name: string
  contact_role: string | null
  notes: string | null
  status: string
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const hunterKey = process.env.HUNTER_API_KEY
  if (!hunterKey) {
    return NextResponse.json(
      { error: 'HUNTER_API_KEY env var not set on production deploy' },
      { status: 500 },
    )
  }

  let body: { dryRun?: boolean; limit?: number }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false
  // Per-run cap on Hunter API calls. Free tier = 25 lookups/month;
  // domain-search costs 1 each. Default cap = 25. Drop to e.g. 5 if you
  // want to spread the budget across multiple weeks.
  const callBudget = Math.max(1, Math.min(25, body.limit ?? 25))

  // Only target clinics that:
  //  - Need enriching (generic mailbox) — filtered later
  //  - Haven't been enriched (`[hunter-enriched]` tag)
  //  - Haven't been checked-and-found-empty (`[hunter-checked-empty]` tag)
  //    The empty-check marker prevents re-burning budget on dead-end domains
  //    if the route is run multiple times.
  const { rows: clinics } = await sql<ClinicRow>`
    SELECT id, slug, short_name, contact_email, contact_full_name, contact_first_name,
           contact_role, notes, status
    FROM prospect_clinics
    WHERE status IN ('researching', 'approved')
      AND contact_email IS NOT NULL
      AND COALESCE(notes, '') NOT LIKE '%[hunter-enriched]%'
      AND COALESCE(notes, '') NOT LIKE '%[hunter-checked-empty]%'
  `

  const results: Array<{
    id: number
    shortName: string
    originalEmail: string
    domain: string | null
    decision:
      | 'skipped-not-generic'
      | 'skipped-no-domain'
      | 'no-candidates'
      | 'no-verified-email'
      | 'enriched'
      | 'enriched-dryrun'
      | 'hunter-error'
      | 'hunter-rate-limit'
    bestCandidate?: {
      name: string
      title: string
      email: string
      confidence: number
      score: number
      reason: string
    }
    error?: string
  }> = []

  const MIN_SCORE = 30
  const MIN_CONFIDENCE = 70
  let hunterCallsMade = 0

  for (const c of clinics) {
    if (!isGenericMailbox(c.contact_email)) {
      results.push({
        id: c.id, shortName: c.short_name, originalEmail: c.contact_email,
        domain: null, decision: 'skipped-not-generic',
      })
      continue
    }
    const domain = extractDomain(c.contact_email)
    if (!domain) {
      results.push({
        id: c.id, shortName: c.short_name, originalEmail: c.contact_email,
        domain: null, decision: 'skipped-no-domain',
      })
      continue
    }

    // Budget guard: stop calling Hunter once the per-run cap is reached.
    // Remaining clinics roll over to the next call.
    if (hunterCallsMade >= callBudget) {
      break
    }

    let response: HunterDomainSearchResponse
    try {
      hunterCallsMade += 1
      // Free tier caps domain-search results at 10. Paid tier goes higher.
      const url = `${HUNTER_BASE}/domain-search?domain=${encodeURIComponent(domain)}&api_key=${hunterKey}&limit=10`
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (res.status === 429) {
        results.push({
          id: c.id, shortName: c.short_name, originalEmail: c.contact_email,
          domain, decision: 'hunter-rate-limit',
          error: 'Hunter.io rate-limited — re-run later',
        })
        continue
      }
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        results.push({
          id: c.id, shortName: c.short_name, originalEmail: c.contact_email,
          domain, decision: 'hunter-error',
          error: `${res.status} ${detail.slice(0, 200)}`,
        })
        continue
      }
      response = (await res.json()) as HunterDomainSearchResponse
    } catch (err) {
      results.push({
        id: c.id, shortName: c.short_name, originalEmail: c.contact_email,
        domain, decision: 'hunter-error',
        error: err instanceof Error ? err.message : String(err),
      })
      continue
    }

    const candidates = response.data?.emails ?? []
    if (candidates.length === 0) {
      // Mark this clinic as "Hunter has nothing for this domain" so the
      // next run's WHERE-clause excludes it — keeps free-tier budget for
      // domains we haven't tried yet.
      if (!dryRun) {
        const emptyNote = `\n[hunter-checked-empty] ${new Date().toISOString()} domain-search returned 0 emails`
        await sql`
          UPDATE prospect_clinics
          SET notes = COALESCE(notes, '') || ${emptyNote},
              updated_at = NOW()
          WHERE id = ${c.id}
        `
      }
      results.push({
        id: c.id, shortName: c.short_name, originalEmail: c.contact_email,
        domain, decision: 'no-candidates',
      })
      continue
    }

    let best: { email: HunterEmail; score: number; reason: string } | null = null
    for (const e of candidates) {
      if (!e.value) continue
      const candidateDomain = extractDomain(e.value)
      if (candidateDomain !== domain) continue
      const conf = e.confidence ?? 0
      if (conf < MIN_CONFIDENCE) continue
      const s = scoreCandidate(e)
      if (s.score < MIN_SCORE) continue
      let boostedScore = s.score
      let boostedReason = s.reason
      const last = (e.last_name ?? '').toLowerCase()
      if (last.length > 3 && c.short_name.toLowerCase().includes(last)) {
        boostedScore = Math.max(boostedScore, 100)
        boostedReason = `${s.reason} + surname matches clinic name (likely founder)`
      }
      if (!best || boostedScore > best.score) best = { email: e, score: boostedScore, reason: boostedReason }
    }

    if (!best) {
      results.push({
        id: c.id, shortName: c.short_name, originalEmail: c.contact_email,
        domain, decision: 'no-verified-email',
      })
      continue
    }

    const newEmail = best.email.value!
    const newFirst = best.email.first_name ?? c.contact_first_name
    const newFull =
      `${best.email.first_name ?? ''} ${best.email.last_name ?? ''}`.trim() || c.contact_full_name
    const newRole = best.email.position ?? c.contact_role
    const confidence = best.email.confidence ?? 0

    const auditNote =
      `\n[hunter-enriched] ${new Date().toISOString()} ` +
      `was=${c.contact_email} → ${newEmail} (conf=${confidence}) ` +
      `· ${newFull} · ${newRole} · matched: ${best.reason}`

    if (!dryRun) {
      await sql`
        UPDATE prospect_clinics
        SET contact_email = ${newEmail},
            contact_first_name = ${newFirst},
            contact_full_name = ${newFull},
            contact_role = ${newRole},
            notes = COALESCE(notes, '') || ${auditNote},
            updated_at = NOW()
        WHERE id = ${c.id}
      `
    }

    results.push({
      id: c.id, shortName: c.short_name, originalEmail: c.contact_email,
      domain,
      decision: dryRun ? 'enriched-dryrun' : 'enriched',
      bestCandidate: {
        name: newFull,
        title: newRole ?? '',
        email: newEmail,
        confidence,
        score: best.score,
        reason: best.reason,
      },
    })
  }

  const summary = {
    mode: dryRun ? 'dry-run' : 'applied',
    totalScanned: clinics.length,
    enriched: results.filter((r) => r.decision === 'enriched' || r.decision === 'enriched-dryrun').length,
    noVerifiedEmail: results.filter((r) => r.decision === 'no-verified-email').length,
    noCandidates: results.filter((r) => r.decision === 'no-candidates').length,
    hunterErrors: results.filter((r) => r.decision === 'hunter-error').length,
    hunterRateLimited: results.filter((r) => r.decision === 'hunter-rate-limit').length,
    skipped: results.filter((r) =>
      r.decision === 'skipped-not-generic' || r.decision === 'skipped-no-domain',
    ).length,
    hunterCallsMade,
    callBudget,
    clinicsRemaining: clinics.length - results.length,
  }

  return NextResponse.json({ summary, results })
}
