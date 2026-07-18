/**
 * Narrow the `sst_target` set to the SHARP SST ICP before any SST outreach.
 *
 * WHY: `sst-prospecting.mjs` tagged sst_target broadly by loose signal-match, so
 * it swept in ~600 GENERIC physiotherapy clinics. Those are fine CCM-course
 * prospects (which is what they got) but WEAK SST-tool prospects — the SST wedge
 * (measured HRt + between-visit monitoring) only pays for clinics with real
 * concussion throughput. This UNTAGS the generic ones so the SST pipeline (and,
 * later, the SST send audience) reflects the real target.
 *
 * KEEPS sst_target=true when the clinic is genuinely concussion-active:
 *   - name signals concussion / vestibular / neuro / balance / headache / dizziness /
 *     sports-medicine / sports-concussion, OR
 *   - discipline is exercisePhys or sportsMedicineDoctors, OR
 *   - it matches a hand-vetted seed row (sst_targets), and is NOT CCMI-disqualified.
 * DROPS (sets sst_target=false) the rest. Never deletes a clinic; only untags.
 *
 * SAFE BY DEFAULT: dry-run — prints keep/drop counts + samples, changes nothing.
 * Run for real with:  node scripts/sst-clean-target.mjs --apply
 *
 * Requires POSTGRES_URL in .env.local (same as the other prospect scripts).
 */
import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.POSTGRES_URL)
const APPLY = process.argv.includes('--apply')

// Concussion-active name signal (case-insensitive). Broad enough to keep real
// concussion/vestibular/neuro brands, tight enough to drop generic physios.
const KEEP_NAME = /(concuss|vestibul|neuro|balance|dizz|headache|brain injur|sports\s*med|sportsmed|head\s*clinic|equilibrium)/i
const KEEP_DISCIPLINE = new Set(['exercisePhys', 'sportsMedicineDoctors'])

const rows = await sql`
  SELECT id, name, city, state, discipline, status, contact_email
  FROM prospect_clinics
  WHERE sst_target = true
`

// Hand-vetted seed names (kept regardless), minus CCMI-disqualified.
const seed = await sql`SELECT name FROM sst_targets WHERE status <> 'disqualified'`
const seedNames = new Set(seed.map((s) => String(s.name || '').trim().toLowerCase()))

const keep = []
const drop = []
for (const r of rows) {
  const name = String(r.name || '')
  const isConcussionActive =
    KEEP_NAME.test(name) ||
    KEEP_DISCIPLINE.has(r.discipline) ||
    seedNames.has(name.trim().toLowerCase())
  ;(isConcussionActive ? keep : drop).push(r)
}

console.log(`sst_target currently: ${rows.length}`)
console.log(`  KEEP (concussion-active): ${keep.length}`)
console.log(`  DROP (generic → untag):   ${drop.length}`)
console.log('\nSample KEEP:')
keep.slice(0, 12).forEach((r) => console.log(`  ✓ ${r.name} [${r.discipline}] ${r.city || ''} ${r.state || ''}`))
console.log('\nSample DROP:')
drop.slice(0, 12).forEach((r) => console.log(`  ✗ ${r.name} [${r.discipline}] ${r.city || ''} ${r.state || ''}`))

if (!APPLY) {
  console.log('\nDRY RUN — nothing changed. Re-run with --apply to untag the DROP set.')
  process.exit(0)
}

const dropIds = drop.map((r) => r.id)
if (dropIds.length) {
  await sql`UPDATE prospect_clinics SET sst_target = false WHERE id = ANY(${dropIds})`
}
console.log(`\nAPPLIED — untagged ${dropIds.length} generic clinics. sst_target now reflects the sharp concussion-active ICP.`)
process.exit(0)
