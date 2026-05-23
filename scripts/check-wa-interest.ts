import { config } from 'dotenv'
config({ path: '.env.local' })
import { sql } from '@vercel/postgres'

async function main() {
  const { rows: byCity } = await sql`
    SELECT city, COUNT(*)::int AS count
    FROM workshop_interest
    GROUP BY city
    ORDER BY count DESC
  `
  console.log('\n═══ workshop_interest — counts by city ═══')
  for (const r of byCity) console.log(`  ${String(r.city).padEnd(12)} ${r.count}`)

  const { rows: wa } = await sql`
    SELECT email, name, source, created_at
    FROM workshop_interest
    WHERE city = 'wa'
    ORDER BY created_at DESC
  `
  console.log(`\n═══ WA — individual entries: ${wa.length} ═══`)
  for (const r of wa) {
    console.log(`  ${new Date(r.created_at).toISOString().slice(0,10)}  ${r.email}  (${r.name})  via=${r.source}`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
