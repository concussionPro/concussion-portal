/**
 * SST prospecting loader (2026-07-06):
 * 1. Tags existing engine prospects that fit the SST ICP (concussion /
 *    vestibular / neuro / balance / headache / sports-physio signals).
 * 2. Loads the researched AU/NZ seed list into sst_targets — a pre-
 *    enrichment holding pen (no verified emails yet → NOT in the send
 *    queue; Hunter enrichment graduates them into prospect_clinics).
 * Run: node --env-file=.env.local scripts/sst-prospecting.mjs
 */
import { sql } from '@vercel/postgres'

const SEED = [
  // AU — CCMI-affiliated + concussion-branded (docs/sst-target-universe-au-nz.md)
  ['Sydney Concussion Centre', 'Sydney', 'AU', 'ccmi', 'CCMI-accredited, concussion-only brand, 3 sites'],
  ['Sports Lab', 'Sydney', 'AU', 'ccmi', 'CCMI, multidisciplinary sports rehab, 2 sites'],
  ['CP Physio', 'Sydney', 'AU', 'ccmi', 'CCMI-certified, neuro-focused physio'],
  ['HH Physio & Sports Rehab', 'Sydney', 'AU', 'ccmi', 'CCMI-certified concussion program'],
  ['Dynamic Physiotherapy Five Dock', 'Sydney', 'AU', 'ccmi', 'CCMI Sydney list'],
  ['St George SportsMed', 'Sydney', 'AU', 'ccmi', 'CCMI, sports-med multidisciplinary'],
  ['Physio Inq Sutherland', 'Sydney', 'AU', 'independent', 'Concussion baseline service; franchise network upside'],
  ['Advance Rehab Centre', 'Sydney', 'AU', 'vestibular', 'Private neuro + vestibular specialty (Artarmon)'],
  ['SportsCare Canberra', 'Canberra', 'AU', 'independent', 'Dedicated concussion clinic, 2 sites'],
  ['Melbourne Physiotherapy Concussion Clinic', 'Melbourne', 'AU', 'independent', 'Concussion-only brand, ImPACT-accredited, PhD-led'],
  ['Melbourne Sports Concussion Clinic', 'Melbourne', 'AU', 'independent', 'Multidisciplinary sports concussion'],
  ['Concussion Central', 'Melbourne', 'AU', 'ccmi', 'CCMI-listed, concussion-dedicated, 3 sites'],
  ['Premier Sports & Spinal Medicine', 'Melbourne', 'AU', 'ccmi', 'CCMI, 3 sites'],
  ['Sports & Spinal Group Hampton', 'Melbourne', 'AU', 'ccmi', 'CCMI'],
  ['The Sports Injury Clinic', 'Frankston', 'AU', 'ccmi', 'CCMI, large sports-med clinic'],
  ['Geelong Neuro Centre', 'Geelong', 'AU', 'ccmi', 'CCMI + neuro rehab specialty'],
  ['Barwon Sports Physiotherapy', 'Geelong', 'AU', 'ccmi', 'CCMI'],
  ['Pivot Sports Performance', 'Melbourne', 'AU', 'ccmi', 'CCMI'],
  ['SportsMed Biologic', 'Melbourne', 'AU', 'independent', 'Concussion specialists, ex-AFL consultant led'],
  ['Melbourne Headache + Concussion Group', 'Melbourne', 'AU', 'headache', 'Concussion + headache brand, RTS focus'],
  ['Melbourne Headache Neck & Jaw Clinic', 'Mordialloc', 'AU', 'headache', 'Runs Melbourne Concussion Clinic service, 2 sites'],
  ['Peak Sports Physiotherapy', 'Wangaratta', 'AU', 'ccmi', 'CCMI regional — underserved, high receptivity'],
  ['Lifecare', 'National', 'AU', 'chain', 'National chain w/ CCMI service line — one deal, many sites'],
  ['Pivotal Motion Physiotherapy', 'Brisbane', 'AU', 'independent', 'Dedicated concussion service; CCMI has no QLD footprint'],
  ['Sports & Exercise Physio Clinic', 'Brisbane', 'AU', 'independent', 'Weekly dedicated concussion screening clinic'],
  ['Advanced Vestibular Clinics', 'Gold Coast', 'AU', 'vestibular', '5 sites + telehealth; Advanced Concussion Clinics'],
  ["Meg's Equilibrium Rehab", 'Brisbane', 'AU', 'vestibular', 'Longest-established vestibular practice QLD, 4 sites'],
  ['Advanced Neuro Rehab', 'Adelaide', 'AU', 'vestibular', '14 vestibular-trained physios + concussion protocol'],
  ['Unley Concussion Clinic', 'Adelaide', 'AU', 'independent', 'Baseline-testing venture; no CCMI in SA'],
  ['Heads Up Concussion Care', 'Perth', 'AU', 'ccmi', 'CCMI Subiaco'],
  ['TMJ & Headache Clinic West Perth', 'Perth', 'AU', 'ccmi', 'CCMI'],
  ['Online Concussion Clinic', 'Perth', 'AU', 'ccmi', 'Telehealth-only — natural remote-monitoring fit'],
  ['West Coast Health & High Performance', 'Perth', 'AU', 'independent', 'Sports concussion services (Lathlain)'],
  // NZ — ACC-contracted Concussion Service suppliers + CCMI/vestibular
  ['Axis Sports Medicine Specialists', 'Auckland', 'NZ', 'acc', 'ACC supplier + dedicated concussion clinic + vestibular — TOP NZ target'],
  ['Active+', 'Nationwide', 'NZ', 'acc', 'ACC supplier; ~25% of all ACC concussion programmes'],
  ['TBI Health Group', 'Nationwide', 'NZ', 'acc', 'ACC supplier; Southern Cross JV'],
  ['Habit Health', 'Nationwide', 'NZ', 'acc', 'ACC supplier, large multi-site group'],
  ['Proactive Rehab', 'Nationwide', 'NZ', 'acc', 'ACC supplier, all regions'],
  ['ABI Rehabilitation', 'Auckland', 'NZ', 'acc', 'ACC supplier; live concussion service page'],
  ['Rope Neuro Rehabilitation', 'Auckland', 'NZ', 'acc', 'ACC supplier, neuro specialty'],
  ['Specialist Rehab Services', 'Auckland', 'NZ', 'acc', 'ACC supplier, 5 regions'],
  ['What Ever It Takes', 'Auckland', 'NZ', 'acc', 'ACC supplier'],
  ['Geneva Healthcare', 'Auckland', 'NZ', 'acc', 'ACC supplier, multi-region'],
  ['Body In Motion Physio & Rehab', 'Tauranga', 'NZ', 'acc', 'ACC supplier + explicit vestibular service'],
  ['Bay Rehab', 'Tauranga', 'NZ', 'acc', 'ACC supplier BOP/Waikato'],
  ['Advantage South', 'Christchurch', 'NZ', 'acc', 'ACC supplier, South Island'],
  ['Laura Fergusson Brain Injury Trust', 'Christchurch', 'NZ', 'acc', 'ACC supplier, brain-injury trust'],
  ['Motus Health', 'Christchurch', 'NZ', 'acc', 'ACC supplier'],
  ['The Headache Clinic', 'Auckland', 'NZ', 'ccmi', 'CCMI national network — 10 sites, one deal'],
  ['HeadWise Concussion Care', 'Auckland', 'NZ', 'ccmi', 'CCMI-certified, concussion-only brand'],
  ['NZ Dizziness and Balance Centre', 'Auckland', 'NZ', 'vestibular', 'Dedicated vestibular centre, physio-led VRT'],
]

async function main() {
  // 1) sst_target flag on the live engine table
  await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS sst_target BOOLEAN NOT NULL DEFAULT FALSE`
  const tagged = await sql`
    UPDATE prospect_clinics SET sst_target = TRUE, updated_at = NOW()
    WHERE sst_target = FALSE
      AND status NOT IN ('lost')
      AND (
        name ~* 'concuss|vestibul|neuro|balance|headache'
        OR clinic_website_url ~* 'concuss|vestibul|neuro'
        OR (name ~* 'sports' AND contact_discipline ~* 'physio')
      )
      AND contact_email NOT IN (SELECT email FROM email_suppression)
  `
  // 2) seed pen
  await sql`
    CREATE TABLE IF NOT EXISTS sst_targets (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      source TEXT NOT NULL,
      qualification TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sourcing',
      contact_email TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (name, city)
    )
  `
  let inserted = 0
  for (const [name, city, country, source, why] of SEED) {
    const r = await sql`
      INSERT INTO sst_targets (name, city, country, source, qualification)
      VALUES (${name}, ${city}, ${country}, ${source}, ${why})
      ON CONFLICT (name, city) DO NOTHING
    `
    inserted += r.rowCount ?? 0
  }
  const engineReady = await sql`SELECT COUNT(*)::int AS n, status FROM prospect_clinics WHERE sst_target GROUP BY status`
  console.log('tagged existing prospects:', tagged.rowCount)
  console.log('seed targets inserted:', inserted, 'of', SEED.length)
  console.log('engine-ready sst_target by status:', JSON.stringify(engineReady.rows))
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
