/**
 * Add email_events table for Resend webhook tracking.
 *
 * Run: npx tsx scripts/add-email-events-table.ts
 * Requires POSTGRES_URL env var.
 */

import { sql } from '@vercel/postgres'

async function main() {
  console.log('Creating email_events table...')

  await sql`
    CREATE TABLE IF NOT EXISTS email_events (
      id SERIAL PRIMARY KEY,
      email_id TEXT NOT NULL,
      recipient TEXT NOT NULL,
      event_type TEXT NOT NULL,
      subject TEXT,
      sequence TEXT,
      day TEXT,
      click_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_email_events_recipient ON email_events(recipient)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type)
  `

  console.log('Done. email_events table created with indexes.')
}

main().catch(console.error)
