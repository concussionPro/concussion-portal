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
  signupSource?: 'free-course' | 'preseason' | 'purchase' | 'admin'
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
    isTest: row.is_test || undefined,
  }
}

// Load all users
export async function loadUsers(): Promise<User[]> {
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

// Create new user (or upgrade existing)
export async function createUser(data: {
  email: string
  name: string
  accessLevel: 'online-only' | 'full-course' | 'preview'
  squarespaceOrderId?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  workshopLocation?: string
  signupSource?: 'free-course' | 'preseason' | 'purchase' | 'admin'
}): Promise<string> {
  // Check if user already exists
  const existing = await findUserByEmail(data.email)

  if (existing) {
    // Update access level if upgrading (never downgrade)
    if (
      (existing.accessLevel === 'online-only' || existing.accessLevel === 'preview') &&
      (data.accessLevel === 'full-course' || data.accessLevel === 'online-only')
    ) {
      await sql`
        UPDATE users SET
          access_level = ${data.accessLevel},
          stripe_customer_id = COALESCE(${data.stripeCustomerId || null}, stripe_customer_id),
          stripe_subscription_id = COALESCE(${data.stripeSubscriptionId || null}, stripe_subscription_id),
          workshop_location = COALESCE(${data.workshopLocation || null}, workshop_location)
        WHERE id = ${existing.id}
      `
    } else if (existing.accessLevel === 'full-course' && (data.stripeCustomerId || data.workshopLocation)) {
      // Update Stripe metadata for existing full-course users (webhook retries, etc.)
      await sql`
        UPDATE users SET
          stripe_customer_id = COALESCE(${data.stripeCustomerId || null}, stripe_customer_id),
          stripe_subscription_id = COALESCE(${data.stripeSubscriptionId || null}, stripe_subscription_id),
          workshop_location = COALESCE(${data.workshopLocation || null}, workshop_location)
        WHERE id = ${existing.id}
      `
    }
    return existing.id
  }

  // Create new user
  const id = crypto.randomBytes(16).toString('hex')
  await sql`
    INSERT INTO users (id, email, name, access_level, created_at, squarespace_order_id, stripe_customer_id, stripe_subscription_id, workshop_location, signup_source)
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
      ${data.signupSource || null}
    )
  `
  return id
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
