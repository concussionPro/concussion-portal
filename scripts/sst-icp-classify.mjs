/**
 * SST ICP pass — classify the sst_target pool by what each clinic's WEBSITE
 * actually says it treats, not just its name. Reads the homepage + one likely
 * services/conditions subpage and scans the real page text for concussion /
 * vestibular / neuro / sports-rehab evidence, combined with team composition
 * and a hard exclude-list for out-of-scope categories (hand therapy, pelvic,
 * podiatry, dental, etc.).
 *
 * DRY RUN by default: writes a full report to scratchpad JSON + prints a
 * summary. Changes NOTHING in the DB. Apply the untag with --apply.
 *
 * Verdicts:
 *   KEEP-site   website content shows concussion/neuro/vestibular/sports rehab
 *   KEEP-team   sports-medicine doctor or exercise physiologist on the team
 *   DROP-generic  reachable site, no concussion evidence — generic physio/osteo
 *   DROP-oos      out-of-scope category by name (hand/pelvic/podiatry/…)
 *   UNREACHABLE   site failed to load and no name/team signal — manual review
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.POSTGRES_URL)
const APPLY = process.argv.includes('--apply')
const OUT = '/private/tmp/claude-501/-Users-zaclewis/42f68ae9-842f-4e88-aa4f-7daf6dacfa03/scratchpad/sst-icp-dryrun.json'

// ── Signals ────────────────────────────────────────────────────────────────
// Real concussion/neuro-rehab evidence in page CONTENT (the trustworthy signal).
const CONTENT_POS = /concuss|post[-\s]?concuss|vestibul|\bvoms\b|\bbppv\b|sub[-\s]?symptom|buffalo\s*(test|protocol|treadmill|bike)|return[-\s]to[-\s](play|sport)|\bm?tbi\b|traumatic brain|brain injur|balance\s*(disorder|retrain|rehab|clinic)|\bvertigo\b|neuro(logical)?\s*(rehab|physio|physiotherapy)/i
// Name signals — weaker than content but decisive when a site won't load.
const NAME_POS = /concuss|vestibul|neuro|\bbalance\b|dizz|headache|migraine|brain\s*injur|sports?\s*med|sportsmed|equilibrium|head\s*clinic|performance/i
// Out-of-scope clinic categories — hard drop unless positive evidence overrides.
const NAME_OOS = /\bhand\b|hand\s*(therapy|clinic)|pelvic|women'?s?\s*health|men'?s?\s*health|continence|podiatr|\bfoot\b|dental|dentist|orthodont|lymph|scoliosis|dietit|nutrition\b|psycholog|speech\s*path|optomet|audiolog|veterinar|skin|dermat|cosmetic|fertility|\bIVF\b/i

const teamSig = (t) => {
  const team = t || {}
  return (Number(team.sportsMedicineDoctors) || 0) > 0 || (Number(team.exercisePhys) || 0) > 0
}

const stripHtml = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')

async function getText(url, ms = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; CEA-ICP/1.0)' } })
    clearTimeout(t)
    if (!res.ok) return { ok: false, status: res.status, html: '' }
    const html = await res.text()
    return { ok: true, status: res.status, html }
  } catch (e) {
    clearTimeout(t)
    return { ok: false, status: 0, html: '', err: e.message }
  }
}

// From homepage HTML, find one internal link most likely to list conditions.
function servicesLink(baseUrl, html) {
  const links = [...html.matchAll(/href\s*=\s*["']([^"']+)["'][^>]*>([^<]{0,60})/gi)]
  const want = /(concuss|vestibul|neuro|service|condition|what[-\s]?we|treat|sports|physiotherapy|rehab)/i
  for (const [, href, text] of links) {
    if (want.test(href) || want.test(text)) {
      try { return new URL(href, baseUrl).href } catch { /* skip */ }
    }
  }
  return null
}

async function classify(row) {
  const name = String(row.name || '')
  const base = { id: row.id, name, city: row.city, state: row.state, url: row.clinic_website_url || '' }
  // Positive name/team evidence is decisive and cheap.
  const namePos = NAME_POS.test(name)
  const team = teamSig(row.team)
  const oos = NAME_OOS.test(name)

  // Fetch site content (homepage + one services page) for the real signal.
  let siteHit = null
  let reachable = false
  let raw = String(row.clinic_website_url || '').trim()
  if (raw) {
    if (!/^https?:/i.test(raw)) raw = 'https://' + raw.replace(/^\/+/, '')
    const home = await getText(raw)
    if (home.ok) {
      reachable = true
      const homeText = stripHtml(home.html)
      let m = homeText.match(CONTENT_POS)
      if (!m) {
        const sub = servicesLink(raw, home.html)
        if (sub && sub !== raw) {
          const sp = await getText(sub)
          if (sp.ok) m = stripHtml(sp.html).match(CONTENT_POS)
        }
      }
      if (m) siteHit = m[0]
    }
  }

  let verdict
  if (siteHit) verdict = 'KEEP-site'
  else if (oos && !namePos && !team) verdict = 'DROP-oos'
  else if (team) verdict = 'KEEP-team'
  else if (namePos) verdict = reachable ? 'DROP-generic' : 'KEEP-name' // name says neuro but site shows nothing → generic; if unreachable, trust the name
  else if (reachable) verdict = 'DROP-generic'
  else verdict = 'UNREACHABLE'

  return { ...base, verdict, evidence: siteHit || (team ? 'team:sportsMed/EP' : namePos ? 'name-signal' : ''), reachable }
}

// ── Run ──────────────────────────────────────────────────────────────────────
const rows = await sql`
  SELECT id, name, city, state, contact_discipline, team, clinic_website_url, status
  FROM prospect_clinics WHERE sst_target = true`
console.log(`Classifying ${rows.length} sst_target clinics by website content…`)

const results = []
const CONC = 16
let idx = 0
async function worker() {
  while (idx < rows.length) {
    const i = idx++
    results[i] = await classify(rows[i])
    if (i % 100 === 0) console.log(`  …${i}/${rows.length}`)
  }
}
await Promise.all(Array.from({ length: CONC }, worker))

const by = (v) => results.filter((r) => r.verdict === v)
const keep = results.filter((r) => r.verdict.startsWith('KEEP'))
const drop = results.filter((r) => r.verdict.startsWith('DROP'))
const unreach = by('UNREACHABLE')

const summary = {
  total: rows.length,
  keep: keep.length,
  drop: drop.length,
  unreachable: unreach.length,
  breakdown: {
    'KEEP-site': by('KEEP-site').length,
    'KEEP-team': by('KEEP-team').length,
    'KEEP-name': by('KEEP-name').length,
    'DROP-generic': by('DROP-generic').length,
    'DROP-oos': by('DROP-oos').length,
    UNREACHABLE: unreach.length,
  },
}
writeFileSync(OUT, JSON.stringify({ summary, results }, null, 2))

console.log('\n=== SST ICP DRY RUN ===')
console.log(summary.breakdown)
console.log(`\nKEEP ${keep.length} · DROP ${drop.length} · UNREACHABLE ${unreach.length}`)
console.log('\nSample KEEP-site (real website evidence):')
by('KEEP-site').slice(0, 12).forEach((r) => console.log(`  ✓ ${r.name} — "${r.evidence}"`))
console.log('\nSample DROP-oos (out-of-scope category):')
by('DROP-oos').slice(0, 10).forEach((r) => console.log(`  ✗ ${r.name}`))
console.log('\nSample DROP-generic (site loads, no concussion evidence):')
by('DROP-generic').slice(0, 10).forEach((r) => console.log(`  ✗ ${r.name} ${r.url}`))
console.log(`\nFull report → ${OUT}`)

if (!APPLY) {
  console.log('\nDRY RUN — nothing changed. Re-run with --apply to untag the DROP set (KEEP the KEEP + UNREACHABLE for manual).')
  process.exit(0)
}

// APPLY: untag only the confident DROPs (generic + out-of-scope). Leave
// UNREACHABLE tagged for manual review — never untag on a failed fetch.
const dropIds = drop.map((r) => r.id)
if (dropIds.length) {
  await sql`UPDATE prospect_clinics SET sst_target = false, updated_at = now() WHERE id = ANY(${dropIds})`
}
console.log(`\nAPPLIED — untagged ${dropIds.length} clinics from sst_target. KEEP ${keep.length} + UNREACHABLE ${unreach.length} retained.`)
process.exit(0)
