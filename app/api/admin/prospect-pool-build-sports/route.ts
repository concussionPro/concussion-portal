/**
 * POST /api/admin/prospect-pool-build-sports
 *
 * Expands the cold-outreach prospect pool with AU sports-related allied
 * health clinics, sourced from Zac's saved Apollo CRM.
 *
 * Targeted ICP per Zac:
 *  - Australia-wide (not just Byron region)
 *  - 4+ clinicians (any of physio, osteo, chiro, exercise phys, myo)
 *  - Sports-related focus (sports medicine, sports physio, athletic
 *    performance, return-to-play, sports clinic)
 *
 * Pipeline:
 *  1. Apollo /contacts/search with sports-keyword loop, AU filter
 *  2. Group results by organisation domain (one prospect per clinic)
 *  3. Per domain, pick most-senior contact (owner/principal/director > head
 *     > manager > senior > other)
 *  4. Exclude domains we already have in prospect_clinics (by slug or
 *     contact_email domain match)
 *  5. Insert as status='researching', source='apollo-sports-pool',
 *     priorityWave='P3' (mid-priority — not as warm as engaged contacts)
 *
 * Team size estimation: Apollo's free /contacts/search doesn't expose
 * employee count, so we default the team to 4 of the dominant discipline
 * (placeholder small-bucket). Notes are tagged "TEAM ESTIMATED — verify"
 * so an admin / Hunter pass can refine before send-eligibility.
 *
 * Body: { dryRun?: bool, perKwPages?: number }
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'
import { createClinic, getClinicBySlug } from '@/lib/prospect/repo'
import type { Discipline, State, ClinicTeam } from '@/lib/prospect/types'

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

interface ApolloContact {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  title?: string
  seniority?: string
  organization?: {
    name?: string
    primary_domain?: string
    website_url?: string
    country?: string
    state?: string
    city?: string
    industry?: string
    keywords?: string[]
  }
  organization_id?: string
  emailer_campaign_status?: { bounced?: boolean; unsubscribed?: boolean }
  country?: string
}

const SPORTS_KEYWORDS = [
  'sports medicine',
  'sports physio',
  'sports physiotherapy',
  'sports clinic',
  'athletic performance',
  'sports rehabilitation',
  'sports injury',
  'sports chiro',
  'sports osteopath',
  'return to play',
]

const DOMAIN_BLOCKLIST = [
  '.edu.au', '.edu', 'students.',
  '.gov.au', '.gov',
  '.health.nsw.gov.au', '.health.qld.gov.au', '.health.vic.gov.au',
  'apa.org', 'osteopathy.org',
  'nrlfans', 'afl.com',
  'sarahkey.com',
]

const TITLE_RANK: Array<{ pattern: RegExp; rank: number; label: string }> = [
  { pattern: /\b(owner|founder|co-founder)\b/i, rank: 100, label: 'owner/founder' },
  { pattern: /\bprincipal\b/i, rank: 95, label: 'principal' },
  { pattern: /\b(managing director|ceo|md)\b/i, rank: 90, label: 'managing director' },
  { pattern: /\bdirector\b/i, rank: 80, label: 'director' },
  { pattern: /\bpractice (owner|manager|principal)\b/i, rank: 75, label: 'practice manager' },
  { pattern: /\b(clinic|practice) (lead|head)\b/i, rank: 70, label: 'clinic lead' },
  { pattern: /\b(head|chief)\b/i, rank: 65, label: 'head' },
  { pattern: /\bsenior\b/i, rank: 40, label: 'senior' },
  { pattern: /\bmanager\b/i, rank: 35, label: 'manager' },
]

function titleRank(title: string | undefined): { rank: number; label: string } {
  if (!title) return { rank: 0, label: 'no-title' }
  for (const t of TITLE_RANK) {
    if (t.pattern.test(title)) return { rank: t.rank, label: t.label }
  }
  return { rank: 10, label: 'clinical-other' }
}

function isBlockedDomain(domain: string): boolean {
  const lower = domain.toLowerCase()
  return DOMAIN_BLOCKLIST.some((d) => lower.includes(d))
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64)
}

function disciplineFromTitle(title: string | undefined): Discipline {
  const t = (title || '').toLowerCase()
  if (t.includes('osteo')) return 'osteopaths'
  if (t.includes('chiro')) return 'physiotherapists' // chiro not in type; closest mapping
  if (t.includes('exercise phys') || t.includes('exercise physiologist') || t.includes(' ep ') || t.endsWith(' ep')) return 'exercisePhys'
  if (t.includes('myo')) return 'myotherapists'
  if (t.includes('massage')) return 'remedialMassage'
  if (t.includes('sports med') || t.includes('doctor') || t.includes('physician')) return 'sportsMedicineDoctors'
  if (t.includes('gp') || t.includes('general practitioner')) return 'generalPractitioners'
  return 'physiotherapists'
}

const AU_STATE_MAP: Record<string, State> = {
  'new south wales': 'NSW', nsw: 'NSW', sydney: 'NSW',
  victoria: 'VIC', vic: 'VIC', melbourne: 'VIC',
  queensland: 'QLD', qld: 'QLD', brisbane: 'QLD',
  'western australia': 'WA', wa: 'WA', perth: 'WA',
  'south australia': 'SA', sa: 'SA', adelaide: 'SA',
  tasmania: 'TAS', tas: 'TAS', hobart: 'TAS',
  'australian capital territory': 'ACT', act: 'ACT', canberra: 'ACT',
  'northern territory': 'NT', nt: 'NT', darwin: 'NT',
}

function inferState(org: { state?: string; city?: string } | undefined): State {
  const candidates = [org?.state, org?.city].filter(Boolean) as string[]
  for (const c of candidates) {
    const key = c.trim().toLowerCase()
    if (AU_STATE_MAP[key]) return AU_STATE_MAP[key]
  }
  return 'NSW' // safe fallback (largest AU state)
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.APOLLO_API_KEY) {
    return NextResponse.json({ error: 'APOLLO_API_KEY env var not set' }, { status: 500 })
  }

  let body: { dryRun?: boolean; perKwPages?: number }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false
  const perKwPages = Math.max(1, Math.min(body.perKwPages ?? 2, 5))

  // 1. Pull AU contacts matching sports keywords from Apollo CRM
  const allContacts: ApolloContact[] = []
  const seenIds = new Set<string>()
  let apolloCalls = 0
  for (const kw of SPORTS_KEYWORDS) {
    let page = 1
    while (page <= perKwPages) {
      try {
        const result = await apollo<{ contacts?: ApolloContact[]; pagination?: { total_pages?: number; total_entries?: number } }>(
          '/contacts/search',
          {
            q_keywords: kw,
            person_locations: ['Australia'],
            page,
            per_page: 100,
          },
        )
        apolloCalls += 1
        const items = result.contacts || []
        for (const c of items) {
          if (c.id && !seenIds.has(c.id) && !(c.emailer_campaign_status?.bounced || c.emailer_campaign_status?.unsubscribed)) {
            seenIds.add(c.id)
            allContacts.push(c)
          }
        }
        const totalPages = result.pagination?.total_pages || 1
        if (page >= totalPages || items.length === 0) break
        page += 1
      } catch (err) {
        return NextResponse.json({
          error: 'apollo search failed', kw, page,
          detail: err instanceof Error ? err.message : String(err),
        }, { status: 502 })
      }
    }
  }

  // 2. Group by domain, count contacts per domain (proxy for team size signal)
  type DomainCluster = {
    domain: string
    orgName: string
    contacts: ApolloContact[]
  }
  const byDomain = new Map<string, DomainCluster>()
  for (const c of allContacts) {
    const email = (c.email || '').toLowerCase().trim()
    if (!email || !email.includes('@')) continue
    const domain = email.split('@')[1]
    if (!domain || isBlockedDomain(domain)) continue
    const orgName = c.organization?.name || domain
    if (!byDomain.has(domain)) byDomain.set(domain, { domain, orgName, contacts: [] })
    byDomain.get(domain)!.contacts.push(c)
  }

  // 3. Per domain: pick highest-ranked contact; estimate team size from
  // contact count at that domain (Apollo CRM count is a proxy — usually
  // 1-3 contacts per domain even when team is 8+, so we don't rely on it
  // for the ICP gate, just as a hint).
  const candidates: Array<{
    domain: string
    orgName: string
    bestContact: ApolloContact
    titleLabel: string
    contactsAtDomain: number
  }> = []
  for (const cluster of byDomain.values()) {
    let best: { c: ApolloContact; rank: number; label: string } | null = null
    for (const c of cluster.contacts) {
      const r = titleRank(c.title)
      if (!best || r.rank > best.rank) best = { c, rank: r.rank, label: r.label }
    }
    if (!best || !best.c.email) continue
    candidates.push({
      domain: cluster.domain,
      orgName: cluster.orgName,
      bestContact: best.c,
      titleLabel: best.label,
      contactsAtDomain: cluster.contacts.length,
    })
  }

  // 4. Exclude domains we already have. Match by contact_email domain.
  const { rows: existing } = await sql<{ contact_email: string; slug: string }>`
    SELECT contact_email, slug FROM prospect_clinics
  `
  const existingDomains = new Set<string>()
  const existingSlugs = new Set<string>()
  for (const r of existing) {
    const d = (r.contact_email || '').toLowerCase().split('@')[1]
    if (d) existingDomains.add(d)
    if (r.slug) existingSlugs.add(r.slug)
  }
  const newOnly = candidates.filter((c) => !existingDomains.has(c.domain))

  // 5. Build prospect_clinics inserts
  const results: Array<{
    domain: string
    orgName: string
    decision: 'insert' | 'insert-dryrun' | 'slug-conflict' | 'insert-failed'
    slug?: string
    contactEmail?: string
    bucket?: string
    error?: string
  }> = []

  for (const cand of newOnly) {
    let slug = slugify(cand.orgName)
    if (!slug) slug = slugify(cand.domain.split('.')[0])
    let attempt = slug
    let n = 0
    while (existingSlugs.has(attempt)) {
      n += 1
      attempt = `${slug}-${n}`
      if (n > 20) break
    }
    slug = attempt

    const discipline = disciplineFromTitle(cand.bestContact.title)
    const state = inferState(cand.bestContact.organization)
    const city = cand.bestContact.organization?.city || 'Unknown'
    const team: ClinicTeam = {
      osteopaths: 0,
      physiotherapists: 0,
      generalPractitioners: 0,
      sportsMedicineDoctors: 0,
      exercisePhys: 0,
      myotherapists: 0,
      remedialMassage: 0,
      practiceManager: 0,
      admin: 0,
    }
    team[discipline] = 4 // placeholder small-bucket; verify before send

    if (dryRun) {
      results.push({
        domain: cand.domain,
        orgName: cand.orgName,
        decision: 'insert-dryrun',
        slug,
        contactEmail: cand.bestContact.email,
        bucket: 'small (placeholder team — verify)',
      })
      continue
    }

    try {
      await createClinic({
        slug,
        accessKey: (() => {
          const ab = 'abcdefghijkmnopqrstuvwxyz23456789'
          let key = ''
          for (let i = 0; i < 6; i++) key += ab[(slug.charCodeAt(i % slug.length) + i * 37) % ab.length]
          return key
        })(),
        name: cand.orgName,
        shortName: cand.orgName.split(/[—–-]| at /i)[0].trim().slice(0, 40),
        city,
        state,
        region: city, // approx — Zac can refine
        contactFirstName: cand.bestContact.first_name || '',
        contactFullName: `${cand.bestContact.first_name ?? ''} ${cand.bestContact.last_name ?? ''}`.trim(),
        contactEmail: cand.bestContact.email!,
        contactRole: cand.bestContact.title,
        contactDiscipline: discipline,
        clinicWebsiteUrl: cand.bestContact.organization?.website_url || `https://${cand.domain}`,
        team,
        localTargets: [],
        travelBand: 'flight-domestic', // generic AU-wide default; verify per clinic
        cohortRecommendation: 'recommended',
        status: 'researching',
        researchSource: 'imported',
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        notes:
          `Imported from Apollo CRM via sports-keyword search. ` +
          `Contact title: ${cand.bestContact.title ?? 'unknown'} (${cand.titleLabel}). ` +
          `${cand.contactsAtDomain} Apollo contact(s) at this domain. ` +
          `TEAM PLACEHOLDER (4 ${discipline}) — verify via website or Hunter pass before send-eligibility. ` +
          `Source: apollo-sports-pool.`,
      })
      existingSlugs.add(slug)
      existingDomains.add(cand.domain)
      results.push({
        domain: cand.domain,
        orgName: cand.orgName,
        decision: 'insert',
        slug,
        contactEmail: cand.bestContact.email,
        bucket: 'small (placeholder)',
      })
    } catch (err) {
      results.push({
        domain: cand.domain,
        orgName: cand.orgName,
        decision: 'insert-failed',
        slug,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json({
    summary: {
      mode: dryRun ? 'dry-run' : 'applied',
      apolloCalls,
      contactsFetched: allContacts.length,
      uniqueDomains: byDomain.size,
      qualifyingCandidates: candidates.length,
      newAfterDedup: newOnly.length,
      inserted: results.filter((r) => r.decision === 'insert').length,
      insertedDryRun: results.filter((r) => r.decision === 'insert-dryrun').length,
      failed: results.filter((r) => r.decision === 'insert-failed').length,
    },
    results: results.slice(0, 100),
    truncated: results.length > 100,
  })
}
