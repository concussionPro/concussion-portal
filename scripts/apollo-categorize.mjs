/**
 * Website categorizer for apollo-import clinics (Zac 2026-06-16).
 *
 * Apollo gives no size/discipline, so the ONLY way to categorize is the clinic
 * website (Zac: "look at the clinic websites and decide which outreach they
 * get"). For each status='categorizing' row this:
 *   1. Fetches the homepage + team/about pages.
 *   2. Confirms it's an in-scope allied-health clinic (physio/osteo/chiro/
 *      sports/rehab). Genuine out-of-scope (dental/pelvic-only/vet/podiatry-
 *      only with no general signal) → status='archived'.
 *   3. Counts practitioners → tier. Per Zac, DEFAULT to hub (multi-practitioner)
 *      unless clearly solo (individual) or clearly large ≥6 (on-site / travel
 *      target — the top of the revenue hierarchy). Writes the team JSON so
 *      conversion-score tiers it correctly.
 *   4. Transitions in-scope rows to 'researching' (next_template_slug='initial')
 *      so the existing Hunter-verify → auto-promote → send engine takes over.
 *
 * Resumable + idempotent: re-run until the categorizing queue is empty. Fetch
 * failures default to hub-tier 'researching' (these are real clinics from Zac's
 * own campaigns — don't lose the lead; downstream Hunter + preflight still gate).
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
const { sql } = await import('@vercel/postgres')

const CONCURRENCY = 10
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'

const IN_SCOPE = /\b(physiotherap|physio\b|osteopath|chiropract|sports? (injur|medicin|physio|therap)|exercise physiolog|myotherap|rehabilitation|musculoskeletal|sports? rehab|movement|allied health)\b/i
const OUT_SCOPE = /\b(dental|orthodont|dentist|veterinar|optometr|audiolog|cosmetic (clinic|surgery)|skin clinic|laser clinic|hand therapy only|aged care facility|nursing home|day spa|beauty (salon|clinic))\b/i
const TITLES = /\b(physiotherapist|physio|osteopath|chiropractor|myotherapist|exercise physiologist|sports? (physician|doctor)|podiatrist|remedial massage therapist|massage therapist|accredited exercise)\b/gi

function emptyTeam() { return { osteopaths: 0, physiotherapists: 0, generalPractitioners: 0, sportsMedicineDoctors: 0, exercisePhys: 0, myotherapists: 0, remedialMassage: 0, practiceManager: 0, admin: 0 } }
function stripTags(html) { return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ') }

async function fetchText(url, ms = 8000) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(ms) })
    if (!res.ok) return { html: '', ok: false }
    return { html: (await res.text()).slice(0, 400_000), ok: true }
  } catch { return { html: '', ok: false } }
}

function teamLinks(html, base) {
  const links = new Set()
  const re = /href\s*=\s*["']([^"']+)["']/gi
  let m
  while ((m = re.exec(html)) && links.size < 3) {
    const href = m[1]
    if (/\b(our-?team|meet-?the-?team|about|practitioners?|our-?staff|our-?people|the-?team|clinicians?)\b/i.test(href)) {
      try { links.add(new URL(href, base).toString()) } catch { /* skip */ }
    }
  }
  return [...links]
}

function classify(text) {
  const t = text.toLowerCase()
  const inScope = IN_SCOPE.test(t)
  const outScope = OUT_SCOPE.test(t)
  // Archive only when clearly out-of-scope AND no general allied-health signal.
  if (outScope && !inScope) return { scope: 'out' }
  // Practitioner count: distinct title mentions on the combined team/about text.
  const matches = (text.match(TITLES) || []).length
  // Solo signals.
  const solo = /\b(sole (practitioner|trader)|solo practi|owner[\- ]operat|one[\- ]on[\- ]one private|just me\b|i am a (physio|osteo|chiro))\b/i.test(t)
  // Tier from the (noisy) title count. Per Zac, the DEFAULT is hub — "almost
  // all clinics are multi-practitioner". A low match count usually means the
  // team list is on a JS-rendered page we can't read, NOT that it's a solo —
  // so a low count must NOT mean individual. Individual requires a POSITIVE
  // solo signal. On-site (travel target) needs a strong ≥8 title mentions.
  let tier, count
  if (matches >= 8) { tier = 'on-site'; count = 6 }      // genuinely large → travel/on-site
  else if (solo) { tier = 'individual'; count = 1 }      // explicit solo signal only
  else { tier = 'hub'; count = 3 }                        // default multi-practitioner
  // Primary discipline.
  let disc = 'physiotherapists'
  if (/osteopath/.test(t) && !/physiotherap/.test(t)) disc = 'osteopaths'
  else if (/chiropract/.test(t) && !/physiotherap/.test(t)) disc = 'physiotherapists' // no chiro field; bucket under physio
  else if (/exercise physiolog/.test(t) && !/physiotherap/.test(t)) disc = 'exercisePhys'
  return { scope: 'in', tier, count, disc }
}

async function categorizeOne(row) {
  const base = row.clinic_website_url
  const home = await fetchText(base)
  let text = stripTags(home.html)
  if (home.ok) {
    for (const link of teamLinks(home.html, base)) {
      const p = await fetchText(link, 6000)
      if (p.ok) text += ' ' + stripTags(p.html)
    }
  }

  if (!home.ok || text.length < 200) {
    // Fetch failed / JS-only site — default to hub-tier in-scope (real clinic
    // from Zac's campaign; don't lose it). Hunter + preflight still gate later.
    const team = emptyTeam(); team.physiotherapists = 3
    await promote(row.id, team, 'hub', `fetch-failed/thin — defaulted hub`)
    return 'defaulted'
  }

  const c = classify(text)
  if (c.scope === 'out') {
    await sql`UPDATE prospect_clinics SET status='archived', updated_at=NOW(),
      notes = COALESCE(notes,'') || ${`\n[categorize] OUT-OF-SCOPE by website — archived ${new Date().toISOString().slice(0, 10)}`}
      WHERE id=${row.id}`
    return 'archived'
  }
  const team = emptyTeam(); team[c.disc] = c.count
  await promote(row.id, team, c.tier, `${c.tier} · ${c.count} practitioners detected · ${c.disc}`)
  return c.tier
}

async function promote(id, team, tier, note) {
  await sql`UPDATE prospect_clinics
    SET status='researching', next_template_slug='initial', team=${JSON.stringify(team)}::jsonb,
        updated_at=NOW(),
        notes = COALESCE(notes,'') || ${`\n[categorize] ${note} — ready for verify ${new Date().toISOString().slice(0, 10)}`}
    WHERE id=${id}`
}

// ── main loop ──
const counts = { 'on-site': 0, hub: 0, individual: 0, archived: 0, defaulted: 0, errors: 0 }
let processed = 0
for (let iter = 0; iter < 300; iter++) {
  const { rows } = await sql`SELECT id, clinic_website_url FROM prospect_clinics
    WHERE status='categorizing' AND research_source='apollo-import' ORDER BY id LIMIT ${CONCURRENCY}`
  if (rows.length === 0) break
  const results = await Promise.allSettled(rows.map(categorizeOne))
  for (const r of results) {
    if (r.status === 'fulfilled') counts[r.value] = (counts[r.value] ?? 0) + 1
    else counts.errors++
  }
  processed += rows.length
  if (processed % 100 < CONCURRENCY) console.log(`  …${processed} processed · on-site ${counts['on-site']} hub ${counts.hub} indiv ${counts.individual} archived ${counts.archived} defaulted ${counts.defaulted}`)
}
console.log('\n=== CATEGORIZE COMPLETE ===', JSON.stringify(counts, null, 1))
const remain = await sql`SELECT COUNT(*) c FROM prospect_clinics WHERE status='categorizing'`
console.log('categorizing remaining:', remain.rows[0].c)
process.exit(0)
