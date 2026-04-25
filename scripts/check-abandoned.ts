import 'dotenv/config'
import { sql } from '@vercel/postgres'

async function main() {
  const { rows } = await sql`
    SELECT email, name, course_type, amount, abandoned_at,
           emails_sent, recovered
    FROM abandoned_checkouts
    WHERE abandoned_at >= NOW() - INTERVAL '7 days'
    ORDER BY abandoned_at DESC
  `
  console.log(`\nAbandoned checkouts in last 7 days: ${rows.length}`)
  for (const r of rows) {
    const ts = new Date(r.abandoned_at).toISOString()
    console.log(`  ${ts}  ${r.course_type.padEnd(18)} $${r.amount}  emails=${r.emails_sent} recovered=${r.recovered}  ${r.email}`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
