/**
 * Location-verification pass — for SST-pool clinics whose city was a raw import
 * guess (no [backfill-location] scrape note), read the clinic's OWN website and
 * extract a verified address: JSON-LD PostalAddress first (addressLocality /
 * addressRegion / postalCode), then a "Suburb STATE 1234" text fallback. Compare
 * to what's stored and propose a correction ONLY when a real address is found.
 *
 * NEVER guesses. If no verifiable address → verdict UNRESOLVED, left untouched.
 * DRY RUN by default; --apply writes the confirmed corrections.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.POSTGRES_URL)
const APPLY = process.argv.includes('--apply')
const OUT = '/private/tmp/claude-501/-Users-zaclewis/42f68ae9-842f-4e88-aa4f-7daf6dacfa03/scratchpad/sst-location-dryrun.json'

const STATE_NORM = { 'new south wales': 'NSW', victoria: 'VIC', queensland: 'QLD', 'south australia': 'SA', 'western australia': 'WA', tasmania: 'TAS', 'northern territory': 'NT', 'australian capital territory': 'ACT' }
const normState = (s) => {
  if (!s) return null
  const t = String(s).trim()
  if (/^(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)$/i.test(t)) return t.toUpperCase()
  return STATE_NORM[t.toLowerCase()] || null
}
// AU postcode → state (for cross-checking / deriving state from a postcode).
const pcState = (pc) => {
  const n = Number(pc); if (!n) return null
  if (n >= 2600 && n <= 2618) return 'ACT'; if (n >= 2900 && n <= 2920) return 'ACT'
  if ((n >= 2000 && n <= 2599) || (n >= 2619 && n <= 2899) || (n >= 2921 && n <= 2999)) return 'NSW'
  if (n >= 3000 && n <= 3999) return 'VIC'
  if (n >= 4000 && n <= 4999) return 'QLD'
  if (n >= 5000 && n <= 5799) return 'SA'
  if (n >= 6000 && n <= 6797) return 'WA'
  if (n >= 7000 && n <= 7799) return 'TAS'
  if (n >= 800 && n <= 899) return 'NT'
  return null
}

async function getText(url, ms = 8000) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), ms)
  try { const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; CEA-LocVerify/1.0)' } }); clearTimeout(t); return r.ok ? await r.text() : '' }
  catch { clearTimeout(t); return '' }
}

// Pull the first plausible PostalAddress out of JSON-LD blocks.
function fromJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
  const walk = (o, out) => {
    if (!o || typeof o !== 'object') return
    if (Array.isArray(o)) return o.forEach((x) => walk(x, out))
    const a = o.address && typeof o.address === 'object' ? o.address : (o['@type'] === 'PostalAddress' ? o : null)
    if (a && (a.addressLocality || a.postalCode || a.addressRegion)) {
      out.push({ locality: a.addressLocality || null, region: normState(a.addressRegion), postcode: (String(a.postalCode || '').match(/\d{4}/) || [null])[0] })
    }
    for (const k of Object.keys(o)) walk(o[k], out)
  }
  const out = []
  for (const b of blocks) { try { walk(JSON.parse(b[1].trim()), out) } catch { /* skip bad json */ } }
  return out.find((x) => x.locality || x.postcode) || null
}

// Text fallback: "Suburb NSW 2000" style.
function fromText(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ')
  const m = text.match(/([A-Z][A-Za-z'.\- ]{2,28}?)\s+(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)[, ]+(\d{4})/)
  if (m) return { locality: m[1].trim(), region: m[2].toUpperCase(), postcode: m[3] }
  return null
}

async function verify(row) {
  let raw = String(row.clinic_website_url || '').trim()
  const base = { id: row.id, name: row.name, storedCity: row.city, storedState: row.state, url: raw }
  if (!raw) return { ...base, verdict: 'UNRESOLVED', reason: 'no website' }
  if (!/^https?:/i.test(raw)) raw = 'https://' + raw.replace(/^\/+/, '')

  let found = null
  for (const u of [raw, raw.replace(/\/+$/, '') + '/contact', raw.replace(/\/+$/, '') + '/contact-us']) {
    const html = await getText(u); if (!html) continue
    found = fromJsonLd(html) || fromText(html)
    if (found && (found.region || found.postcode)) break
  }
  if (!found) return { ...base, verdict: 'UNRESOLVED', reason: 'no address on site' }

  const vState = found.region || pcState(found.postcode)
  const vCity = found.locality || null
  if (!vState) return { ...base, verdict: 'UNRESOLVED', reason: 'no state/postcode', found }

  const stateWrong = normState(row.state) && vState !== normState(row.state)
  const cityWrong = vCity && row.city && vCity.toLowerCase() !== String(row.city).toLowerCase()
  let verdict = 'OK'
  if (stateWrong) verdict = 'FIX-STATE'
  else if (cityWrong) verdict = 'FIX-CITY'
  return { ...base, verdict, vCity, vState, vPostcode: found.postcode || null }
}

// ── Run ──────────────────────────────────────────────────────────────────────
const rows = await sql`
  SELECT id, name, city, state, region, clinic_website_url
  FROM prospect_clinics
  WHERE sst_target = true
    AND city IS NOT NULL AND city <> '' AND city NOT ILIKE '%unknown%'
    AND notes NOT ILIKE '%[backfill-location]%'`
console.log(`Verifying location for ${rows.length} guessed-city SST clinics…`)

const results = []; const CONC = 12; let idx = 0
async function worker() { while (idx < rows.length) { const i = idx++; results[i] = await verify(rows[i]); if (i % 20 === 0) console.log(`  …${i}/${rows.length}`) } }
await Promise.all(Array.from({ length: CONC }, worker))

const by = (v) => results.filter((r) => r.verdict === v)
const summary = { total: rows.length, 'FIX-STATE': by('FIX-STATE').length, 'FIX-CITY': by('FIX-CITY').length, OK: by('OK').length, UNRESOLVED: by('UNRESOLVED').length }
writeFileSync(OUT, JSON.stringify({ summary, results }, null, 2))

console.log('\n=== LOCATION VERIFY DRY RUN ===')
console.log(summary)
console.log('\nFIX-STATE (stored state is WRONG per the clinic site):')
by('FIX-STATE').forEach((r) => console.log(`  ⚑ ${r.name}: stored ${r.storedCity}/${r.storedState}  →  verified ${r.vCity || '?'}/${r.vState} (${r.vPostcode || ''})`))
console.log('\nSample FIX-CITY (right state, wrong city):')
by('FIX-CITY').slice(0, 12).forEach((r) => console.log(`  · ${r.name}: ${r.storedCity} → ${r.vCity} ${r.vState}`))
console.log('\nUNRESOLVED (no verifiable address — LEFT UNTOUCHED, manual):', by('UNRESOLVED').length)
console.log(`\nFull report → ${OUT}`)

if (!APPLY) { console.log('\nDRY RUN — nothing changed. Re-run with --apply to write FIX-STATE + FIX-CITY (UNRESOLVED left as-is).'); process.exit(0) }

let n = 0
for (const r of [...by('FIX-STATE'), ...by('FIX-CITY')]) {
  const note = `\n[location-verified ${new Date().toISOString().slice(0, 10)}] ${r.storedCity}/${r.storedState} → ${r.vCity || r.storedCity}/${r.vState} from ${r.url}`
  await sql`UPDATE prospect_clinics
    SET city = ${r.vCity || r.storedCity}, state = ${r.vState}, region = ${r.vCity || r.storedCity},
        notes = COALESCE(notes,'') || ${note}, updated_at = now()
    WHERE id = ${r.id}`
  n++
}
console.log(`\nAPPLIED — corrected ${n} records. UNRESOLVED (${by('UNRESOLVED').length}) left untouched.`)
process.exit(0)
