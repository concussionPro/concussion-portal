/**
 * One-time migration: Vercel Blob → Vercel Postgres
 *
 * Creates tables and migrates existing data from Blob storage.
 * Safe to re-run (uses IF NOT EXISTS / ON CONFLICT).
 *
 * Usage: npx tsx scripts/migrate-blob-to-postgres.ts
 */
import 'dotenv/config'
import { sql } from '@vercel/postgres'
import { list as listBlobs } from '@vercel/blob'

async function createTables() {
  console.log('Creating tables...')

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      access_level TEXT NOT NULL DEFAULT 'preview',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      squarespace_order_id TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      workshop_location TEXT,
      last_login_at TIMESTAMPTZ,
      nurture_unsubscribed BOOLEAN NOT NULL DEFAULT false,
      progress_emails_opted_out BOOLEAN NOT NULL DEFAULT false,
      signup_source TEXT
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS user_progress (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      progress JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS abandoned_checkouts (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      course_type TEXT NOT NULL DEFAULT 'unknown',
      amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      abandoned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      emails_sent INTEGER NOT NULL DEFAULT 0,
      recovered BOOLEAN NOT NULL DEFAULT false
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS processed_webhook_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

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

  await sql`
    CREATE TABLE IF NOT EXISTS email_audit_log (
      id SERIAL PRIMARY KEY,
      audit_key TEXT UNIQUE NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_email_audit_log_audit_key ON email_audit_log(audit_key)
  `

  // Add progress_emails_opted_out column to existing databases
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS progress_emails_opted_out BOOLEAN NOT NULL DEFAULT false
  `

  // Add converted_from column for tracking upgrade conversion path
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS converted_from TEXT
  `

  // Add is_test column for marking test accounts
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false
  `

  console.log('Tables created.')
}

async function migrateUsers() {
  console.log('Migrating users...')

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log('  No BLOB_READ_WRITE_TOKEN — skipping user migration.')
    return
  }

  const { blobs } = await listBlobs()
  const userBlobs = blobs
    .filter(b => b.pathname === 'users.json')
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  if (userBlobs.length === 0) {
    console.log('  No users.json blob found — nothing to migrate.')
    return
  }

  const res = await fetch(`${userBlobs[0].url}?t=${Date.now()}`, { cache: 'no-store' })
  const users: any[] = await res.json()
  console.log(`  Found ${users.length} users in Blob.`)

  for (const u of users) {
    await sql`
      INSERT INTO users (id, email, name, access_level, created_at, squarespace_order_id, stripe_customer_id, stripe_subscription_id, workshop_location, last_login_at, nurture_unsubscribed, signup_source)
      VALUES (
        ${u.id},
        ${u.email},
        ${u.name || ''},
        ${u.accessLevel || 'preview'},
        ${u.createdAt || new Date().toISOString()},
        ${u.squarespaceOrderId || null},
        ${u.stripeCustomerId || null},
        ${u.stripeSubscriptionId || null},
        ${u.workshopLocation || null},
        ${u.lastLoginAt || null},
        ${u.nurtureUnsubscribed || false},
        ${u.signupSource || null}
      )
      ON CONFLICT (id) DO NOTHING
    `
  }

  console.log(`  Migrated ${users.length} users.`)
}

async function migrateProgress() {
  console.log('Migrating user progress...')

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log('  No BLOB_READ_WRITE_TOKEN — skipping progress migration.')
    return
  }

  const { blobs } = await listBlobs({ prefix: 'user-progress/' })

  if (blobs.length === 0) {
    console.log('  No progress blobs found.')
    return
  }

  let migrated = 0
  for (const blob of blobs) {
    const userId = blob.pathname.replace('user-progress/', '').replace('.json', '')
    try {
      const res = await fetch(`${blob.url}?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) continue
      const progress = await res.json()

      await sql`
        INSERT INTO user_progress (user_id, progress, updated_at)
        VALUES (${userId}, ${JSON.stringify(progress)}::jsonb, now())
        ON CONFLICT (user_id) DO UPDATE SET progress = ${JSON.stringify(progress)}::jsonb, updated_at = now()
      `
      migrated++
    } catch (err) {
      console.error(`  Failed to migrate progress for ${userId}:`, err)
    }
  }

  console.log(`  Migrated ${migrated} progress records.`)
}

async function migrateAbandonedCheckouts() {
  console.log('Migrating abandoned checkouts...')

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log('  No BLOB_READ_WRITE_TOKEN — skipping abandoned checkout migration.')
    return
  }

  const { blobs } = await listBlobs()
  const acBlobs = blobs
    .filter(b => b.pathname === 'abandoned-checkouts.json')
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  if (acBlobs.length === 0) {
    console.log('  No abandoned-checkouts.json blob found.')
    return
  }

  const res = await fetch(`${acBlobs[0].url}?t=${Date.now()}`, { cache: 'no-store' })
  const checkouts: any[] = await res.json()
  console.log(`  Found ${checkouts.length} abandoned checkouts.`)

  for (const c of checkouts) {
    await sql`
      INSERT INTO abandoned_checkouts (email, name, course_type, amount, abandoned_at, emails_sent, recovered)
      VALUES (
        ${c.email},
        ${c.name || ''},
        ${c.courseType || 'unknown'},
        ${c.amount || 0},
        ${c.abandonedAt || new Date().toISOString()},
        ${c.emailsSent || 0},
        ${c.recovered || false}
      )
    `
  }

  console.log(`  Migrated ${checkouts.length} abandoned checkouts.`)
}

async function main() {
  console.log('=== Blob → Postgres Migration ===\n')
  await createTables()
  await migrateUsers()
  await migrateProgress()
  await migrateAbandonedCheckouts()
  console.log('\n=== Migration complete ===')
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
