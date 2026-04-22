import { sql } from '@/lib/db'
import crypto from 'crypto'

export interface User {
  id: string
  email: string
  name: string
  accessLevel: 'online-only' | 'full-course' | 'preview'
  createdAt: string
  squarespaceOrderId?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  workshopLocation?: string // e.g. 'byron-bay', 'sydney', 'melbourne'
  lastLoginAt?: string
  nurtureUnsubscribed?: boolean
  progressEmailsOptedOut?: boolean
  signupSource?: 'free-course' | 'scat-export' | 'preseason' | 'purchase' | 'admin' | 'squarespace'
  convertedFrom?: string  // original signup source before upgrade
  isTest?: boolean
}

/** Map a snake_case DB row to a camelCase User object */
function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    accessLevel: row.access_level,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    squarespaceOrderId: row.squarespace_order_id || undefined,
    stripeCustomerId: row.stripe_customer_id || undefined,
    stripeSubscriptionId: row.stripe_subscription_id || undefined,
    workshopLocation: row.workshop_location || undefined,
    lastLoginAt: row.last_login_at
      ? (row.last_login_at instanceof Date ? row.last_login_at.toISOString() : row.last_login_at)
      : undefined,
    nurtureUnsubscribed: row.nurture_unsubscribed || undefined,
    progressEmailsOptedOut: row.progress_emails_opted_out || undefined,
    signupSource: row.signup_source || undefined,
    convertedFrom: row.converted_from || undefined,
    isTest: row.is_test || undefined,
  }
}

// Load all users
export async function loadUsers(): Promise<User[]> {
  await ensureColumns()
  const { rows } = await sql`SELECT * FROM users ORDER BY created_at DESC`
  return rows.map(rowToUser)
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`
  return rows.length > 0 ? rowToUser(rows[0]) : null
}

// Find user by ID
export async function findUserById(id: string): Promise<User | null> {
  const { rows } = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`
  return rows.length > 0 ? rowToUser(rows[0]) : null
}

// One-time migration flag — ensures converted_from column exists before first write
let columnMigrated = false
async function ensureColumns() {
  if (columnMigrated) return
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS converted_from TEXT`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reference_book_purchased_at TIMESTAMPTZ`
  } catch {
    // Column already exists or permissions differ — safe to continue
  }
  columnMigrated = true
}

/**
 * Mark a user as having purchased the Clinical Reference Text.
 * Idempotent — only sets the timestamp the first time, so the purchase
 * date isn't overwritten by later webhook retries or admin actions.
 */
export async function markBookPurchased(email: string): Promise<void> {
  await ensureColumns()
  await sql`
    UPDATE users
    SET reference_book_purchased_at = COALESCE(reference_book_purchased_at, NOW())
    WHERE LOWER(email) = LOWER(${email})
  `
}

export async function isBookOwner(email: string): Promise<boolean> {
  await ensureColumns()
  const { rows } = await sql`
    SELECT 1 FROM users
    WHERE LOWER(email) = LOWER(${email})
      AND reference_book_purchased_at IS NOT NULL
    LIMIT 1
  `
  return rows.length > 0
}

// Create new user (or upgrade existing) — uses upsert to avoid race conditions
export async function createUser(data: {
  email: string
  name: string
  accessLevel: 'online-only' | 'full-course' | 'preview'
  squarespaceOrderId?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  workshopLocation?: string
  signupSource?: 'free-course' | 'scat-export' | 'preseason' | 'purchase' | 'admin' | 'squarespace'
}): Promise<string> {
  await ensureColumns()
  await ensureEmailIndex()

  const id = crypto.randomBytes(16).toString('hex')

  // Atomic upsert: INSERT or update on conflict
  // ON CONFLICT uses the unique index on LOWER(email)
  const { rows } = await sql`
    INSERT INTO users (id, email, name, access_level, created_at, squarespace_order_id, stripe_customer_id, stripe_subscription_id, workshop_location, signup_source, converted_from)
    VALUES (
      ${id},
      ${data.email},
      ${data.name},
      ${data.accessLevel},
      ${new Date().toISOString()},
      ${data.squarespaceOrderId || null},
      ${data.stripeCustomerId || null},
      ${data.stripeSubscriptionId || null},
      ${data.workshopLocation || null},
      ${data.signupSource || null},
      ${null}
    )
    ON CONFLICT (LOWER(email)) DO UPDATE SET
      access_level = CASE
        WHEN EXCLUDED.access_level = 'full-course' THEN 'full-course'
        WHEN EXCLUDED.access_level = 'online-only' AND users.access_level = 'preview' THEN 'online-only'
        ELSE users.access_level
      END,
      name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
      stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, users.stripe_customer_id),
      stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, users.stripe_subscription_id),
      workshop_location = COALESCE(EXCLUDED.workshop_location, users.workshop_location),
      signup_source = COALESCE(EXCLUDED.signup_source, users.signup_source),
      converted_from = CASE
        WHEN users.signup_source IS NOT NULL AND EXCLUDED.signup_source IS NOT NULL AND users.signup_source != EXCLUDED.signup_source
        THEN COALESCE(users.converted_from, users.signup_source)
        ELSE users.converted_from
      END
    RETURNING id
  `

  return rows[0].id
}

/** Ensure unique index on LOWER(email) for upsert support */
let emailIndexEnsured = false
async function ensureEmailIndex() {
  if (emailIndexEnsured) return
  try {
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email))`
  } catch {
    // Index already exists or permissions differ — safe to continue
  }
  emailIndexEnsured = true
}

// Count full-course enrollments for a specific workshop location
export async function getEnrollmentCount(location: string): Promise<number> {
  const { rows } = await sql`
    SELECT COUNT(*)::int AS count FROM users
    WHERE access_level = 'full-course' AND workshop_location = ${location}
  `
  return rows[0]?.count || 0
}

// Get full-course enrollments grouped by location (for admin dashboard)
export async function getEnrollmentsByLocation(location: string): Promise<Array<{ name: string; email: string; createdAt: string }>> {
  const { rows } = await sql`
    SELECT name, email, created_at FROM users
    WHERE access_level = 'full-course' AND workshop_location = ${location}
    ORDER BY created_at DESC
  `
  return rows.map(r => ({
    name: r.name,
    email: r.email,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }))
}

// Update user's last login
export async function updateLastLogin(userId: string) {
  await sql`UPDATE users SET last_login_at = now() WHERE id = ${userId}`
}

// Unsubscribe user from nurture emails
export async function unsubscribeUser(email: string): Promise<boolean> {
  const { rowCount } = await sql`
    UPDATE users SET nurture_unsubscribed = true WHERE LOWER(email) = LOWER(${email})
  `
  return (rowCount ?? 0) > 0
}

// Update user profile (name, nurtureUnsubscribed, progressEmailsOptedOut)
export async function updateUserProfile(
  userId: string,
  updates: { name?: string; nurtureUnsubscribed?: boolean; progressEmailsOptedOut?: boolean }
): Promise<User | null> {
  const user = await findUserById(userId)
  if (!user) return null

  const newName = updates.name !== undefined ? updates.name : user.name
  const newUnsub = updates.nurtureUnsubscribed !== undefined ? updates.nurtureUnsubscribed : (user.nurtureUnsubscribed || false)
  const newProgressOptOut = updates.progressEmailsOptedOut !== undefined ? updates.progressEmailsOptedOut : (user.progressEmailsOptedOut || false)

  await sql`
    UPDATE users SET name = ${newName}, nurture_unsubscribed = ${newUnsub}, progress_emails_opted_out = ${newProgressOptOut} WHERE id = ${userId}
  `

  return { ...user, name: newName, nurtureUnsubscribed: newUnsub, progressEmailsOptedOut: newProgressOptOut }
}
