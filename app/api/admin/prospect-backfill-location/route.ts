/**
 * POST /api/admin/prospect-backfill-location
 *
 * Backfills city/region/state for clinics whose location data came back
 * as 'Unknown' from the Apollo CRM sweep. Strategy:
 *  1. Fetch the clinic_website_url landing page
 *  2. Extract an Australian address pattern (city + state + 4-digit postcode)
 *  3. Update DB with verified location + region from naturalRegionPhrase
 *
 * Works because almost every clinic website displays its street address
 * in the footer or hero. Falls back to fetching /contact and /about if
 * the landing page doesn't contain an address.
 *
 * Body: { dryRun?: boolean, limit?: number, slugs?: string[] }
 *
 * Per-clinic flow:
 *   - Skip if city already populated (not Unknown)
 *   - Skip if no clinic_website_url
 *   - Fetch landing → regex match → if no match, fetch /contact → /about
 *   - On match: extract { city, state, postcode } → update DB
 *   - On miss across all attempts: tag notes with backfill-failed marker
 *     so re-runs skip it
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

export const maxDuration = 300

const STATE_CODES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const
type StateCode = (typeof STATE_CODES)[number]

// Region inference from postcode prefix + state. Coarse but useful for
// regional groupings. Falls back to state name if no city/region known.
const REGION_BY_POSTCODE_PREFIX: Array<{ state: StateCode; from: number; to: number; region: string }> = [
  { state: 'NSW', from: 2000, to: 2249, region: 'Sydney' },
  { state: 'NSW', from: 2250, to: 2299, region: 'Central Coast' },
  { state: 'NSW', from: 2300, to: 2349, region: 'Newcastle / Hunter' },
  { state: 'NSW', from: 2350, to: 2499, region: 'Northern Tablelands' },
  { state: 'NSW', from: 2500, to: 2549, region: 'Wollongong' },
  { state: 'NSW', from: 2550, to: 2599, region: 'South Coast NSW' },
  { state: 'NSW', from: 2600, to: 2618, region: 'Canberra / ACT' },
  { state: 'ACT', from: 2600, to: 2618, region: 'Canberra / ACT' },
  { state: 'ACT', from: 2900, to: 2920, region: 'Canberra / ACT' },
  { state: 'NSW', from: 2619, to: 2700, region: 'Southern Tablelands' },
  { state: 'NSW', from: 2700, to: 2899, region: 'Western NSW' },
  { state: 'NSW', from: 2480, to: 2490, region: 'Northern Rivers' },
  { state: 'VIC', from: 3000, to: 3220, region: 'Melbourne' },
  { state: 'VIC', from: 3220, to: 3299, region: 'Geelong' },
  { state: 'VIC', from: 3300, to: 3999, region: 'Regional VIC' },
  { state: 'QLD', from: 4000, to: 4179, region: 'Brisbane' },
  { state: 'QLD', from: 4180, to: 4219, region: 'Logan / Redlands' },
  { state: 'QLD', from: 4220, to: 4299, region: 'Gold Coast' },
  { state: 'QLD', from: 4500, to: 4570, region: 'Sunshine Coast' },
  { state: 'QLD', from: 4570, to: 4699, region: 'Wide Bay' },
  { state: 'QLD', from: 4700, to: 4799, region: 'Central QLD' },
  { state: 'QLD', from: 4800, to: 4899, region: 'North QLD' },
  { state: 'QLD', from: 4900, to: 4999, region: 'Cairns / Far North' },
  { state: 'WA', from: 6000, to: 6199, region: 'Perth' },
  { state: 'WA', from: 6200, to: 6999, region: 'Regional WA' },
  { state: 'SA', from: 5000, to: 5199, region: 'Adelaide' },
  { state: 'SA', from: 5200, to: 5999, region: 'Regional SA' },
  { state: 'TAS', from: 7000, to: 7099, region: 'Hobart' },
  { state: 'TAS', from: 7100, to: 7299, region: 'Southern TAS' },
  { state: 'TAS', from: 7250, to: 7299, region: 'Launceston' },
  { state: 'NT', from: 800, to: 999, region: 'Darwin' },
]

function regionFromPostcode(state: StateCode, postcode: number): string {
  for (const r of REGION_BY_POSTCODE_PREFIX) {
    if (r.state === state && postcode >= r.from && postcode <= r.to) return r.region
  }
  // Fallback to state name
  return state
}

interface ExtractedAddress {
  city: string
  state: StateCode
  postcode: number
  region: string
}

/**
 * Regex pattern: "City Name STATE 1234" or "City Name, STATE 1234".
 * Captures multi-word city (up to 4 words). State must be an AU state
 * code in caps. Postcode must be 4 digits (NT 3-digit postcodes are
 * padded with leading 0 in display — handled as 4-digit match).
 */
const ADDRESS_RE = new RegExp(
  // city: 1-4 capitalised words separated by SPACES ONLY (no newlines).
  // (?:[ \t]+) is the inter-word separator — \s would let newlines and
  // <br> tags slip in, producing "King George Street\nInnaloo" as city.
  // The lookbehind `(?:^|[\s,.>])` allows entering the match from any
  // whitespace or punctuation but the city itself stays single-line.
  '(?:^|[\\s,.>])([A-Z][a-zA-Z\\-]+(?:[ \\t]+[A-Z][a-zA-Z\\-]+){0,3})[ \\t]*,?[ \\t]+(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)[ \\t]+(\\d{4})\\b',
  'g',
)

function extractAddress(html: string): ExtractedAddress | null {
  const matches = Array.from(html.matchAll(ADDRESS_RE))
  for (const m of matches) {
    const city = m[1].trim()
    const state = m[2] as StateCode
    const postcode = parseInt(m[3], 10)
    // Sanity check: avoid matching "Welcome NSW 2000" style noise.
    // City shouldn't be a common stop-word.
    if (/^(?:Welcome|Home|About|Contact|Suite|Unit|Level|Shop|Phone|Email|Tel|Visit|Located|Conveniently|Address)\b/i.test(city)) continue
    if (postcode < 200 || postcode > 9999) continue
    return { city, state, postcode, region: regionFromPostcode(state, postcode) }
  }
  return null
}

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
      },
      redirect: 'follow',
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const text = await res.text()
    return text.slice(0, 300_000)
  } catch {
    return null
  }
}

function candidatePaths(websiteUrl: string): string[] {
  const u = websiteUrl.replace(/\/+$/, '')
  return [u, `${u}/contact`]
}

/**
 * OpenStreetMap Nominatim — free clinic-name → AU location lookup.
 * No API key required. Used after website-scrape fails, before the
 * paid Google Places fallback (which only fires if GOOGLE_MAPS_API_KEY
 * is set).
 *
 * Nominatim Usage Policy:
 *   - Strict 1 req/sec rate limit (enforce via module-level throttle)
 *   - Custom User-Agent required (no generic browser UA)
 *   - Email contact in UA per their compliance ask
 *
 * Quality for AU healthcare: ~60-80% hit rate — most clinics are on OSM.
 */
let lastNominatim = 0
async function throttleNominatim(): Promise<void> {
  const elapsed = Date.now() - lastNominatim
  const wait = Math.max(0, 1100 - elapsed)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastNominatim = Date.now()
}

interface NominatimResult {
  display_name?: string
  address?: {
    city?: string
    town?: string
    suburb?: string
    village?: string
    state?: string
    postcode?: string
    country_code?: string
  }
}

const STATE_NAME_TO_CODE: Record<string, StateCode> = {
  'New South Wales': 'NSW',
  'Victoria': 'VIC',
  'Queensland': 'QLD',
  'Western Australia': 'WA',
  'South Australia': 'SA',
  'Tasmania': 'TAS',
  'Australian Capital Territory': 'ACT',
  'Northern Territory': 'NT',
}

// Pull the likely town from a clinic name's tail. Strips trailing legal/clinic
// words, returns the last 1-2 capitalised tokens (the suburb/town) — or null if
// the name is generic. e.g. "Discover Chiropractic Mackay" → "Mackay";
// "Aspire Physiotherapy Bunbury" → "Bunbury"; "Core Physio" → null.
const NON_PLACE_TAIL = new Set([
  'physio', 'physiotherapy', 'chiropractic', 'chiro', 'osteopathy', 'osteo', 'health', 'clinic',
  'centre', 'center', 'rehab', 'rehabilitation', 'sports', 'medicine', 'medical', 'wellness',
  'group', 'solutions', 'services', 'care', 'allied', 'pilates', 'therapy', 'co', 'pty', 'ltd',
  'and', 'the', 'practice', 'plus', 'studio',
])
function placeTailFromName(name: string): string | null {
  const tokens = name.replace(/[®™&,.()]/g, ' ').split(/\s+/).filter(Boolean)
  if (tokens.length < 2) return null
  // Walk from the end, collect up to 2 trailing tokens that look like a place
  // (capitalised, not a generic clinic word).
  const place: string[] = []
  for (let i = tokens.length - 1; i >= 0 && place.length < 2; i--) {
    const t = tokens[i]
    if (NON_PLACE_TAIL.has(t.toLowerCase())) break
    if (!/^[A-Z][a-zA-Z'-]+$/.test(t)) break
    place.unshift(t)
  }
  return place.length ? place.join(' ') : null
}

async function nominatimLookup(shortName: string, stateHint?: string): Promise<ExtractedAddress | null> {
  await throttleNominatim()
  const stateBit = stateHint && /^(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)$/i.test(stateHint) ? ` ${stateHint.toUpperCase()}` : ''
  const query = `${shortName}${stateBit} Australia`
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=au&format=json&limit=3&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'ConcussionEducationAustralia/1.0 (zac@concussion-education-australia.com)',
          'Accept-Language': 'en-AU,en;q=0.9',
        },
      },
    )
    clearTimeout(timer)
    if (!res.ok) return null
    const data: NominatimResult[] = await res.json()
    for (const r of data) {
      const a = r.address
      if (!a || a.country_code !== 'au') continue
      const city = a.city || a.town || a.suburb || a.village
      if (!city) continue
      const stateCode = a.state ? STATE_NAME_TO_CODE[a.state] : undefined
      if (!stateCode) continue
      const postcodeStr = a.postcode
      if (!postcodeStr) continue
      const postcode = parseInt(postcodeStr, 10)
      if (isNaN(postcode) || postcode < 200 || postcode > 9999) continue
      return {
        city,
        state: stateCode,
        postcode,
        region: regionFromPostcode(stateCode, postcode),
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Google Places Text Search — paid fallback (~$0.032/req) used only
 * after Nominatim fails. Requires GOOGLE_MAPS_API_KEY env var. Higher
 * accuracy than Nominatim for SPA / sparse clinic websites.
 */
async function googlePlacesLookup(shortName: string, stateHint?: string): Promise<ExtractedAddress | null> {
  // Accept any of the common env var names Zac may have set on Vercel
  const key =
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.GMAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) return null
  const stateBit = stateHint && /^(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)$/i.test(stateHint) ? ` ${stateHint.toUpperCase()}` : ''
  const query = `${shortName}${stateBit} Australia`
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&region=au&key=${key}`,
      { signal: controller.signal },
    )
    clearTimeout(timer)
    if (!res.ok) return null
    const data: { status?: string; results?: Array<{ formatted_address?: string; name?: string }> } = await res.json()
    if (data.status !== 'OK' || !data.results || data.results.length === 0) return null
    // Walk top 3 results — first one occasionally lands on a same-named
    // business overseas even with region=au, so the AU-address check is
    // the actual gate.
    for (const r of data.results.slice(0, 3)) {
      if (!r.formatted_address) continue
      const m = r.formatted_address.match(
        /,\s*([A-Z][a-zA-Z\-]+(?:\s+[A-Z][a-zA-Z\-]+){0,3})\s+(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\s+(\d{4}),?\s*Australia/,
      )
      if (!m) continue
      const city = m[1].trim()
      const state = m[2] as StateCode
      const postcode = parseInt(m[3], 10)
      if (postcode < 200 || postcode > 9999) continue
      return { city, state, postcode, region: regionFromPostcode(state, postcode) }
    }
    return null
  } catch {
    return null
  }
}

async function findAddressForClinic(websiteUrl: string): Promise<{ extracted: ExtractedAddress; hitPath: string } | null> {
  const paths = candidatePaths(websiteUrl)
  const settled = await Promise.all(paths.map((p) => fetchWithTimeout(p).then((html) => ({ p, html }))))
  for (const { p, html } of settled) {
    if (!html) continue
    const extracted = extractAddress(html)
    if (extracted) return { extracted, hitPath: p }
  }
  return null
}

interface ClinicRow {
  id: number
  slug: string
  short_name: string
  city: string | null
  region: string | null
  state: string | null
  clinic_website_url: string | null
  notes: string | null
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { dryRun?: boolean; limit?: number; slugs?: string[] }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false
  const limit = Math.max(1, Math.min(body.limit ?? 25, 80))
  const slugs = Array.isArray(body.slugs) ? body.slugs : null

  // Target: clinics with bad city OR bad region, not previously marked
  // backfill-failed. Slug filter takes precedence if provided.
  let candidates: ClinicRow[]
  if (slugs && slugs.length > 0) {
    const slugsJson = JSON.stringify(slugs)
    const { rows } = await sql<ClinicRow>`
      SELECT id, slug, short_name, city, region, state, clinic_website_url, notes
      FROM prospect_clinics
      WHERE slug = ANY(SELECT jsonb_array_elements_text(${slugsJson}::jsonb))
      LIMIT ${limit}
    `
    candidates = rows
  } else {
    const { rows } = await sql<ClinicRow>`
      SELECT id, slug, short_name, city, region, state, clinic_website_url, notes
      FROM prospect_clinics
      WHERE status NOT IN ('archived', 'lost', 'bounced', 'won')
        AND clinic_website_url IS NOT NULL
        AND clinic_website_url <> ''
        AND (
          city IS NULL OR city = '' OR city ~* '^unknown$'
          OR region IS NULL OR region = '' OR region ~* '^unknown$'
        )
        AND COALESCE(notes, '') NOT LIKE '%[backfill-failed-location]%'
      ORDER BY id ASC
      LIMIT ${limit}
    `
    candidates = rows
  }

  const results: Array<{
    id: number
    slug: string
    shortName: string
    websiteUrl: string | null
    decision: 'recovered' | 'recovered-dryrun' | 'no-match' | 'fetch-failed' | 'skipped-already-clean'
    pageHit?: string
    city?: string
    state?: string
    region?: string
    postcode?: number
  }> = []

  // Process clinics in concurrency-limited batches. All-parallel exhausts
  // node's connection pool and DNS resolver when many clinic sites are
  // slow/dead — limit=20 timed out at 90s while limit=3 completed in 4s.
  // Batches of 5 balance throughput vs reliability.
  const BATCH_SIZE = 5
  type FetchResult =
    | { c: ClinicRow; status: 'already-clean' }
    | { c: ClinicRow; status: 'no-url' }
    | { c: ClinicRow; status: 'recovered'; found: { extracted: ExtractedAddress; hitPath: string } }
    | { c: ClinicRow; status: 'no-match' }
  const fetchResults: FetchResult[] = []
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (c): Promise<FetchResult> => {
        const cityClean = !!c.city && !/^unknown$/i.test(c.city)
        const regionClean = !!c.region && !/^unknown$/i.test(c.region)
        if (cityClean && regionClean) return { c, status: 'already-clean' }
        // First try: scrape clinic website for AU address pattern.
        if (c.clinic_website_url) {
          const fromWeb = await findAddressForClinic(c.clinic_website_url)
          if (fromWeb) return { c, status: 'recovered', found: fromWeb }
        }
        // Fallback 1: OpenStreetMap Nominatim (free, no key). Catches
        // most healthcare clinics since they're mapped in OSM.
        const fromOsm = await nominatimLookup(c.short_name, c.state ?? undefined)
        if (fromOsm) {
          return { c, status: 'recovered', found: { extracted: fromOsm, hitPath: 'nominatim' } }
        }
        // Fallback 1b: many clinics embed their town in the NAME
        // ("Aspire Physiotherapy Bunbury", "Discover Chiropractic Mackay").
        // Nominatim fails on the full business name but resolves the bare
        // town. Try the trailing 1-2 words as a place query. Free, and
        // regional-biased (regional clinics name themselves after their town).
        const tail = placeTailFromName(c.short_name)
        if (tail) {
          const fromTail = await nominatimLookup(tail, c.state ?? undefined)
          if (fromTail) {
            return { c, status: 'recovered', found: { extracted: fromTail, hitPath: 'name-tail' } }
          }
        }
        // Fallback 2: Google Places (paid, env-gated). Higher accuracy
        // for SPA / sparse-website clinics that OSM doesn't cover.
        const fromGoogle = await googlePlacesLookup(c.short_name, c.state ?? undefined)
        if (fromGoogle) {
          return { c, status: 'recovered', found: { extracted: fromGoogle, hitPath: 'google-places' } }
        }
        return c.clinic_website_url ? { c, status: 'no-match' } : { c, status: 'no-url' }
      }),
    )
    fetchResults.push(...batchResults)
  }

  for (const fr of fetchResults) {
    const c = fr.c
    if (fr.status === 'already-clean') {
      results.push({
        id: c.id, slug: c.slug, shortName: c.short_name,
        websiteUrl: c.clinic_website_url, decision: 'skipped-already-clean',
      })
      continue
    }
    if (fr.status === 'no-url') {
      results.push({
        id: c.id, slug: c.slug, shortName: c.short_name,
        websiteUrl: null, decision: 'fetch-failed',
      })
      continue
    }
    const extracted = fr.status === 'recovered' ? fr.found?.extracted ?? null : null
    const hitPath = fr.status === 'recovered' ? fr.found?.hitPath ?? null : null

    if (!extracted) {
      // Mark as backfill-failed so re-runs skip it
      if (!dryRun) {
        const note = `\n[backfill-failed-location] ${new Date().toISOString()} no AU address pattern found in landing/contact/about pages`
        await sql`
          UPDATE prospect_clinics
          SET notes = COALESCE(notes, '') || ${note}, updated_at = NOW()
          WHERE id = ${c.id}
        `
      }
      results.push({
        id: c.id, slug: c.slug, shortName: c.short_name,
        websiteUrl: c.clinic_website_url, decision: 'no-match',
      })
      continue
    }

    if (!dryRun) {
      const auditNote = `\n[backfill-location] ${new Date().toISOString()} city='${extracted.city}' state=${extracted.state} postcode=${extracted.postcode} region='${extracted.region}' source=${hitPath}`
      await sql`
        UPDATE prospect_clinics
        SET city = ${extracted.city},
            state = ${extracted.state},
            region = ${extracted.region},
            notes = COALESCE(notes, '') || ${auditNote},
            updated_at = NOW()
        WHERE id = ${c.id}
      `
    }

    results.push({
      id: c.id, slug: c.slug, shortName: c.short_name,
      websiteUrl: c.clinic_website_url,
      decision: dryRun ? 'recovered-dryrun' : 'recovered',
      pageHit: hitPath ?? undefined,
      city: extracted.city,
      state: extracted.state,
      region: extracted.region,
      postcode: extracted.postcode,
    })
  }

  return NextResponse.json({
    summary: {
      mode: dryRun ? 'dry-run' : 'applied',
      candidates: candidates.length,
      recovered: results.filter((r) => r.decision === 'recovered' || r.decision === 'recovered-dryrun').length,
      noMatch: results.filter((r) => r.decision === 'no-match').length,
      fetchFailed: results.filter((r) => r.decision === 'fetch-failed').length,
      alreadyClean: results.filter((r) => r.decision === 'skipped-already-clean').length,
    },
    results: results.slice(0, 100),
  })
}
