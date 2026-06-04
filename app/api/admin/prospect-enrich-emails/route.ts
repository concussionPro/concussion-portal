/**
 * POST /api/admin/prospect-enrich-emails
 *
 * Walks every prospect_clinics row in status 'researching' or 'approved'
 * whose contactEmail is a generic mailbox (info@ / admin@ / reception@ /
 * etc) and tries to upgrade it to a verified direct contact via Apollo
 * /mixed_people/search by organisation domain + senior titles.
 *
 * Why: the cron's deliverability filter blocks generic mailboxes (high
 * spam-trap risk + reception staff often forward to spam). Without
 * direct contacts the auto-fire queue is mostly empty even after the
 * approval gate is dropped. Apollo's database has direct emails for most
 * AU allied-health clinics — we just hadn't been calling it per-prospect.
 *
 * Per-clinic flow:
 *  1. Skip if notes already contain "[apollo-enriched]" (idempotent).
 *  2. Extract domain from existing contactEmail.
 *  3. Apollo /mixed_people/search with q_organization_domains + senior
 *     person_seniorities + per_page=5.
 *  4. Score candidates: owner > founder > principal > director > head >
 *     manager. Reject titles containing 'reception', 'admin', 'intern',
 *     'student'.
 *  5. If best candidate has email_status === 'verified' (or 'likely_to_engage'),
 *     UPDATE contact_email, contact_first_name, contact_full_name,
 *     contact_role. Original mailbox preserved in notes.
 *
 * Body: { dryRun?: boolean }  — default true.
 *
 * Returns: per-clinic audit with the decision + the candidate Apollo found.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

const APOLLO_BASE = 'https://api.apollo.io/api/v1'

async function apollo<T>(path: string, body?: object): Promise<T> {
  const key = process.env.APOLLO_API_KEY
  if (!key) throw new Error('APOLLO_API_KEY env var not set')
  const res = await fetch(`${APOLLO_BASE}${path}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
      'X-Api-Key': key,
    },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Apollo ${res.status} ${path}: ${detail.slice(0, 300)}`)
  }
  return res.json()
}

interface ApolloPerson {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  email_status?: string
  title?: string
  seniority?: string
}

interface ApolloSearchResponse {
  people?: ApolloPerson[]
  contacts?: ApolloPerson[]
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
  { pattern: /\b(director)\b/i, score: 80, label: 'director' },
  { pattern: /\bpractice (owner|manager|principal)\b/i, score: 75, label: 'practice manager' },
  { pattern: /\b(clinic|practice) (lead|head)\b/i, score: 70, label: 'clinic lead' },
  { pattern: /\b(head|chief)\b/i, score: 65, label: 'head' },
  { pattern: /\bsenior\b/i, score: 40, label: 'senior' },
  { pattern: /\bmanager\b/i, score: 35, label: 'manager' },
]

const TITLE_BLOCKLIST = /\b(reception|receptionist|admin assistant|intern|student|junior|graduate|in training)\b/i

function scoreCandidate(p: ApolloPerson): { score: number; reason: string } {
  const title = (p.title || '').trim()
  if (!title) return { score: 0, reason: 'no title' }
  if (TITLE_BLOCKLIST.test(title)) return { score: -1, reason: `blocked title: ${title}` }
  for (const t of TITLE_SCORE) {
    if (t.pattern.test(title)) return { score: t.score, reason: `matched ${t.label}: ${title}` }
  }
  return { score: 10, reason: `clinical title (unranked): ${title}` }
}

function emailUsable(p: ApolloPerson): boolean {
  if (!p.email) return false
  if (p.email.includes('domain.com') || p.email.includes('email_not_unlocked')) return false
  // Apollo email_status values: verified, likely_to_engage, guessed, unavailable, etc.
  const status = p.email_status || ''
  return status === 'verified' || status === 'likely_to_engage'
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
  if (!process.env.APOLLO_API_KEY) {
    return NextResponse.json({ error: 'APOLLO_API_KEY env var not set' }, { status: 500 })
  }

  let body: { dryRun?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false

  const { rows: clinics } = await sql<ClinicRow>`
    SELECT id, slug, short_name, contact_email, contact_full_name, contact_first_name,
           contact_role, notes, status
    FROM prospect_clinics
    WHERE status IN ('researching', 'approved')
      AND contact_email IS NOT NULL
      AND COALESCE(notes, '') NOT LIKE '%[apollo-enriched]%'
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
      | 'apollo-error'
    bestCandidate?: {
      name: string
      title: string
      email: string
      emailStatus: string
      score: number
    }
    error?: string
  }> = []

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

    // Use /contacts/search (free plan compatible) — searches Zac's saved
    // Apollo contacts. After 6 months of outreach his CRM has direct emails
    // for most AU allied-health clinics. /mixed_people/search would search
    // Apollo's full DB but is paywalled (403 on free plan).
    //
    // /contacts/search supports q_organization_domains for domain match
    // and q_keywords for name fuzzy-match. Try domain first, then keyword
    // (clinic short name) as fallback.
    let response: ApolloSearchResponse = {}
    let lookupMode: 'domain' | 'keyword' | 'both-failed' = 'domain'
    try {
      response = await apollo<ApolloSearchResponse>('/contacts/search', {
        q_organization_domains: [domain],
        per_page: 25,
      })
      const candidatesByDomain = [...(response.people ?? []), ...(response.contacts ?? [])]
      if (candidatesByDomain.length === 0) {
        // Try keyword fallback — useful when Apollo stored the org under a
        // different domain alias (e.g. ".com.au" vs ".com").
        lookupMode = 'keyword'
        response = await apollo<ApolloSearchResponse>('/contacts/search', {
          q_keywords: c.short_name,
          per_page: 25,
        })
      }
    } catch (err) {
      results.push({
        id: c.id, shortName: c.short_name, originalEmail: c.contact_email,
        domain, decision: 'apollo-error',
        error: err instanceof Error ? err.message : String(err),
      })
      continue
    }

    const candidates = [...(response.people ?? []), ...(response.contacts ?? [])]
    if (candidates.length === 0) {
      results.push({
        id: c.id, shortName: c.short_name, originalEmail: c.contact_email,
        domain, decision: 'no-candidates',
      })
      continue
    }

    // Post-filter for quality:
    //  1. Candidate email's domain must match the clinic's contactEmail
    //     domain. The q_keywords fallback otherwise returns contacts at
    //     OTHER clinics who happen to share a first name (e.g. Hunter Physio
    //     was matching "Alice Hunter" at therunningroom.net).
    //  2. Minimum candidate score = 30. Score 10 = "Physiotherapist" with
    //     no leadership marker → could be a junior clinician, not the
    //     principal. Senior titles (40+) are signal that this is a
    //     decision-maker we can pitch on-site training to.
    //  3. Score 100 (owner/founder) for surname-matches-clinic-name —
    //     boost when Apollo says "John Hunter" at hunterphysio.com.au
    //     because that's almost certainly the founder.
    const MIN_SCORE = 30
    let best: { person: ApolloPerson; score: number; reason: string } | null = null
    for (const p of candidates) {
      const candidateDomain = p.email ? extractDomain(p.email) : null
      if (candidateDomain !== domain) continue // strict domain match
      const s = scoreCandidate(p)
      if (s.score < MIN_SCORE) continue
      // Founder/owner heuristic — surname appears in clinic shortName.
      const last = (p.last_name ?? '').toLowerCase()
      let boostedScore = s.score
      let boostedReason = s.reason
      if (last.length > 3 && c.short_name.toLowerCase().includes(last)) {
        boostedScore = Math.max(boostedScore, 100)
        boostedReason = `${s.reason} + surname matches clinic name (likely founder)`
      }
      if (!best || boostedScore > best.score) best = { person: p, score: boostedScore, reason: boostedReason }
    }

    if (!best || !emailUsable(best.person)) {
      results.push({
        id: c.id, shortName: c.short_name, originalEmail: c.contact_email,
        domain,
        decision: 'no-verified-email',
        bestCandidate: best
          ? {
              name: `${best.person.first_name ?? ''} ${best.person.last_name ?? ''}`.trim(),
              title: best.person.title ?? '',
              email: best.person.email ?? '(no email)',
              emailStatus: best.person.email_status ?? '(no status)',
              score: best.score,
            }
          : undefined,
      })
      continue
    }

    const newEmail = best.person.email!
    const newFirst = best.person.first_name ?? c.contact_first_name
    const newFull = `${best.person.first_name ?? ''} ${best.person.last_name ?? ''}`.trim() || c.contact_full_name
    const newRole = best.person.title ?? c.contact_role

    const auditNote =
      `\n[apollo-enriched] ${new Date().toISOString()} ` +
      `was=${c.contact_email} → ${newEmail} (${best.person.email_status}) ` +
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
        emailStatus: best.person.email_status ?? '',
        score: best.score,
      },
    })
  }

  const summary = {
    mode: dryRun ? 'dry-run' : 'applied',
    totalScanned: clinics.length,
    enriched: results.filter((r) => r.decision === 'enriched' || r.decision === 'enriched-dryrun').length,
    noVerifiedEmail: results.filter((r) => r.decision === 'no-verified-email').length,
    noCandidates: results.filter((r) => r.decision === 'no-candidates').length,
    apolloErrors: results.filter((r) => r.decision === 'apollo-error').length,
    skipped: results.filter((r) =>
      r.decision === 'skipped-not-generic' || r.decision === 'skipped-no-domain',
    ).length,
  }

  return NextResponse.json({ summary, results })
}
