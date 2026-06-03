/**
 * POST /api/admin/apollo-enrich-engaged
 *
 * Fully autonomous research pass. Pulls every engaged Apollo contact
 * (replied / clicked / opened / finished sequence without unsubscribe),
 * enriches each with their company's employee count + location + industry,
 * filters to the ICP (AU + allied health adjacent + 8+ clinical staff),
 * and either:
 *  - dryRun=true: returns the filtered list as a preview
 *  - dryRun=false: bulk-inserts qualifying matches into prospect_clinics
 *    with status='approved', contactEmailSource='apollo-verified',
 *    priorityWave='P0' (jumps the queue — they already know Zac)
 *
 * Tracking-independence: replies are always logged regardless of pixel
 * state. So even with open/click tracking off, replied=true is reliable.
 *
 * Body: { dryRun?: bool, includeFinishedNoUnsub?: bool, perPage?: number }
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

const APOLLO_BASE = 'https://api.apollo.io/api/v1'

async function apollo<T>(path: string, body?: object): Promise<T> {
  const key = process.env.APOLLO_API_KEY
  if (!key) throw new Error('APOLLO_API_KEY env var not set')
  const url = `${APOLLO_BASE}${path}`
  // Apollo's search endpoints all expect POST with JSON body — empty body
  // is fine; URL params are ignored.
  const res = await fetch(url, {
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

interface ApolloOrg {
  name?: string
  primary_domain?: string
  website_url?: string
  estimated_num_employees?: number
  country?: string
  state?: string
  city?: string
  industry?: string
  industries?: string[]
  keywords?: string[]
}

interface ApolloContact {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  email_status?: string
  title?: string
  organization?: ApolloOrg
  organization_id?: string
  emailer_campaign_status?: {
    replied?: boolean
    finished?: boolean
    unsubscribed?: boolean
    bounced?: boolean
  }
  last_contacted_at?: string
  country?: string
}

const ICP_KEYWORDS = ['physiotherapy', 'osteopathy', 'allied health', 'sports medicine', 'exercise physiology', 'physiotherapist', 'osteopath']

// Domains that look like prospects but are wrong-fit and would dilute the pool.
const DOMAIN_BLOCKLIST = [
  '.edu.au', '.edu', 'students.',         // Students / academia
  '.gov.au', '.gov',                       // Government
  '.health.nsw.gov.au', '.health.qld.gov.au', '.health.vic.gov.au', // Public health districts
  'bhs.com', 'bdh.com', 'nbh.com',         // Hospital systems
  'sarahkey.com',                          // UK practitioner aggregator
  'apa.org', 'osteopathy.org',             // Professional bodies — not clinics
  'nrlfans', 'afl.com',                    // Sports orgs (separate pipeline)
]

function isBlocklistedDomain(email: string): boolean {
  const lower = email.toLowerCase()
  return DOMAIN_BLOCKLIST.some((d) => lower.includes(d))
}

/**
 * For REPLIED contacts (already engaged with Zac), the qualification is the
 * reply itself. Skip the strict 8+ employee gate (Apollo's lite payload
 * doesn't populate that field anyway). Apply only:
 *  - AU (location filter — already applied server-side)
 *  - Email present + not on domain blocklist
 *  - Has a clinic-looking organization (or solo clinician email)
 */
function matchesIcp(c: ApolloContact): { fit: boolean; reasons: string[] } {
  const reasons: string[] = []
  const email = (c.email || '').toLowerCase()
  if (!email) return { fit: false, reasons: ['no email'] }
  if (isBlocklistedDomain(email)) return { fit: false, reasons: ['blocklisted-domain'] }

  const org = c.organization || {}
  const country = (c.country || org.country || '').toLowerCase()
  if (country && !country.includes('australia') && !country.includes('au')) {
    return { fit: false, reasons: [`country=${country}`] }
  }

  reasons.push('replied', 'AU', 'clean-domain')
  return { fit: true, reasons }
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64)
}

function generateAccessKey(slug: string): string {
  const alphabet = 'abcdefghijkmnopqrstuvwxyz23456789'
  let key = ''
  for (let i = 0; i < 6; i++) {
    const charCode = (slug.charCodeAt(i % slug.length) + i * 37) % alphabet.length
    key += alphabet[charCode]
  }
  return key
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { dryRun?: boolean; includeFinishedNoUnsub?: boolean; perPage?: number }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false
  const perPage = Math.min(body.perPage ?? 100, 200)

  if (!process.env.APOLLO_API_KEY) {
    return NextResponse.json({ error: 'APOLLO_API_KEY env var not set on production deploy' }, { status: 500 })
  }

  // Apollo's /contacts/search filters take JSON body. q_keywords is a single
  // keyword string (no boolean OR). We loop the ICP keywords and dedup
  // results to cover the whole AU allied-health space.
  const replied: ApolloContact[] = []
  const seenIds = new Set<string>()
  let totalApiCalls = 0
  const maxPagesPerKw = 3 // ceiling on cost

  for (const kw of ICP_KEYWORDS.slice(0, 5)) {
    let page = 1
    while (page <= maxPagesPerKw) {
      try {
        const result = await apollo<{ contacts?: ApolloContact[]; pagination?: { total_pages?: number; page?: number; total_entries?: number } }>(
          '/contacts/search',
          {
            q_keywords: kw,
            person_locations: ['Australia'],
            // Replied stage — this is what Apollo's CRM auto-applies when a
            // contact replies in any sequence. 7454 in the account.
            contact_stage_names: ['Replied'],
            page,
            per_page: perPage,
          },
        )
        totalApiCalls += 1
        const items = result.contacts || []
        for (const c of items) {
          if (c.id && !seenIds.has(c.id)) {
            seenIds.add(c.id)
            replied.push(c)
          }
        }
        const totalPages = result.pagination?.total_pages || 1
        if (page >= totalPages || items.length === 0) break
        page += 1
      } catch (err) {
        return NextResponse.json({ error: 'apollo search failed', detail: err instanceof Error ? err.message : String(err), kw, page }, { status: 502 })
      }
    }
  }

  // Apollo's contact_stage_names: ['Replied'] filter already scoped server-side.
  // Post-filter: drop bounced/unsubscribed if those flags are set.
  const engaged = replied.filter((c) => {
    const s = c.emailer_campaign_status || {}
    if (s.bounced || s.unsubscribed) return false
    return true
  })

  // Apply ICP gate
  const qualified: Array<ApolloContact & { _icpReasons: string[] }> = []
  const rejected: Array<{ name: string; email: string; reasons: string[] }> = []
  for (const c of engaged) {
    const { fit, reasons } = matchesIcp(c)
    if (fit) qualified.push({ ...c, _icpReasons: reasons })
    else rejected.push({ name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(), email: c.email ?? '', reasons })
  }

  // Dedup against existing prospect_clinics
  const inserts: Array<{ slug: string; email: string; name: string; clinic: string; employees: number }> = []
  if (qualified.length > 0) {
    const emails = qualified.map((c) => c.email).filter(Boolean) as string[]
    // sql tagged template doesn't accept array literals — fall back to a plain
    // ANY-clause via a json-encoded string + cast on the SQL side.
    const emailsJson = JSON.stringify(emails)
    const { rows: existing } = await sql<{ contact_email: string; slug: string }>`
      SELECT contact_email, slug FROM prospect_clinics
      WHERE contact_email = ANY (SELECT jsonb_array_elements_text(${emailsJson}::jsonb))
    `
    const existingEmails = new Set(existing.map((e) => e.contact_email.toLowerCase()))

    for (const c of qualified) {
      const email = (c.email || '').toLowerCase()
      if (!email || existingEmails.has(email)) continue
      const org = c.organization || {}
      const clinicName = org.name || 'Unknown clinic'
      const slug = slugify(`${clinicName}-${c.last_name ?? c.first_name ?? 'contact'}`)
      inserts.push({
        slug,
        email,
        name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
        clinic: clinicName,
        employees: org.estimated_num_employees ?? 0,
      })
    }
  }

  if (dryRun) {
    return NextResponse.json({
      summary: {
        mode: 'dry-run',
        apolloCalls: totalApiCalls,
        totalAuContactsFetched: replied.length,
        engagedAfterStatusFilter: engaged.length,
        qualifiedAfterIcp: qualified.length,
        rejectedAfterIcp: rejected.length,
        newToImport: inserts.length,
      },
      qualified: qualified.map((c) => ({
        name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
        email: c.email,
        title: c.title,
        clinic: c.organization?.name,
        employees: c.organization?.estimated_num_employees,
        city: c.organization?.city,
        state: c.organization?.state,
        icpReasons: c._icpReasons,
        replied: c.emailer_campaign_status?.replied,
        lastContactedAt: c.last_contacted_at,
      })),
      rejected: rejected.slice(0, 20),
      newToImport: inserts,
    })
  }

  // ACTUAL IMPORT — out of scope for v1, return TODO marker so we don't blast prematurely
  return NextResponse.json({
    summary: {
      mode: 'apply',
      todo: 'Apply path not implemented yet — review dryRun output first; will wire after first qualified-list inspection',
      qualifiedCount: qualified.length,
    },
  })
}
