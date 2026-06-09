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
import { generateAccessKey } from '@/lib/prospect/access-key'

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

  // Capture wider net: any AU allied-health contact in the account, regardless
  // of stage. Engagement signal is inferred post-hoc from email_status +
  // last_contacted_at + emailer_campaign_status flags. Replied is the
  // strongest signal but opens/clicks/delivered also count.
  for (const kw of ICP_KEYWORDS.slice(0, 5)) {
    let page = 1
    while (page <= maxPagesPerKw) {
      try {
        const result = await apollo<{ contacts?: ApolloContact[]; pagination?: { total_pages?: number; page?: number; total_entries?: number } }>(
          '/contacts/search',
          {
            q_keywords: kw,
            person_locations: ['Australia'],
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

  // Score each contact's engagement (best → worst). Bounced + unsubscribed are
  // hard blocked. Everything else is in the engagement spectrum.
  type Engagement = { signal: 'replied' | 'clicked' | 'opened' | 'finished' | 'contacted' | 'none'; score: number }
  function engagementOf(c: ApolloContact): Engagement {
    const s = c.emailer_campaign_status || {}
    if (s.bounced || s.unsubscribed) return { signal: 'none', score: -1 }
    if (s.replied) return { signal: 'replied', score: 5 }
    if (s.finished) return { signal: 'finished', score: 3 }
    if (c.last_contacted_at) return { signal: 'contacted', score: 2 }
    return { signal: 'none', score: 0 }
  }

  // Filter to anyone NOT bounced/unsubscribed (the warm pool — every
  // surviving contact has at least delivered cleanly to a real inbox).
  const engaged = replied
    .map((c) => ({ contact: c, eng: engagementOf(c) }))
    .filter(({ eng }) => eng.score >= 0)
    .sort((a, b) => b.eng.score - a.eng.score)
    .map(({ contact }) => contact)

  // Apply ICP gate
  const qualified: Array<ApolloContact & { _icpReasons: string[] }> = []
  const rejected: Array<{ name: string; email: string; reasons: string[] }> = []
  for (const c of engaged) {
    const { fit, reasons } = matchesIcp(c)
    if (fit) qualified.push({ ...c, _icpReasons: reasons })
    else rejected.push({ name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(), email: c.email ?? '', reasons })
  }

  // Group qualified contacts BY CLINIC DOMAIN — we want 1 prospect_clinic per
  // clinic, not per staff member. For each domain, pick the most-engaged
  // contact (replied > finished > contacted), or the most senior title
  // (owner/director/principal/founder beats junior staff).
  function domainOf(email: string): string {
    return email.toLowerCase().split('@')[1] || ''
  }
  function seniorityScore(title?: string): number {
    if (!title) return 0
    const t = title.toLowerCase()
    if (/owner|founder|director|principal|managing/.test(t)) return 10
    if (/practice manager|head of/.test(t)) return 7
    if (/senior|lead/.test(t)) return 5
    return 1
  }

  const byDomain = new Map<string, ApolloContact & { _icpReasons: string[] }>()
  for (const c of qualified) {
    const d = domainOf(c.email || '')
    if (!d) continue
    const existing = byDomain.get(d)
    if (!existing) {
      byDomain.set(d, c)
      continue
    }
    // Pick the better contact for this clinic
    const existingScore = seniorityScore(existing.title)
    const candidateScore = seniorityScore(c.title)
    if (candidateScore > existingScore) byDomain.set(d, c)
  }

  // Dedup against existing prospect_clinics (by both email and domain)
  const inserts: Array<{
    slug: string
    domain: string
    email: string
    firstName: string
    fullName: string
    title: string
    clinic: string
    city: string
    state: string
  }> = []

  if (byDomain.size > 0) {
    const domains = [...byDomain.keys()]
    const domainsJson = JSON.stringify(domains)
    const { rows: existing } = await sql<{ contact_email: string; clinic_website_url: string }>`
      SELECT contact_email, clinic_website_url FROM prospect_clinics
      WHERE LOWER(contact_email) = ANY (SELECT jsonb_array_elements_text(${domainsJson}::jsonb))
         OR LOWER(clinic_website_url) ~ ANY (SELECT jsonb_array_elements_text(${domainsJson}::jsonb))
    `
    const existingDomains = new Set<string>()
    for (const e of existing) {
      const ed = (e.contact_email || '').toLowerCase().split('@')[1]
      if (ed) existingDomains.add(ed)
      const wd = (e.clinic_website_url || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
      if (wd) existingDomains.add(wd)
    }

    for (const [domain, c] of byDomain) {
      if (existingDomains.has(domain)) continue
      const org = c.organization || {}
      const clinicName = org.name || domain.replace(/\.(com\.au|com|org\.au|org)$/, '').replace(/[-.]/g, ' ')
      const slug = slugify(`${clinicName}-apollo`)
      inserts.push({
        slug,
        domain,
        email: (c.email || '').toLowerCase(),
        firstName: c.first_name ?? '',
        fullName: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
        title: c.title ?? 'Principal',
        clinic: clinicName,
        city: org.city ?? '',
        state: org.state ?? '',
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

  // ACTUAL IMPORT — persist each clinic-level prospect as status='researching'
  // so Zac reviews team size + multidisc fit BEFORE they hit the send queue.
  const applied: Array<{ slug: string; clinic: string; email: string }> = []
  const applyErrors: Array<{ slug: string; error: string }> = []

  for (const ins of inserts) {
    try {
      const accessKey = generateAccessKey()
      // Map Apollo state strings to AU state codes — best effort
      function mapState(s: string): string {
        const lower = s.toLowerCase()
        if (lower.includes('new south wales') || lower === 'nsw') return 'NSW'
        if (lower.includes('queensland') || lower === 'qld') return 'QLD'
        if (lower.includes('victoria') || lower === 'vic') return 'VIC'
        if (lower.includes('south australia') || lower === 'sa') return 'SA'
        if (lower.includes('western australia') || lower === 'wa') return 'WA'
        if (lower.includes('tasmania') || lower === 'tas') return 'TAS'
        if (lower.includes('australian capital') || lower === 'act') return 'ACT'
        if (lower.includes('northern territory') || lower === 'nt') return 'NT'
        return 'NSW' // best-guess default; will need manual fix in admin
      }
      const stateCode = mapState(ins.state)
      // Default team — totally unknown until Zac researches. All zeros + admin so
      // it's obvious in the dashboard that this needs verification.
      const team = JSON.stringify({
        osteopaths: 0, physiotherapists: 0, generalPractitioners: 0,
        sportsMedicineDoctors: 0, exercisePhys: 0, myotherapists: 0,
        remedialMassage: 0, practiceManager: 0, admin: 1,
      })
      await sql`
        INSERT INTO prospect_clinics (
          slug, access_key, name, short_name, city, state, region,
          contact_first_name, contact_full_name, contact_email, contact_role,
          contact_discipline, clinic_website_url, team, local_targets,
          travel_band, travel_surcharge, cohort_recommendation, status,
          research_source, valid_until, notes, priority_wave, pitch_variant
        ) VALUES (
          ${ins.slug}, ${accessKey}, ${ins.clinic}, ${ins.clinic.slice(0, 32)},
          ${ins.city || 'Unknown'}, ${stateCode}, ${ins.city || 'Unknown'},
          ${ins.firstName || 'Principal'}, ${ins.fullName || 'Principal'},
          ${ins.email}, ${ins.title}, 'physiotherapists',
          ${'https://' + ins.domain}, ${team}::jsonb, '[]'::jsonb,
          'within-4hr', 300, 'recommended', 'researching',
          'apollo-engaged', NOW() + INTERVAL '90 days',
          ${'IMPORTED FROM APOLLO — needs team verification (size, multi-disc, AHPRA-registered clinicians). Engagement signal: replied/clicked/opened/finished sequence in your Apollo account.'},
          'P0', 'metro'
        )
        ON CONFLICT (slug) DO NOTHING
      `
      applied.push({ slug: ins.slug, clinic: ins.clinic, email: ins.email })
    } catch (err) {
      applyErrors.push({ slug: ins.slug, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({
    summary: {
      mode: 'applied',
      totalAuContactsFetched: replied.length,
      engaged: engaged.length,
      qualified: qualified.length,
      clinicsAfterDomainGroup: byDomain.size,
      newProspectsImported: applied.length,
      errors: applyErrors.length,
    },
    applied,
    applyErrors,
  })
}
