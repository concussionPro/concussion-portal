/** Disqualify platform-locked (CCMI) targets from the SST pitch pipeline
 *  (owner 2026-07-06: "they'll all just reply 'no we use ccmi'"). Kept as
 *  rows for a future ecosystem/switch play, never pitched cold. Also
 *  untags any engine prospect whose name matches a CCMI-affiliated clinic. */
import { sql } from '@vercel/postgres'

const CCMI_NAMES = [
  'Sydney Concussion Centre','Sports Lab','CP Physio','HH Physio & Sports Rehab',
  'Dynamic Physiotherapy Five Dock','St George SportsMed','Concussion Central',
  'Premier Sports & Spinal Medicine','Sports & Spinal Group Hampton',
  'The Sports Injury Clinic','Geelong Neuro Centre','Barwon Sports Physiotherapy',
  'Pivot Sports Performance','Peak Sports Physiotherapy','Lifecare',
  'Heads Up Concussion Care','TMJ & Headache Clinic West Perth','Online Concussion Clinic',
  'The Headache Clinic','HeadWise Concussion Care','Bodyworx Osteopaths',
]

async function main() {
  const dq = await sql`
    UPDATE sst_targets
    SET status = 'disqualified',
        qualification = qualification || ' — DISQUALIFIED: CCMI platform user; cold pitch dead on arrival'
    WHERE source = 'ccmi' AND status <> 'disqualified'
  `
  let untagged = 0
  for (const n of CCMI_NAMES) {
    const r = await sql`
      UPDATE prospect_clinics SET sst_target = FALSE, updated_at = NOW()
      WHERE sst_target AND name ILIKE ${'%' + n + '%'}
    `
    untagged += r.rowCount ?? 0
  }
  const remaining = await sql`SELECT status, COUNT(*)::int AS n FROM sst_targets GROUP BY status`
  const engine = await sql`SELECT COUNT(*)::int AS n FROM prospect_clinics WHERE sst_target`
  console.log('seed disqualified:', dq.rowCount, '| engine untagged:', untagged)
  console.log('seed by status:', JSON.stringify(remaining.rows), '| engine sst_target remaining:', engine.rows[0].n)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
