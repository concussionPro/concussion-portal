import 'dotenv/config'
import { sql } from '@vercel/postgres'

async function main() {
  // Paid Melbourne full-course seats
  const { rows: paid } = await sql`
    SELECT email, name, access_level, created_at
    FROM users
    WHERE workshop_location = 'melbourne'
      AND access_level = 'full-course'
    ORDER BY created_at DESC
  `
  console.log(`\n═══ Melbourne — PAID full-course seats: ${paid.length} ═══`)
  for (const r of paid) {
    console.log(`  ${new Date(r.created_at).toISOString().slice(0,10)}  ${r.email}  (${r.name})`)
  }

  // Online-only in preferred city melbourne (verbal-commit / likely upgrade)
  const { rows: online } = await sql`
    SELECT u.email, u.name, u.created_at, u.workshop_location
    FROM users u
    WHERE u.access_level = 'online-only'
      AND (u.workshop_location = 'melbourne' OR EXISTS (
        SELECT 1 FROM workshop_interest wi
        WHERE LOWER(wi.email) = LOWER(u.email) AND wi.city = 'melbourne'
      ))
    ORDER BY u.created_at DESC
  `
  console.log(`\n═══ Melbourne — online-only users (upgrade candidates): ${online.length} ═══`)
  for (const r of online) {
    console.log(`  ${new Date(r.created_at).toISOString().slice(0,10)}  ${r.email}  (${r.name})  loc=${r.workshop_location || '-'}`)
  }

  // Pure interest registrations (no account yet)
  const { rows: interest } = await sql`
    SELECT email, name, source, created_at
    FROM workshop_interest
    WHERE city = 'melbourne'
    ORDER BY created_at DESC
  `
  console.log(`\n═══ Melbourne — interest registrations: ${interest.length} ═══`)
  for (const r of interest) {
    console.log(`  ${new Date(r.created_at).toISOString().slice(0,10)}  ${r.email}  (${r.name})  via=${r.source}`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
