/**
 * Build the locked-email recovery queue (Zac 2026-06-16).
 *
 * The Apollo import skipped ~608 contacts whose email Apollo wouldn't reveal
 * (locked / not-unlocked) but which DO have an org domain. This re-pulls those,
 * dedups to unique in-scope AU clinic domains we don't already have, and parks
 * them in apollo_recover_queue for the prod Hunter route to find emails for.
 *
 * Runs LOCALLY (Apollo key is local). Idempotent: re-runnable.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
const { sql } = await import('@vercel/postgres')
const KEY = process.env.APOLLO_API_KEY
if (!KEY) { console.error('APOLLO_API_KEY not set'); process.exit(1) }

const STATE_MAP = { 'new south wales': 'NSW', nsw: 'NSW', victoria: 'VIC', vic: 'VIC', queensland: 'QLD', qld: 'QLD', 'south australia': 'SA', sa: 'SA', 'western australia': 'WA', wa: 'WA', tasmania: 'TAS', tas: 'TAS', 'northern territory': 'NT', nt: 'NT', 'australian capital territory': 'ACT', act: 'ACT' }
const AU = new Set(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'])
const INSTITUTIONAL = /\b(nhs|hospital|universit|\btafe\b|health district|local health district|\bnsw health\b|queensland health|qld health|\bsa health\b|department of|govern|city council|shire council|institute of sport|academy of sport|football club|st john of god|ramsay health|healthscope|primary health network|defence force)\b/i
const OUT_OF_SCOPE = /\b(hand therapy|hand (and|&) upper limb|pelvic|women'?s health|men'?s health|continence|incontinence|fertility|lymph(o?edema|atic)|cosmetic|skin (and|&) laser|laser clinic|dermatolog|\bdental\b|orthodont|optical|optometr|audiolog|veterinar|aged care|recruitment|locum agency)\b/i
const abbr = (s) => STATE_MAP[(s ?? '').trim().toLowerCase()] ?? (AU.has((s ?? '').toUpperCase()) ? (s ?? '').toUpperCase() : null)
const dom = (d) => (d ?? '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*/, '').replace(/^www\./, '').trim()

async function ap(page) {
  const url = new URL('https://api.apollo.io/api/v1/contacts/search')
  url.searchParams.set('per_page', '100'); url.searchParams.set('page', String(page))
  const r = await fetch(url, { headers: { accept: 'application/json', 'X-Api-Key': KEY } })
  if (!r.ok) throw new Error(`Apollo ${r.status}`)
  return r.json()
}

await sql`CREATE TABLE IF NOT EXISTS apollo_recover_queue (
  domain TEXT PRIMARY KEY, org_name TEXT, city TEXT, state TEXT,
  status TEXT DEFAULT 'pending', recovered_email TEXT, attempted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW())`

// existing domains: pool + already-queued
const ex = await sql`SELECT lower(coalesce(clinic_website_url,'')) u FROM prospect_clinics`
const exDom = new Set(); for (const r of ex.rows) { const d = dom(r.u); if (d) exDom.add(d) }
const qd = await sql`SELECT domain FROM apollo_recover_queue`
const queued = new Set(qd.rows.map((r) => r.domain))

const stats = { seen: 0, locked: 0, added: 0 }
const seen = new Set()
const rows = []
for (let p = 1; p <= 80; p++) {
  let j; try { j = await ap(p) } catch (e) { console.error('page', p, e.message); break }
  const cs = j.contacts ?? []
  if (cs.length === 0) break
  for (const c of cs) {
    stats.seen++
    const email = (c.email ?? '').toLowerCase()
    const locked = !email || email.includes('not_unlocked') || email.includes('domain.com') || !email.includes('@')
    if (!locked) continue
    stats.locked++
    const org = c.organization ?? {}
    const name = (org.name ?? '').trim()
    const d = dom(org.primary_domain || org.website_url)
    if (!name || !d) continue
    const country = (c.country ?? '').toLowerCase()
    const st = abbr(c.state)
    if ((country && !/austral/.test(country)) || (!st && !d.endsWith('.au'))) continue
    if (INSTITUTIONAL.test(name) || d.endsWith('.gov.au') || d.endsWith('.edu.au')) continue
    if (OUT_OF_SCOPE.test(name)) continue
    if (exDom.has(d) || queued.has(d) || seen.has(d)) continue
    seen.add(d)
    rows.push({ domain: d, org_name: name.slice(0, 120), city: (c.city ?? '').trim() || 'Unknown', state: st ?? 'NSW' })
  }
  await new Promise((r) => setTimeout(r, 200))
}

for (let i = 0; i < rows.length; i += 200) {
  const chunk = rows.slice(i, i + 200)
  const { rowCount } = await sql`
    INSERT INTO apollo_recover_queue (domain, org_name, city, state)
    SELECT (e->>'domain'), (e->>'org_name'), (e->>'city'), (e->>'state')
    FROM jsonb_array_elements(${JSON.stringify(chunk)}::jsonb) e
    ON CONFLICT (domain) DO NOTHING`
  stats.added += rowCount ?? 0
}
console.log('locked-email contacts seen:', stats.locked, '· unique new domains queued:', stats.added)
const tot = await sql`SELECT COUNT(*) c FROM apollo_recover_queue WHERE status='pending'`
console.log('recover queue pending:', tot.rows[0].c)
process.exit(0)
