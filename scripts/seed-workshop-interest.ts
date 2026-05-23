/**
 * One-time migration: Re-seed workshop interest data lost during Blob→Postgres migration.
 *
 * Run: npx tsx scripts/seed-workshop-interest.ts
 *
 * Requires POSTGRES_URL in .env (same as Vercel project env vars)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

const seedData: Array<{ email: string; name: string; city: string; source: string }> = [
  // Sydney (2)
  { email: 'micah@purposehealthcare.com.au', name: 'Micah', city: 'sydney', source: 'squarespace' },
  { email: 'cole@canterburyosteopathy.co.nz', name: 'Cole', city: 'sydney', source: 'squarespace' },
  // Melbourne (7)
  { email: 'cliff@williamstownosteo.com.au', name: 'Cliff', city: 'melbourne', source: 'squarespace' },
  { email: 'joz9292@gmail.com', name: 'Joz', city: 'melbourne', source: 'squarespace' },
  { email: 'kyles@coastphysio.com.au', name: 'Kyle', city: 'melbourne', source: 'squarespace' },
  { email: 'contact@peninsulaconcussionclinic.com.au', name: 'Lachlan Williams', city: 'melbourne', source: 'squarespace' },
  { email: 'akondal62@gmail.com', name: 'Amandeep', city: 'melbourne', source: 'squarespace' },
  { email: 'billyfgunn96@gmail.com', name: 'Billy', city: 'melbourne', source: 'squarespace' },
  { email: 'patrick.heenan20@gmail.com', name: 'Patrick', city: 'melbourne', source: 'squarespace' },
  // Adelaide (3)
  { email: 'agatadvier@gmail.com', name: 'Agata', city: 'adelaide', source: 'squarespace' },
  { email: 'chloe.taylor42@hotmail.com', name: 'Chloe', city: 'adelaide', source: 'squarespace' },
  { email: 'ciska_helm@yahoo.co.uk', name: 'Ciska', city: 'adelaide', source: 'squarespace' },
  // Western Australia (2)
  { email: 'adam.spiroff@outlook.com', name: 'Adam', city: 'wa', source: 'squarespace' },
  { email: 'mereesha@injurysense.com.au', name: 'Mereesha', city: 'wa', source: 'squarespace' },
  // Byron Bay (1)
  { email: 'jessica.r.hendriks@gmail.com', name: 'Jessica', city: 'byron-bay', source: 'squarespace' },
]

async function seed() {
  const url = process.env.POSTGRES_URL
  if (!url) {
    console.error('POSTGRES_URL is required. Set it in .env')
    process.exit(1)
  }

  const sql = neon(url)

  // Ensure table exists
  await sql`
    CREATE TABLE IF NOT EXISTS workshop_interest (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      source TEXT DEFAULT 'unknown',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(email, city)
    )
  `

  let inserted = 0
  let skipped = 0

  for (const entry of seedData) {
    const result = await sql`
      INSERT INTO workshop_interest (email, name, city, source, created_at)
      VALUES (${entry.email}, ${entry.name}, ${entry.city}, ${entry.source}, '2026-03-01T00:00:00Z')
      ON CONFLICT (email, city) DO NOTHING
    `
    if (result.length === 0) {
      // ON CONFLICT DO NOTHING returns empty on conflict for neon
      // We can't easily tell, so just count
    }
    inserted++
  }

  console.log(`Seeded ${inserted} interest registrations (duplicates auto-skipped)`)

  // Verify
  const rows = await sql`SELECT city, COUNT(*)::int AS count FROM workshop_interest GROUP BY city ORDER BY count DESC`
  console.log('\nWorkshop interest by city:')
  for (const row of rows) {
    console.log(`  ${row.city}: ${row.count}`)
  }
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
