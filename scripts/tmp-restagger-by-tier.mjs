import { config } from 'dotenv'
config({ path: '.env.local' })
const { sql } = await import('@vercel/postgres')

// One-shot re-stagger (Zac 2026-06-10): reassign the existing future T1 send
// slots so large clinics (>=6 clinical) occupy the earliest dates, then
// medium (2-5), then individuals. The set of timestamps is unchanged —
// same daily send-volume curve, different occupants.
const { rows } = await sql`
  SELECT pc.id, pc.short_name, pc.scheduled_send_at,
    (COALESCE((pc.team->>'osteopaths')::int,0) + COALESCE((pc.team->>'physiotherapists')::int,0)
   + COALESCE((pc.team->>'generalPractitioners')::int,0) + COALESCE((pc.team->>'sportsMedicineDoctors')::int,0)
   + COALESCE((pc.team->>'exercisePhys')::int,0) + COALESCE((pc.team->>'myotherapists')::int,0)
   + COALESCE((pc.team->>'remedialMassage')::int,0)) AS clinical
  FROM prospect_clinics pc
  WHERE pc.next_template_slug = 'initial'
    AND pc.status NOT IN ('archived', 'lost', 'bounced', 'engaged', 'won', 'engaged-elsewhere', 'replied')
    AND pc.scheduled_send_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM prospect_outreach_log ol
      WHERE ol.clinic_id = pc.id AND ol.audit_key NOT LIKE '%:test:%'
    )
`
const tier = (c) => (c >= 6 ? 0 : c >= 2 ? 1 : 2)
const slots = rows.map((r) => r.scheduled_send_at).sort((a, b) => new Date(a) - new Date(b))
const ordered = [...rows].sort((a, b) => {
  const t = tier(a.clinical) - tier(b.clinical)
  if (t !== 0) return t
  return new Date(a.scheduled_send_at) - new Date(b.scheduled_send_at)
})
const counts = [0, 0, 0]
for (const r of rows) counts[tier(r.clinical)]++
console.log(`unsent T1 prospects: ${rows.length} | large(>=6): ${counts[0]} · medium(2-5): ${counts[1]} · individual(<=1): ${counts[2]}`)
console.log('earliest 5 slots BEFORE → AFTER:')
for (let i = 0; i < Math.min(5, ordered.length); i++) {
  console.log(`  ${new Date(slots[i]).toISOString().slice(0, 10)} → ${ordered[i].short_name} (clinical ${ordered[i].clinical})`)
}

// Apply: pairwise update (id -> new slot) in one statement via jsonb
const pairs = ordered.map((r, i) => ({ id: r.id, at: new Date(slots[i]).toISOString() }))
const pairsJson = JSON.stringify(pairs)
const res = await sql`
  UPDATE prospect_clinics pc
  SET scheduled_send_at = (p.at)::timestamptz, updated_at = NOW()
  FROM (
    SELECT (e->>'id')::int AS id, e->>'at' AS at
    FROM jsonb_array_elements(${pairsJson}::jsonb) e
  ) p
  WHERE pc.id = p.id AND pc.scheduled_send_at IS DISTINCT FROM (p.at)::timestamptz
`
console.log('rows updated:', res.rowCount)
process.exit(0)
