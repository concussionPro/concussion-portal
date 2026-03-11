/**
 * One-time migration endpoint: Vercel Blob → Postgres
 * Accepts ?step=tables|users|progress|checkouts to run one step at a time.
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

  const step = new URL(request.url).searchParams.get('step') || 'tables'

  try {
    if (step === 'tables') {
      await sql`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL DEFAULT '', access_level TEXT NOT NULL DEFAULT 'preview', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), squarespace_order_id TEXT, stripe_customer_id TEXT, stripe_subscription_id TEXT, workshop_location TEXT, last_login_at TIMESTAMPTZ, nurture_unsubscribed BOOLEAN NOT NULL DEFAULT false, signup_source TEXT)`
      await sql`CREATE TABLE IF NOT EXISTS user_progress (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, progress JSONB NOT NULL DEFAULT '{}'::jsonb, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`
      await sql`CREATE TABLE IF NOT EXISTS abandoned_checkouts (id SERIAL PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL DEFAULT '', course_type TEXT NOT NULL DEFAULT 'unknown', amount NUMERIC(10,2) NOT NULL DEFAULT 0, abandoned_at TIMESTAMPTZ NOT NULL DEFAULT now(), emails_sent INTEGER NOT NULL DEFAULT 0, recovered BOOLEAN NOT NULL DEFAULT false)`
      await sql`CREATE TABLE IF NOT EXISTS processed_webhook_events (event_id TEXT PRIMARY KEY, event_type TEXT NOT NULL, processed_at TIMESTAMPTZ NOT NULL DEFAULT now())`
      return NextResponse.json({ success: true, step: 'tables', message: 'Tables created' })
    }

    if (step === 'users') {
      const { blobs } = await listBlobs()
      const userBlobs = blobs.filter(b => b.pathname === 'users.json').sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      if (userBlobs.length === 0) return NextResponse.json({ success: true, step: 'users', message: 'No users.json blob found', count: 0 })
      const res = await fetch(`${userBlobs[0].url}?t=${Date.now()}`, { cache: 'no-store' })
      const users: any[] = await res.json()
      let migrated = 0
      for (const u of users) {
        try {
          await sql`INSERT INTO users (id, email, name, access_level, created_at, squarespace_order_id, stripe_customer_id, stripe_subscription_id, workshop_location, last_login_at, nurture_unsubscribed, signup_source) VALUES (${u.id}, ${u.email}, ${u.name || ''}, ${u.accessLevel || 'preview'}, ${u.createdAt || new Date().toISOString()}, ${u.squarespaceOrderId || null}, ${u.stripeCustomerId || null}, ${u.stripeSubscriptionId || null}, ${u.workshopLocation || null}, ${u.lastLoginAt || null}, ${u.nurtureUnsubscribed || false}, ${u.signupSource || null}) ON CONFLICT (id) DO NOTHING`
          migrated++
        } catch {}
      }
      return NextResponse.json({ success: true, step: 'users', found: users.length, migrated })
    }

    if (step === 'progress') {
      const { blobs } = await listBlobs({ prefix: 'user-progress/' })
      let migrated = 0
      for (const blob of blobs) {
        const userId = blob.pathname.replace('user-progress/', '').replace('.json', '')
        try {
          const res = await fetch(`${blob.url}?t=${Date.now()}`, { cache: 'no-store' })
          if (!res.ok) continue
          const progress = await res.json()
          await sql`INSERT INTO user_progress (user_id, progress, updated_at) VALUES (${userId}, ${JSON.stringify(progress)}::jsonb, now()) ON CONFLICT (user_id) DO UPDATE SET progress = ${JSON.stringify(progress)}::jsonb, updated_at = now()`
          migrated++
        } catch {}
      }
      return NextResponse.json({ success: true, step: 'progress', found: blobs.length, migrated })
    }

    if (step === 'checkouts') {
      const { blobs } = await listBlobs()
      const acBlobs = blobs.filter(b => b.pathname === 'abandoned-checkouts.json').sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      if (acBlobs.length === 0) return NextResponse.json({ success: true, step: 'checkouts', message: 'No abandoned checkouts found', count: 0 })
      const res = await fetch(`${acBlobs[0].url}?t=${Date.now()}`, { cache: 'no-store' })
      const checkouts: any[] = await res.json()
      let migrated = 0
      for (const c of checkouts) {
        try {
          await sql`INSERT INTO abandoned_checkouts (email, name, course_type, amount, abandoned_at, emails_sent, recovered) VALUES (${c.email}, ${c.name || ''}, ${c.courseType || 'unknown'}, ${c.amount || 0}, ${c.abandonedAt || new Date().toISOString()}, ${c.emailsSent || 0}, ${c.recovered || false})`
          migrated++
        } catch {}
      }
      return NextResponse.json({ success: true, step: 'checkouts', found: checkouts.length, migrated })
    }

    return NextResponse.json({ error: 'Invalid step. Use: tables, users, progress, checkouts' }, { status: 400 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, step, error: msg }, { status: 500 })
  }
}
