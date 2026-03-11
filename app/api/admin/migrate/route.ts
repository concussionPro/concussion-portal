/**
 * One-time migration endpoint: Vercel Blob → Postgres
 * Runs on production where both BLOB_READ_WRITE_TOKEN and POSTGRES_URL are available.
 * Protected by ADMIN_API_KEY. DELETE THIS ROUTE after migration is complete.
 */
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { list as listBlobs } from '@vercel/blob'

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

function isAdminAuthorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY
  if (!expected) return false
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey && timingSafeCompare(adminKey, expected)) return true
  return false
}

export const maxDuration = 60

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log: string[] = []

  try {
    // 1. Create tables
    log.push('Creating tables...')
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
    log.push('Tables created.')

    // 2. Migrate users from Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      log.push('No BLOB_READ_WRITE_TOKEN — skipping Blob migration.')
      return NextResponse.json({ success: true, log })
    }

    log.push('Migrating users from Blob...')
    const { blobs } = await listBlobs()
    const userBlobs = blobs
      .filter(b => b.pathname === 'users.json')
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    if (userBlobs.length === 0) {
      log.push('No users.json blob found.')
    } else {
      const res = await fetch(`${userBlobs[0].url}?t=${Date.now()}`, { cache: 'no-store' })
      const users: any[] = await res.json()
      log.push(`Found ${users.length} users in Blob.`)

      let migrated = 0
      for (const u of users) {
        try {
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
          migrated++
        } catch (err: any) {
          log.push(`  Failed to migrate user ${u.email}: ${err.message}`)
        }
      }
      log.push(`Migrated ${migrated}/${users.length} users.`)
    }

    // 3. Migrate progress
    log.push('Migrating progress...')
    const { blobs: allBlobs } = await listBlobs({ prefix: 'user-progress/' })
    let progressMigrated = 0
    for (const blob of allBlobs) {
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
        progressMigrated++
      } catch (err) {
        log.push(`  Failed to migrate progress for ${userId}`)
      }
    }
    log.push(`Migrated ${progressMigrated} progress records.`)

    // 4. Migrate abandoned checkouts
    log.push('Migrating abandoned checkouts...')
    const acBlobs = blobs
      .filter(b => b.pathname === 'abandoned-checkouts.json')
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    if (acBlobs.length > 0) {
      const res = await fetch(`${acBlobs[0].url}?t=${Date.now()}`, { cache: 'no-store' })
      const checkouts: any[] = await res.json()
      let acMigrated = 0
      for (const c of checkouts) {
        try {
          await sql`
            INSERT INTO abandoned_checkouts (email, name, course_type, amount, abandoned_at, emails_sent, recovered)
            VALUES (${c.email}, ${c.name || ''}, ${c.courseType || 'unknown'}, ${c.amount || 0}, ${c.abandonedAt || new Date().toISOString()}, ${c.emailsSent || 0}, ${c.recovered || false})
          `
          acMigrated++
        } catch (err) {
          log.push(`  Failed to migrate checkout for ${c.email}`)
        }
      }
      log.push(`Migrated ${acMigrated} abandoned checkouts.`)
    } else {
      log.push('No abandoned checkouts found.')
    }

    log.push('Migration complete!')
    return NextResponse.json({ success: true, log })
  } catch (error: any) {
    log.push(`ERROR: ${error.message}`)
    return NextResponse.json({ success: false, log, error: error.message }, { status: 500 })
  }
}
