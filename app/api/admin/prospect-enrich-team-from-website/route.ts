/**
 * POST /api/admin/prospect-enrich-team-from-website
 *
 * Scrapes each prospect clinic's website /team /our-team /about /people
 * pages to extract a real clinician headcount. Replaces the placeholder
 * team={physiotherapists:4} that Apollo imports default to — 97% of
 * sendable prospects have this fictitious 4 which buckets them all
 * into T2 (Hub Pack) regardless of whether they're a solo practice or
 * a 20-clinician network.
 *
 * Team size determines:
 *   - Outreach tier: T1 (on-site $8-10k) / T2 (Hub Pack $1.5k) / T3 (solo)
 *   - Email template branch: hubPackPriceFor(team) routes between Hub
 *     Pack pitch and on-site pitch
 *   - Deal value estimate in B2B Outreach dashboard
 *
 * Detection heuristic:
 *   1. Try /team, /our-team, /our-people, /staff, /clinicians, /about,
 *      /about-us, /meet-the-team in order, take the first that returns
 *      200 with HTML
 *   2. From page HTML extract candidate clinician signals:
 *        - <h2/h3/h4> headings containing common clinician titles
 *          (Dr X, Firstname Lastname + Physio/Osteo/EP/Sports Med/etc)
 *        - Image alt-text matching `Name + role` patterns
 *        - schema.org Person markup blocks
 *   3. Count UNIQUE name appearances (dedupe — most pages list each
 *      person multiple times: photo alt + heading + bio paragraph).
 *   4. Map total count to team JSONB: assume the dominant discipline
 *      from contact_discipline holds the count; preserve admin = 1
 *      (every clinic has at least one admin role per Zac).
 *
 * Result tagged in notes as [team-enriched=N/source-page/yyyy-mm-dd]
 * so re-runs skip already-enriched prospects (override with ?reenrich=true).
 *
 * Body: {
 *   dryRun?: boolean (default true)
 *   limit?: number (default 30, max 100 — scraping is slow)
 *   reenrich?: boolean (default false)
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { lookup } from 'node:dns/promises'
import net from 'node:net'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

export const runtime = 'nodejs'
export const maxDuration = 300

const TEAM_PAGE_CANDIDATES = [
  '/team',
  '/our-team',
  '/our-people',
  '/staff',
  '/clinicians',
  '/practitioners',
  '/our-practitioners',
  '/meet-the-team',
  '/about',
  '/about-us',
]

// Clinician role keywords — used to filter name-matches to actual clinical staff
// (vs receptionists, owners, etc). Order matters for inferring dominant role.
const ROLE_KEYWORDS: Array<{ pattern: RegExp; role: string }> = [
  { pattern: /\bphysiotherapist|physio\b/i, role: 'physiotherapists' },
  { pattern: /\bosteopath\b/i, role: 'osteopaths' },
  { pattern: /\bsports?\s*physician|sports?\s*doctor\b/i, role: 'sportsMedicineDoctors' },
  { pattern: /\bexercise\s*physiologist|\baccredited\s*exercise|EP\b/i, role: 'exercisePhys' },
  { pattern: /\bchiropractor|chiro\b/i, role: 'physiotherapists' /* map chiro to physio bucket */ },
  { pattern: /\bmyotherapist|myo\b/i, role: 'myotherapists' },
  { pattern: /\bremedial\s*massage|massage\s*therapist\b/i, role: 'remedialMassage' },
  { pattern: /\bgeneral\s*practitioner|\bGP\b/i, role: 'generalPractitioners' },
]

// Quick HTML helper — strip tags, decode common entities, normalise whitespace
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── SSRF guard ───────────────────────────────────────────────────────────────
// clinic_website_url comes from the DB (Apollo imports / manual entry) — an
// attacker-controlled or typo'd URL must not let this route reach internal
// services. Require http/https, resolve every hostname and reject private /
// link-local / loopback / metadata ranges, and re-check each redirect hop.

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true
  const [a, b] = parts
  if (a === 0) return true // 0.0.0.0/8
  if (a === 127) return true // loopback 127.0.0.0/8
  if (a === 10) return true // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
  if (a === 192 && b === 168) return true // 192.168.0.0/16
  if (a === 169 && b === 254) return true // link-local + cloud metadata 169.254.0.0/16
  return false
}

export function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip)
  if (family === 4) return isPrivateIPv4(ip)
  if (family === 6) {
    const lower = ip.toLowerCase()
    if (lower === '::' || lower === '::1') return true // unspecified + loopback
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true // ULA fc00::/7
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true // link-local fe80::/10
    // IPv4-mapped (::ffff:10.0.0.1) — check the embedded IPv4
    const v4 = lower.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
    if (v4) return isPrivateIPv4(v4[1])
    return false
  }
  return true // not a valid IP — deny
}

/** True if the URL is http/https and its host resolves only to public IPs. */
export async function isSafeUrl(url: URL): Promise<boolean> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  const host = url.hostname.replace(/^\[|\]$/g, '') // strip IPv6 brackets
  if (net.isIP(host)) return !isPrivateIp(host)
  try {
    const addrs = await lookup(host, { all: true })
    if (addrs.length === 0) return false
    return addrs.every((a) => !isPrivateIp(a.address))
  } catch {
    return false
  }
}

const MAX_REDIRECTS = 5

async function fetchPage(url: string): Promise<string | null> {
  try {
    let current = new URL(url)
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!(await isSafeUrl(current))) return null
      const res = await fetch(current, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(8000),
        redirect: 'manual',
      })
      // Follow redirects manually so every hop is re-checked against the guard
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location')
        if (!location) return null
        current = new URL(location, current)
        continue
      }
      if (!res.ok) return null
      const ct = res.headers.get('content-type') || ''
      if (!ct.includes('html')) return null
      return await res.text()
    }
    return null // too many redirects
  } catch {
    return null
  }
}

/**
 * Extract clinician count + dominant role from a team-page HTML.
 *
 * Two parallel signals — we take MAX of the two to avoid undercount:
 *   A. Heading-name extraction: count `<h2|h3|h4>` blocks whose text
 *      matches a name pattern AND is near a role keyword (within 200 chars)
 *   B. Image alt-text: count alt strings that look like a person name
 *      with a clinical title nearby in surrounding text
 *
 * Returns null if no convincing clinician signal is found (page may
 * not be a team page).
 */
function extractTeam(html: string): { count: number; role: string; signal: string } | null {
  const text = stripHtml(html)

  // Signal A — heading-name extraction with role-proximity
  const headingRe = /<h[234][^>]*>([^<]{4,80})<\/h[234]>/gi
  const namesA = new Set<string>()
  let roleHitsA: Record<string, number> = {}
  let m: RegExpExecArray | null
  while ((m = headingRe.exec(html)) !== null) {
    const headingText = stripHtml(m[1]).trim()
    if (!headingText) continue
    // Person-name shape: 2-4 capitalised words, optional Dr. / Mr / Ms prefix
    const nameMatch = headingText.match(
      /^(?:Dr\.?\s+|Mr\.?\s+|Mrs\.?\s+|Ms\.?\s+)?([A-Z][a-z']{1,15}(?:\s+[A-Z][a-z'-]{1,18}){1,3})$/,
    )
    if (!nameMatch) continue
    const name = nameMatch[1].trim()
    // Role proximity: scan +/-200 chars of original HTML for role keyword
    const idx = m.index
    const window = stripHtml(html.slice(Math.max(0, idx - 200), idx + 400))
    let matchedRole: string | null = null
    for (const { pattern, role } of ROLE_KEYWORDS) {
      if (pattern.test(window)) {
        matchedRole = role
        roleHitsA[role] = (roleHitsA[role] ?? 0) + 1
        break
      }
    }
    if (matchedRole) namesA.add(name.toLowerCase())
  }

  // Signal B — image alt-text with role proximity
  const altRe = /<img[^>]+alt=["']([^"']{4,90})["']/gi
  const namesB = new Set<string>()
  let roleHitsB: Record<string, number> = {}
  while ((m = altRe.exec(html)) !== null) {
    const alt = m[1].trim()
    const nameMatch = alt.match(
      /^(?:Dr\.?\s+|Mr\.?\s+|Mrs\.?\s+|Ms\.?\s+)?([A-Z][a-z']{1,15}(?:\s+[A-Z][a-z'-]{1,18}){1,3})/,
    )
    if (!nameMatch) continue
    const name = nameMatch[1].trim()
    const idx = m.index
    const window = stripHtml(html.slice(Math.max(0, idx - 300), idx + 500))
    let matchedRole: string | null = null
    for (const { pattern, role } of ROLE_KEYWORDS) {
      if (pattern.test(window)) {
        matchedRole = role
        roleHitsB[role] = (roleHitsB[role] ?? 0) + 1
        break
      }
    }
    if (matchedRole) namesB.add(name.toLowerCase())
  }

  const countA = namesA.size
  const countB = namesB.size
  const count = Math.max(countA, countB)
  if (count === 0) return null

  // Dominant role across both signals
  const totalRoleHits: Record<string, number> = {}
  for (const [k, v] of Object.entries(roleHitsA)) totalRoleHits[k] = (totalRoleHits[k] ?? 0) + v
  for (const [k, v] of Object.entries(roleHitsB)) totalRoleHits[k] = (totalRoleHits[k] ?? 0) + v
  const dominantRole =
    Object.entries(totalRoleHits).sort((a, b) => b[1] - a[1])[0]?.[0] || 'physiotherapists'

  // Sanity cap — team-page extraction can over-count via testimonial sections
  // or partner logos that look like person names. 40 clinicians is the
  // practical AU clinic-network ceiling.
  const sanityCapped = Math.min(count, 40)

  return {
    count: sanityCapped,
    role: dominantRole,
    signal: `heading=${countA}/alt=${countB}`,
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { dryRun?: boolean; limit?: number; reenrich?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false
  const limit = Math.max(1, Math.min(body.limit ?? 30, 100))
  const reenrich = body.reenrich === true

  const { rows: targets } = await sql<{
    id: number
    short_name: string
    contact_email: string
    clinic_website_url: string
    team: Record<string, number>
  }>`
    SELECT id, short_name, contact_email, clinic_website_url, team
    FROM prospect_clinics
    WHERE status IN ('researching', 'approved', 'opened', 'sent', 'engaged')
      AND clinic_website_url IS NOT NULL
      AND clinic_website_url <> ''
      AND (${reenrich} = TRUE OR COALESCE(notes, '') NOT LIKE '%[team-enriched=%')
    ORDER BY id
    LIMIT ${limit}
  `

  type Result = {
    id: number
    shortName: string
    websiteTried: string[]
    teamFound: number | null
    roleFound: string | null
    signal?: string
    decision: 'enriched' | 'no-team-found' | 'no-website' | 'dry-enriched'
    note?: string
  }
  const results: Result[] = []

  for (const t of targets) {
    let baseUrl = t.clinic_website_url.trim()
    if (!baseUrl) {
      results.push({ id: t.id, shortName: t.short_name, websiteTried: [], teamFound: null, roleFound: null, decision: 'no-website' })
      continue
    }
    if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`
    const tried: string[] = []
    let extract: ReturnType<typeof extractTeam> | null = null
    for (const path of TEAM_PAGE_CANDIDATES) {
      const url = baseUrl.replace(/\/$/, '') + path
      tried.push(path)
      const html = await fetchPage(url)
      if (!html) continue
      extract = extractTeam(html)
      if (extract && extract.count >= 1) break
    }

    if (!extract) {
      results.push({ id: t.id, shortName: t.short_name, websiteTried: tried, teamFound: null, roleFound: null, decision: 'no-team-found' })
      continue
    }

    // Build new team JSONB. Preserve admin=1 (every clinic has at least one),
    // place the extracted count into the dominant role bucket. Zero out the
    // old placeholder buckets so we don't double-count.
    const newTeam: Record<string, number> = {
      osteopaths: 0,
      physiotherapists: 0,
      generalPractitioners: 0,
      sportsMedicineDoctors: 0,
      exercisePhys: 0,
      myotherapists: 0,
      remedialMassage: 0,
      practiceManager: 0,
      admin: 1,
    }
    newTeam[extract.role] = extract.count

    const noteTag = `[team-enriched=${extract.count}/${extract.role}/${extract.signal}/${new Date()
      .toISOString()
      .slice(0, 10)}]`

    if (!dryRun) {
      await sql`
        UPDATE prospect_clinics
        SET team = ${JSON.stringify(newTeam)}::jsonb,
            notes = COALESCE(notes, '') || E'\n' || ${noteTag}
        WHERE id = ${t.id}
      `
    }

    results.push({
      id: t.id,
      shortName: t.short_name,
      websiteTried: tried,
      teamFound: extract.count,
      roleFound: extract.role,
      signal: extract.signal,
      decision: dryRun ? 'dry-enriched' : 'enriched',
    })
  }

  const summary = {
    mode: dryRun ? 'dry-run' : 'applied',
    examined: results.length,
    enriched: results.filter((r) => r.decision === 'enriched' || r.decision === 'dry-enriched').length,
    noTeamFound: results.filter((r) => r.decision === 'no-team-found').length,
    noWebsite: results.filter((r) => r.decision === 'no-website').length,
    // Distribution by extracted team size
    sizeBuckets: results.reduce<Record<string, number>>(
      (acc, r) => {
        if (r.teamFound == null) return acc
        const bucket =
          r.teamFound >= 11 ? '11+ (T1 on-site)' :
          r.teamFound >= 8 ? '8-10 (T1)' :
          r.teamFound >= 6 ? '6-7 (T2 large)' :
          r.teamFound >= 3 ? '3-5 (T2 Hub Pack)' :
          '1-2 (T3 solo)'
        acc[bucket] = (acc[bucket] ?? 0) + 1
        return acc
      },
      {},
    ),
  }

  return NextResponse.json({
    summary,
    results: results.slice(0, 60),
    truncated: results.length > 60,
  })
}
