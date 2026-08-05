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

const CONCURRENCY = 20
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

// Common team-page paths to GUESS directly — many clinic sites have these at
// predictable URLs even when the homepage nav is JS-rendered and unlinkable.
const TEAM_PATHS = ['/our-team', '/team', '/about-us', '/our-staff', '/meet-the-team']

function teamLinks(html, base) {
  const links = new Set()
  const re = /href\s*=\s*["']([^"']+)["']/gi
  let m
  while ((m = re.exec(html)) && links.size < 4) {
    const href = m[1]
    if (/\b(our-?team|meet-?the-?team|about|practitioners?|our-?staff|our-?people|the-?team|clinicians?)\b/i.test(href)) {
      try { links.add(new URL(href, base).toString()) } catch { /* skip */ }
    }
  }
  // Add guessed paths the homepage didn't link.
  for (const p of TEAM_PATHS) { if (links.size >= 4) break; try { links.add(new URL(p, base).toString()) } catch { /* skip */ } }
  return [...links]
}

// Explicit headcount phrases — "team of 12", "over 8 physiotherapists",
// "15 practitioners". Strong, unambiguous size signal.
function explicitHeadcount(text) {
  let max = 0
  const re = /\b(?:team of|over|more than|our|with)\s+(\d{1,3})\s+(?:physio|osteo|chiro|practition|clinician|therapist|exercise physiolog|staff|professional)/gi
  const re2 = /\b(\d{1,3})\+?\s+(?:physiotherapist|osteopath|chiropractor|practitioner|clinician|allied health professional)s\b/gi
  let m
  while ((m = re.exec(text))) max = Math.max(max, parseInt(m[1], 10))
  while ((m = re2.exec(text))) max = Math.max(max, parseInt(m[1], 10))
  return max > 50 ? 0 : max // ignore absurd (page counts, years)
}

function classify(text) {
  const t = text.toLowerCase()
  const inScope = IN_SCOPE.test(t)
  const outScope = OUT_SCOPE.test(t)
  // Competitor-affiliated concussion specialist (Zac 2026-06-18): a clinic
  // already trained through / running a rival concussion platform — Complete
  // Concussion Management / CCMI, HeadCheck, etc. — is a non-fit EVEN WITH a
  // general physio signal, because they're already expert on another product
  // (scott@inbalancephysio replied saying exactly this). Archive unconditionally.
  // Tight: explicit program/affiliation/credential phrases ONLY — never a
  // generic "we treat concussion" service mention.
  const competitorConcussion =
    /\b(complete concussion management|completeconcussions?|\bccmi\b|concussion management clinician|certified concussion (clinician|provider|practitioner)|headcheck health)\b/i.test(t)
  if (competitorConcussion) return { scope: 'out' }
  // Archive only when clearly out-of-scope AND no general allied-health signal.
  if (outScope && !inScope) return { scope: 'out' }
  // HARDENING (2026-08-05, CLAUDE.md demand): NO in-scope signal at all →
  // never promote with an invented team (the June pollution: law firms and
  // wineries entered the queue as "3 physiotherapists"). Held for review.
  if (!inScope) return { scope: 'review' }
  // Practitioner size = max of (title mentions across all pages) and any
  // explicit headcount phrase. Explicit phrases are the most reliable.
  const titleMatches = (text.match(TITLES) || []).length
  const explicit = explicitHeadcount(text)
  const matches = Math.max(titleMatches, explicit)
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
  const home = await fetchText(base, 6000)
  let text = stripTags(home.html)
  let anyOk = home.ok
  // Fetch team/about pages — from homepage links AND guessed paths. Done even
  // when the homepage failed, so a JS-only homepage with a server-rendered
  // /our-team still gets sized. Stop early once we have a strong size signal.
  const links = teamLinks(home.ok ? home.html : '', base)
  for (const link of links) {
    if ((text.match(TITLES) || []).length >= 8) break // already clearly on-site
    const p = await fetchText(link, 4000)
    if (p.ok && p.html.length > 300) { text += ' ' + stripTags(p.html); anyOk = true }
  }

  if (!anyOk || text.length < 200) {
    // Fetch failed / JS-only site — HOLD for manual review instead of
    // fabricating a team (2026-08-05 hardening: the fabricated
    // physiotherapists:3 default was the June pollution vector).
    await sql`UPDATE prospect_clinics SET status='needs-review', updated_at=NOW(),
      notes = COALESCE(notes,'') || ${`\n[categorize] fetch-failed/thin — HELD for manual review ${new Date().toISOString().slice(0, 10)}`}
      WHERE id=${row.id}`
    return 'held'
  }

  const c = classify(text)
  if (c.scope === 'review') {
    await sql`UPDATE prospect_clinics SET status='needs-review', updated_at=NOW(),
      notes = COALESCE(notes,'') || ${`\n[categorize] no clinical signal on site — HELD for manual review ${new Date().toISOString().slice(0, 10)}`}
      WHERE id=${row.id}`
    return 'held'
  }
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
