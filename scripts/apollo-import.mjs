/**
 * Apollo account import (Zac 2026-06-16).
 *
 * Pulls the contacts already sitting in the Apollo account (the ~7,454 from
 * past campaigns) into prospect_clinics so they enter the CEA portal pipeline.
 * Apollo's free plan blocks NET-NEW prospecting search, but /contacts/search
 * (the account's own contacts) is allowed — this is data Zac already paid for.
 *
 * Imports as status='categorizing' (INERT — no cron verifies/promotes/sends it)
 * with a placeholder team. The website categorizer (apollo-categorize.mjs) then
 * fetches each site, confirms discipline + counts practitioners, and transitions
 * the row to 'researching' (in-scope, sized) or 'archived' (out-of-scope).
 *
 * SKIPS: unsubscribed, bounced, replied, no/locked email, non-AU, institutional
 * (NHS/hospital/uni/govt/academy), name-obvious out-of-scope, and dupes.
 *
 * Idempotent: bulkCreateClinics ON CONFLICT(slug) DO NOTHING + domain/email dedup.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import crypto from 'crypto'
const { sql } = await import('@vercel/postgres')

// Inlined bulk insert (repo.ts can't load in a plain script — it imports
// 'server-only'). Mirrors bulkCreateClinics: JSONB array, ON CONFLICT(slug)
// DO NOTHING. travel_surcharge for flight-domestic = 1500.
async function bulkCreateClinics(inputs) {
  if (inputs.length === 0) return 0
  const payload = inputs.map((i) => ({
    slug: i.slug, access_key: i.accessKey, name: i.name, short_name: i.shortName,
    city: i.city, state: i.state, region: i.region,
    contact_first_name: i.contactFirstName, contact_full_name: i.contactFullName,
    contact_email: i.contactEmail, contact_role: i.contactRole ?? null, contact_discipline: i.contactDiscipline,
    clinic_website_url: i.clinicWebsiteUrl, team: i.team, local_targets: i.localTargets ?? [],
    travel_band: i.travelBand, travel_surcharge: 1500, cohort_recommendation: i.cohortRecommendation ?? 'recommended',
    status: i.status ?? 'researching', research_source: i.researchSource ?? 'manual',
    valid_until: i.validUntil.toISOString(), notes: i.notes ?? null,
  }))
  const { rowCount } = await sql`
    INSERT INTO prospect_clinics (
      slug, access_key, name, short_name, city, state, region,
      contact_first_name, contact_full_name, contact_email, contact_role, contact_discipline,
      clinic_website_url, team, local_targets, travel_band, travel_surcharge, cohort_recommendation,
      status, research_source, valid_until, notes
    )
    SELECT (e->>'slug')::text,(e->>'access_key')::text,(e->>'name')::text,(e->>'short_name')::text,
      (e->>'city')::text,(e->>'state')::text,(e->>'region')::text,(e->>'contact_first_name')::text,
      (e->>'contact_full_name')::text,(e->>'contact_email')::text,(e->>'contact_role')::text,(e->>'contact_discipline')::text,
      (e->>'clinic_website_url')::text,(e->'team')::jsonb,(e->'local_targets')::jsonb,(e->>'travel_band')::text,
      (e->>'travel_surcharge')::int,(e->>'cohort_recommendation')::text,(e->>'status')::text,(e->>'research_source')::text,
      (e->>'valid_until')::timestamptz,(e->>'notes')::text
    FROM jsonb_array_elements(${JSON.stringify(payload)}::jsonb) AS e
    ON CONFLICT (slug) DO NOTHING`
  return rowCount ?? 0
}

const KEY = process.env.APOLLO_API_KEY
if (!KEY) { console.error('APOLLO_API_KEY not set'); process.exit(1) }

const STATE_MAP = {
  'new south wales': 'NSW', nsw: 'NSW', victoria: 'VIC', vic: 'VIC',
  queensland: 'QLD', qld: 'QLD', 'south australia': 'SA', sa: 'SA',
  'western australia': 'WA', wa: 'WA', tasmania: 'TAS', tas: 'TAS',
  'northern territory': 'NT', nt: 'NT', 'australian capital territory': 'ACT', act: 'ACT',
}
const AU_STATES = new Set(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'])

// High-precision PUBLIC-SECTOR / institutional terms only — these are never a
// private clinic Zac can sell an on-site workshop to. Deliberately does NOT
// include bare "health service"/"health group" (those catch private allied-
// health groups). The website categorizer is the real scope gate.
const INSTITUTIONAL = /\b(nhs|hospital|universit|\btafe\b|health district|local health district|\bnsw health\b|queensland health|qld health|\bsa health\b|department of|govern|city council|shire council|institute of sport|academy of sport|football club|st john of god|ramsay health|healthscope|primary health network|defence force)\b/i
// Genuinely off-discipline by name — cheap pre-filter to cut website fetches.
// The categorizer re-checks every site, so a miss here is recoverable.
const OUT_OF_SCOPE = /\b(hand therapy|hand (and|&) upper limb|pelvic|women'?s health|men'?s health|continence|incontinence|fertility|lymph(o?edema|atic)|cosmetic|skin (and|&) laser|laser clinic|dermatolog|\bdental\b|orthodont|optical|optometr|audiolog|veterinar|aged care|recruitment|locum agency)\b/i

function abbrevState(s) { return STATE_MAP[(s ?? '').trim().toLowerCase()] ?? (AU_STATES.has((s ?? '').toUpperCase()) ? (s ?? '').toUpperCase() : null) }
function cleanDomain(d) { return (d ?? '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*/, '').replace(/^www\./, '').trim() }
function kebab(s) { return (s ?? '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 42) }
function genAccessKey() { return crypto.randomBytes(5).toString('hex') }
function titleDiscipline(t) {
  const x = (t ?? '').toLowerCase()
  if (/osteo/.test(x)) return 'osteopaths'
  if (/exercise|\bep\b|physiolog/.test(x) && !/physiother/.test(x)) return 'exercisePhys'
  if (/myo/.test(x)) return 'myotherapists'
  if (/sports? (medicine|physician|doctor)/.test(x)) return 'sportsMedicineDoctors'
  if (/\bgp\b|general practi/.test(x)) return 'generalPractitioners'
  if (/manager|owner|director|principal|practice/.test(x)) return 'practiceManager'
  return 'physiotherapists'
}
function emptyTeam() { return { osteopaths: 0, physiotherapists: 0, generalPractitioners: 0, sportsMedicineDoctors: 0, exercisePhys: 0, myotherapists: 0, remedialMassage: 0, practiceManager: 0, admin: 0 } }

async function ap(page) {
  const url = new URL('https://api.apollo.io/api/v1/contacts/search')
  url.searchParams.set('per_page', '100')
  url.searchParams.set('page', String(page))
  const res = await fetch(url, { headers: { accept: 'application/json', 'X-Api-Key': KEY } })
  if (!res.ok) throw new Error(`Apollo ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

function isInactive(c) {
  if (c.email_unsubscribed) return true
  for (const s of (c.contact_campaign_statuses ?? [])) {
    const r = `${s.inactive_reason ?? ''} ${s.status ?? ''}`.toLowerCase()
    if (s.unsubscribed || s.bounced || /unsub|bounce|opted?_?out|do_not|replied/.test(r)) return true
  }
  return false
}

// ── existing dedup sets ──
const ex = await sql`SELECT lower(coalesce(clinic_website_url,'')) u, lower(coalesce(contact_email,'')) e FROM prospect_clinics`
const exDom = new Set(), exEmail = new Set()
for (const r of ex.rows) { const d = cleanDomain(r.u); if (d) exDom.add(d); if (r.e) exEmail.add(r.e) }
console.log(`existing pool: ${exDom.size} domains, ${exEmail.size} emails`)

const stats = { seen: 0, noEmail: 0, inactive: 0, nonAU: 0, instit: 0, outScope: 0, dupe: 0, fresh: 0 }
const seenDom = new Set()
const payloads = []
const DUE = new Date(Date.now() + 90 * 864e5)

for (let page = 1; page <= 80; page++) {
  let j
  try { j = await ap(page) } catch (e) { console.error('page', page, e.message); break }
  const contacts = j.contacts ?? []
  if (contacts.length === 0) break
  for (const c of contacts) {
    stats.seen++
    const org = c.organization ?? {}
    const name = (org.name ?? '').trim()
    const dom = cleanDomain(org.primary_domain || org.website_url)
    const email = (c.email ?? '').toLowerCase().trim()
    if (!name || !dom) { stats.noEmail++; continue }
    if (!email || email.includes('not_unlocked') || email.includes('domain.com') || !email.includes('@')) { stats.noEmail++; continue }
    if (isInactive(c)) { stats.inactive++; continue }
    // AU gate: explicit non-AU country, or no AU state and non-.au domain
    const country = (c.country ?? org.country ?? '').toLowerCase()
    const st = abbrevState(c.state)
    if ((country && !/austral/.test(country)) || (!st && !dom.endsWith('.au'))) { stats.nonAU++; continue }
    if (INSTITUTIONAL.test(name) || dom.endsWith('.gov.au') || dom.endsWith('.edu.au')) { stats.instit++; continue }
    if (OUT_OF_SCOPE.test(name)) { stats.outScope++; continue }
    if (exDom.has(dom) || exEmail.has(email) || seenDom.has(dom)) { stats.dupe++; continue }
    seenDom.add(dom)
    stats.fresh++

    const disc = titleDiscipline(c.title)
    const team = emptyTeam(); team[disc] = 1 // placeholder; categorizer overwrites
    const slug = `${kebab(name) || 'clinic'}-${crypto.randomBytes(2).toString('hex')}`
    payloads.push({
      slug, accessKey: genAccessKey(), name, shortName: name.slice(0, 60),
      city: (c.city ?? '').trim() || 'Unknown', state: st ?? 'NSW', region: 'Unknown',
      contactFirstName: (c.first_name ?? '').trim() || 'there',
      contactFullName: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || name,
      contactEmail: email, contactRole: (c.title ?? '').slice(0, 80) || null, contactDiscipline: disc,
      clinicWebsiteUrl: `https://${dom}`, team, localTargets: [],
      travelBand: 'flight-domestic', cohortRecommendation: 'recommended',
      status: 'categorizing', researchSource: 'apollo-import', validUntil: DUE,
      notes: `[apollo-import ${new Date().toISOString().slice(0, 10)}] uncategorized — pending website review`,
    })
  }
  if (page % 10 === 0) console.log(`  …page ${page} · fresh so far ${stats.fresh}`)
  await new Promise((r) => setTimeout(r, 250))
}

console.log('\n=== FILTER STATS ===', JSON.stringify(stats, null, 1))
console.log(`\ninserting ${payloads.length} net-new as status='categorizing'…`)
let inserted = 0
for (let i = 0; i < payloads.length; i += 200) {
  inserted += await bulkCreateClinics(payloads.slice(i, i + 200))
}
console.log(`✓ inserted ${inserted} new clinics (status=categorizing, source=apollo-import)`)
const tot = await sql`SELECT COUNT(*) c FROM prospect_clinics WHERE status='categorizing'`
console.log(`categorizing queue now: ${tot.rows[0].c}`)
process.exit(0)
