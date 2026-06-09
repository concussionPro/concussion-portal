/**
 * Places-driven clinic sweep.
 *
 * Apollo CRM coverage of AU allied health is exhausted (4,392 contacts
 * deduped; rate-limited at 600/24h). This script bypasses Apollo and
 * enumerates clinics directly from Google Places, then crawls each
 * clinic site for clinician first-name + direct email so we can write
 * a personalised T1 ("Hi {firstname}").
 *
 * Pipeline:
 *  1. Places Text Search across (categories × AU metros) with pagination.
 *  2. Dedupe by website domain. Drop chains, hospital networks, NDIS-only
 *     practices, and aggregator directories.
 *  3. Crawl each clinic's /, /about, /team, /staff, /our-team, /contact
 *     for a clinician name + direct email (first.last@domain pattern).
 *     Reject role-based (info@, admin@, reception@, etc.).
 *  4. Dedupe vs existing prospect_clinics.contact_email domains.
 *  5. Bulk insert via bulkCreateClinics().
 *
 * Run:
 *   GOOGLE_PLACES_API_KEY=xxxx npx tsx scripts/places-clinic-sweep.ts \
 *     --cities=top10 --categories=physio,osteo,ep \
 *     --dry-run
 *
 *   (drop --dry-run to actually insert)
 */

import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })

import { sql } from '@vercel/postgres'
import { bulkCreateClinics, type CreateClinicInput } from '@/lib/prospect/repo'
import { generateAccessKey } from '@/lib/prospect/access-key'
import type { ClinicTeam, Discipline, State } from '@/lib/prospect/types'

// ─── Config ──────────────────────────────────────────────────────────

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY
if (!PLACES_KEY) {
  console.error('GOOGLE_PLACES_API_KEY env var required.')
  console.error('Set it in .env.local or pass inline:')
  console.error('  GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/places-clinic-sweep.ts ...')
  process.exit(1)
}

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const ARG = (name: string): string | undefined => {
  const a = args.find((x) => x.startsWith(`--${name}=`))
  return a ? a.split('=')[1] : undefined
}

const CITIES_SET = ARG('cities') || 'top10'
const CATEGORIES_SET = ARG('categories') || 'core'

const CITY_GROUPS: Record<string, Array<{ city: string; state: State; region: string }>> = {
  top10: [
    { city: 'Sydney', state: 'NSW', region: 'Sydney' },
    { city: 'Melbourne', state: 'VIC', region: 'Melbourne' },
    { city: 'Brisbane', state: 'QLD', region: 'Brisbane' },
    { city: 'Perth', state: 'WA', region: 'Perth' },
    { city: 'Adelaide', state: 'SA', region: 'Adelaide' },
    { city: 'Gold Coast', state: 'QLD', region: 'Gold Coast' },
    { city: 'Newcastle', state: 'NSW', region: 'Newcastle / Hunter' },
    { city: 'Canberra', state: 'ACT', region: 'Canberra / ACT' },
    { city: 'Sunshine Coast', state: 'QLD', region: 'Sunshine Coast' },
    { city: 'Wollongong', state: 'NSW', region: 'Wollongong' },
  ],
  full: [
    // Top 10
    { city: 'Sydney', state: 'NSW', region: 'Sydney' },
    { city: 'Melbourne', state: 'VIC', region: 'Melbourne' },
    { city: 'Brisbane', state: 'QLD', region: 'Brisbane' },
    { city: 'Perth', state: 'WA', region: 'Perth' },
    { city: 'Adelaide', state: 'SA', region: 'Adelaide' },
    { city: 'Gold Coast', state: 'QLD', region: 'Gold Coast' },
    { city: 'Newcastle', state: 'NSW', region: 'Newcastle / Hunter' },
    { city: 'Canberra', state: 'ACT', region: 'Canberra / ACT' },
    { city: 'Sunshine Coast', state: 'QLD', region: 'Sunshine Coast' },
    { city: 'Wollongong', state: 'NSW', region: 'Wollongong' },
    // Tier 2
    { city: 'Geelong', state: 'VIC', region: 'Geelong' },
    { city: 'Hobart', state: 'TAS', region: 'Hobart' },
    { city: 'Townsville', state: 'QLD', region: 'Regional QLD' },
    { city: 'Cairns', state: 'QLD', region: 'Regional QLD' },
    { city: 'Toowoomba', state: 'QLD', region: 'Regional QLD' },
    { city: 'Darwin', state: 'NT', region: 'Darwin' },
    { city: 'Ballarat', state: 'VIC', region: 'Regional VIC' },
    { city: 'Bendigo', state: 'VIC', region: 'Regional VIC' },
    { city: 'Launceston', state: 'TAS', region: 'Regional TAS' },
    { city: 'Central Coast', state: 'NSW', region: 'Central Coast' },
    // Lifestyle / health-conscious pockets
    { city: 'Byron Bay', state: 'NSW', region: 'Northern Rivers' },
    { city: 'Noosa', state: 'QLD', region: 'Sunshine Coast' },
    { city: 'Mornington Peninsula', state: 'VIC', region: 'Regional VIC' },
    { city: 'Surf Coast', state: 'VIC', region: 'Regional VIC' },
    { city: 'Coffs Harbour', state: 'NSW', region: 'Northern Rivers' },
    { city: 'Wagga Wagga', state: 'NSW', region: 'Western NSW' },
    { city: 'Bunbury', state: 'WA', region: 'Regional WA' },
    { city: 'Albury', state: 'NSW', region: 'Western NSW' },
    { city: 'Mackay', state: 'QLD', region: 'Regional QLD' },
    { city: 'Bundaberg', state: 'QLD', region: 'Regional QLD' },
  ],
}

const CATEGORY_QUERIES: Record<string, Array<{ q: string; discipline: Discipline }>> = {
  core: [
    { q: 'physiotherapy clinic', discipline: 'physiotherapists' },
    { q: 'sports physiotherapy', discipline: 'physiotherapists' },
    { q: 'exercise physiology', discipline: 'exercisePhys' },
    { q: 'osteopath', discipline: 'osteopaths' },
    { q: 'sports medicine clinic', discipline: 'sportsMedicineDoctors' },
  ],
  full: [
    { q: 'physiotherapy clinic', discipline: 'physiotherapists' },
    { q: 'sports physiotherapy', discipline: 'physiotherapists' },
    { q: 'rehabilitation physiotherapy', discipline: 'physiotherapists' },
    { q: 'exercise physiology', discipline: 'exercisePhys' },
    { q: 'accredited exercise physiologist', discipline: 'exercisePhys' },
    { q: 'osteopath', discipline: 'osteopaths' },
    { q: 'osteopathy clinic', discipline: 'osteopaths' },
    { q: 'sports medicine clinic', discipline: 'sportsMedicineDoctors' },
    { q: 'concussion clinic', discipline: 'physiotherapists' },
  ],
}

const cities = CITY_GROUPS[CITIES_SET] || CITY_GROUPS.top10
const categories = CATEGORY_QUERIES[CATEGORIES_SET] || CATEGORY_QUERIES.core

// ─── Filters ─────────────────────────────────────────────────────────

const DOMAIN_BLOCKLIST = [
  'healthengine.com.au', 'hotdoc.com.au', 'localsearch.com.au', 'truelocal.com.au',
  'yellowpages.com.au', 'whitepages.com.au', 'finder.com.au',
  'oasportsmedicine.com.au', 'physiotherapy.asn.au', 'osteopathy.org.au', 'essa.org.au', 'sma.org.au',
  // hospital networks — typically NDIS-only / no buyer signal
  'health.gov.au', '.gov.au', 'health.vic.gov', 'health.nsw.gov',
  'epworth.org.au', 'svhm.org.au', 'mater.org.au', 'austin.org.au',
  // chain franchises (would-be central decision-makers, not local owners)
  'physitrack.com', 'goodlifehealth', 'plus500',
  // peak / commercial
  'medibank.com.au', 'bupa.com.au', 'hcf.com.au',
]

const NAME_REJECT = /(pediatric|paediatric|kids|children|disability|ndis|autism|early intervention|hand therapy|hospital|university|school)/i

const ROLE_EMAIL = /^(info|admin|contact|reception|enquiries|hello|office|team|support|mail|noreply|book|bookings|appointments|hi|inbox|practice|orders|account|accounts)@/i

function looksRoleBased(email: string): boolean {
  return ROLE_EMAIL.test(email)
}

function domainOf(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function isBlockedDomain(d: string): boolean {
  return DOMAIN_BLOCKLIST.some((b) => d.endsWith(b) || d.includes(b))
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64)
}


// ─── Places search ───────────────────────────────────────────────────

type PlaceResult = {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  websiteUri?: string
  nationalPhoneNumber?: string
  primaryType?: string
  userRatingCount?: number
}

async function placesText(query: string): Promise<PlaceResult[]> {
  const all: PlaceResult[] = []
  let pageToken: string | undefined
  for (let page = 0; page < 3; page++) {
    const body: Record<string, unknown> = { textQuery: query, languageCode: 'en', regionCode: 'AU', pageSize: 20 }
    if (pageToken) body.pageToken = pageToken
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_KEY!,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.primaryType,places.userRatingCount,nextPageToken',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) {
      const txt = await res.text()
      console.warn(`  places err ${res.status}: ${txt.slice(0, 120)}`)
      break
    }
    const d = (await res.json()) as { places?: PlaceResult[]; nextPageToken?: string }
    for (const p of d.places || []) all.push(p)
    pageToken = d.nextPageToken
    if (!pageToken) break
    await sleep(2200) // Places requires ~2s before nextPageToken is active
  }
  return all
}

// ─── Email crawl ─────────────────────────────────────────────────────

const CONTACT_PATHS = ['', '/about', '/about-us', '/team', '/our-team', '/staff', '/practitioners', '/our-practitioners', '/contact', '/contact-us']

async function fetchOnce(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('html') && !ct.includes('text')) return null
    return await res.text()
  } catch {
    return null
  }
}

type EmailHit = { email: string; firstName: string; lastName?: string; title?: string }

const NAME_NEAR_EMAIL_WINDOW = 240 // chars before the email to scan for a name

function extractEmails(html: string, domain: string): EmailHit[] {
  // Strip HTML tags but keep text for name proximity
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')

  // Also harvest from mailto:
  const mailtoMatches = Array.from(
    html.matchAll(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi),
  ).map((m) => m[1].toLowerCase())

  const inlineEmails = Array.from(
    text.matchAll(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi),
  ).map((m) => ({ email: m[1].toLowerCase(), index: m.index ?? 0 }))

  const allEmails = new Set([
    ...mailtoMatches,
    ...inlineEmails.map((x) => x.email),
  ])

  const hits: EmailHit[] = []
  for (const email of allEmails) {
    // Same-domain only (skip Gmail addresses pasted on websites)
    const eDomain = email.split('@')[1]
    if (eDomain !== domain && !eDomain.endsWith(`.${domain}`) && domain !== eDomain) continue
    if (looksRoleBased(email)) continue

    // Try to find a name BEFORE this email occurrence
    let firstName = ''
    let lastName = ''
    let title: string | undefined
    const occ = inlineEmails.find((x) => x.email === email)
    if (occ) {
      const window = text.slice(Math.max(0, occ.index - NAME_NEAR_EMAIL_WINDOW), occ.index)
      // Look for "Dr Firstname Lastname", "Firstname Lastname", or capitalized name run
      const nameMatch = window.match(/(?:Dr\.?\s+)?([A-Z][a-z]{1,15})\s+([A-Z][a-z]{1,20})/g)
      if (nameMatch && nameMatch.length) {
        const last = nameMatch[nameMatch.length - 1]
        const parts = last.replace(/^Dr\.?\s+/, '').split(/\s+/)
        firstName = parts[0]
        lastName = parts[1] || ''
      }
      // Title sniff: look for clinical role words in same window
      const roleMatch = window.match(/\b(Owner|Founder|Principal|Director|Physiotherapist|Osteopath|Exercise Physiologist|Sports Physician|Chiropractor|Practice Manager|Lead)\b/i)
      if (roleMatch) title = roleMatch[0]
    }

    // Fallback: derive first name from email local-part if no name found
    if (!firstName) {
      const local = email.split('@')[0]
      const seg = local.split(/[._-]+/)[0]
      if (seg.length >= 2 && /^[a-z]+$/i.test(seg)) {
        firstName = seg.charAt(0).toUpperCase() + seg.slice(1)
      }
    }
    if (!firstName) continue

    hits.push({ email, firstName, lastName, title })
  }
  return hits
}

async function findClinicianEmail(websiteUrl: string, domain: string): Promise<EmailHit | null> {
  for (const path of CONTACT_PATHS) {
    const url = websiteUrl.replace(/\/$/, '') + path
    const html = await fetchOnce(url)
    if (!html) continue
    const hits = extractEmails(html, domain)
    if (hits.length) {
      // Prefer hits with a real name + a title
      hits.sort((a, b) => (b.title ? 1 : 0) + (b.lastName ? 1 : 0) - ((a.title ? 1 : 0) + (a.lastName ? 1 : 0)))
      return hits[0]
    }
    await sleep(200)
  }
  return null
}

// ─── Utils ──────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function disciplineFromTitle(title: string | undefined, fallback: Discipline): Discipline {
  if (!title) return fallback
  const t = title.toLowerCase()
  if (t.includes('osteo')) return 'osteopaths'
  if (t.includes('exercise phys')) return 'exercisePhys'
  if (t.includes('sports phys') || t.includes('doctor') || t.includes('physician')) return 'sportsMedicineDoctors'
  if (t.includes('physio')) return 'physiotherapists'
  return fallback
}

function emptyTeam(): ClinicTeam {
  return {
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
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log(`Cities: ${cities.length} (${CITIES_SET})`)
  console.log(`Categories: ${categories.length} (${CATEGORIES_SET})`)
  console.log(`Total queries: ${cities.length * categories.length}`)
  console.log(`DRY RUN: ${DRY_RUN}`)
  console.log()

  // ── 1. Places enumeration ──
  const seenPlaceIds = new Set<string>()
  type Stage = { placeId: string; name: string; website: string; phone?: string; city: string; state: State; region: string; discipline: Discipline; address?: string; rating?: number }
  const stage: Stage[] = []

  for (const c of cities) {
    for (const cat of categories) {
      const q = `${cat.q} ${c.city} ${c.state}`
      process.stdout.write(`  ${q.padEnd(60)}`)
      const places = await placesText(q)
      let kept = 0
      for (const p of places) {
        if (!p.id || seenPlaceIds.has(p.id)) continue
        seenPlaceIds.add(p.id)
        const website = p.websiteUri || ''
        if (!website) continue
        const dom = domainOf(website)
        if (!dom || isBlockedDomain(dom)) continue
        const name = p.displayName?.text || ''
        if (!name) continue
        if (NAME_REJECT.test(name)) continue
        stage.push({
          placeId: p.id,
          name,
          website,
          phone: p.nationalPhoneNumber,
          city: c.city,
          state: c.state,
          region: c.region,
          discipline: cat.discipline,
          address: p.formattedAddress,
          rating: p.userRatingCount,
        })
        kept += 1
      }
      console.log(`→ ${places.length} found, ${kept} kept`)
      await sleep(400)
    }
  }

  console.log()
  console.log(`Stage total (unique place IDs): ${stage.length}`)

  // Dedupe by website domain (a chain can have multiple Places listings)
  const byDomain = new Map<string, Stage>()
  for (const s of stage) {
    const d = domainOf(s.website)
    if (!d) continue
    if (!byDomain.has(d)) byDomain.set(d, s)
  }
  console.log(`Unique domains: ${byDomain.size}`)

  // ── 2. Drop domains already in DB ──
  const { rows: existing } = await sql<{ contact_email: string; clinic_website_url: string }>`
    SELECT contact_email, clinic_website_url FROM prospect_clinics
  `
  const existingDomains = new Set<string>()
  for (const r of existing) {
    const d1 = (r.contact_email || '').toLowerCase().split('@')[1]
    if (d1) existingDomains.add(d1)
    const d2 = domainOf(r.clinic_website_url || '')
    if (d2) existingDomains.add(d2)
  }
  const newDomains = Array.from(byDomain.values()).filter((s) => {
    const d = domainOf(s.website)
    return d && !existingDomains.has(d)
  })
  console.log(`Net-new domains (not in prospect_clinics): ${newDomains.length}`)
  console.log()

  // ── 3. Email crawl (concurrent, capped at 6) ──
  const CONCURRENCY = 6
  const withEmail: Array<Stage & { hit: EmailHit }> = []
  let processed = 0
  const queue = [...newDomains]

  async function worker() {
    while (queue.length) {
      const s = queue.shift()
      if (!s) return
      const d = domainOf(s.website)
      const hit = await findClinicianEmail(s.website, d)
      processed += 1
      if (hit) {
        withEmail.push({ ...s, hit })
        if (processed % 25 === 0) {
          console.log(`  crawled ${processed}/${newDomains.length}  | found emails: ${withEmail.length}`)
        }
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  console.log()
  console.log(`Crawled: ${processed}, with extracted clinician email: ${withEmail.length}`)
  console.log()

  // ── 4. Build inserts ──
  const { rows: existingSlugRows } = await sql<{ slug: string }>`SELECT slug FROM prospect_clinics`
  const existingSlugs = new Set(existingSlugRows.map((r) => r.slug))

  const inputs: CreateClinicInput[] = []
  for (const e of withEmail) {
    let slug = slugify(e.name)
    let n = 0
    while (existingSlugs.has(slug)) {
      n += 1
      slug = `${slugify(e.name)}-${n}`
      if (n > 10) break
    }
    existingSlugs.add(slug)
    const disc = disciplineFromTitle(e.hit.title, e.discipline)
    const team = emptyTeam()
    team[disc] = 4
    inputs.push({
      slug,
      accessKey: generateAccessKey(),
      name: e.name,
      shortName: e.name.split(/[—–-]| at /i)[0].trim().slice(0, 40),
      city: e.city,
      state: e.state,
      region: e.region,
      contactFirstName: e.hit.firstName,
      contactFullName: `${e.hit.firstName} ${e.hit.lastName || ''}`.trim(),
      contactEmail: e.hit.email,
      contactRole: e.hit.title,
      contactDiscipline: disc,
      clinicWebsiteUrl: e.website,
      team,
      localTargets: [],
      travelBand: 'flight-domestic',
      cohortRecommendation: 'recommended',
      status: 'researching',
      researchSource: 'imported',
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      notes:
        `Imported from Google Places sweep ${new Date().toISOString().slice(0, 10)}. ` +
        `Place: ${e.address || 'unknown address'}. ` +
        `Phone: ${e.phone || 'n/a'}. ` +
        `Email extracted from clinic website. ` +
        `Title proxy: ${e.hit.title || 'unverified'}. ` +
        `TEAM PLACEHOLDER (4 ${disc}) — verify before send.`,
    })
  }

  console.log(`Inputs ready to insert: ${inputs.length}`)
  console.log()
  console.log('Sample (first 15):')
  for (const i of inputs.slice(0, 15)) {
    console.log(`  ${i.contactFirstName.padEnd(12)} | ${i.contactEmail.padEnd(40)} | ${(i.contactRole || '?').padEnd(20)} | ${i.name}`)
  }

  if (DRY_RUN) {
    console.log()
    console.log('Dry-run only. No inserts.')
    return
  }

  console.log()
  console.log('Inserting…')
  const inserted = await bulkCreateClinics(inputs)
  console.log(`Inserted: ${inserted}`)

  const { rows: count } = await sql<{ status: string; n: number }>`
    SELECT status, COUNT(*)::int n FROM prospect_clinics GROUP BY status ORDER BY n DESC
  `
  console.log()
  console.log('Final status distribution:')
  console.table(count)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
