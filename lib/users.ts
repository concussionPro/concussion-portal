import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'
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
  signupSource?: 'free-course' | 'scat-export' | 'preseason' | 'purchase' | 'admin' | 'squarespace' | 'ai-safety-checklist' | 'sst-clinic' | 'ep-course' | 'intl-syllabus'
  convertedFrom?: string  // original signup source before upgrade
  isTest?: boolean
  referenceBookPurchasedAt?: string
  sstEntitledAt?: string
}

/**
 * A raw snake_case row from the `users` table.
 *
 * Written out rather than `any` so a column rename or a dropped SELECT field
 * fails at compile time instead of silently producing `undefined` on a User.
 * Timestamps come back as Date from the driver but as string from JSON paths,
 * hence the union — rowToUser normalises both to ISO strings.
 */
interface UserRow {
  id: string
  email: string
  name: string
  access_level: User['accessLevel']
  created_at: Date | string
  squarespace_order_id?: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  workshop_location?: string | null
  last_login_at?: Date | string | null
  nurture_unsubscribed?: boolean | null
  progress_emails_opted_out?: boolean | null
  signup_source?: User['signupSource'] | null
  converted_from?: string | null
  is_test?: boolean | null
  reference_book_purchased_at?: Date | string | null
  sst_entitled_at?: Date | string | null
}

/** Map a snake_case DB row to a camelCase User object */
function rowToUser(row: UserRow): User {
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
    referenceBookPurchasedAt: row.reference_book_purchased_at
      ? (row.reference_book_purchased_at instanceof Date ? row.reference_book_purchased_at.toISOString() : row.reference_book_purchased_at)
      : undefined,
    sstEntitledAt: row.sst_entitled_at
      ? (row.sst_entitled_at instanceof Date ? row.sst_entitled_at.toISOString() : row.sst_entitled_at)
      : undefined,
  }
}

// Load all users
export async function loadUsers(): Promise<User[]> {
  await ensureColumns()
  const { rows } = await sql<UserRow>`SELECT * FROM users ORDER BY created_at DESC`
  return rows.map(rowToUser)
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await sql<UserRow>`SELECT * FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`
  return rows.length > 0 ? rowToUser(rows[0]) : null
}

// Find user by ID
export async function findUserById(id: string): Promise<User | null> {
  const { rows } = await sql<UserRow>`SELECT * FROM users WHERE id = ${id} LIMIT 1`
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
    // Attribution back to the cold-outreach prospect_clinics.slug that
    // referred this signup (via ?prospect={slug} URL param on cold-email
    // CTAs to /scat-mastery and /preseason). Lets the engagement
    // aggregator count free-tool signups per prospect.
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS source_prospect_slug TEXT`
    await sql`CREATE INDEX IF NOT EXISTS users_source_prospect_slug_idx ON users (source_prospect_slug) WHERE source_prospect_slug IS NOT NULL`
    // SST reverse funnel (2026-07-06): a clinic that signs up for the
    // Clinical Testing suite gets a portal account with THIS set — it
    // unlocks the tools while course content stays purchase-gated (their
    // access_level stays 'preview'). Independent of course access.
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS sst_entitled_at TIMESTAMPTZ`
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

/**
 * Grant the SST (Clinical Testing) entitlement to a user, creating a
 * preview-tier account if they don't exist yet (reverse funnel: the tool
 * is the wedge, the course is the upsell). Idempotent on the timestamp.
 * Returns the user id so the caller can mint a login link.
 */
export async function grantSstEntitlement(email: string, name: string): Promise<string> {
  await ensureColumns()
  await ensureEmailIndex()
  const lower = email.toLowerCase()
  const { rows } = await sql`
    INSERT INTO users (id, email, name, access_level, created_at, signup_source, sst_entitled_at)
    VALUES (${crypto.randomBytes(16).toString('hex')}, ${lower}, ${name}, 'preview', ${new Date().toISOString()}, 'sst-clinic', NOW())
    ON CONFLICT (LOWER(email)) DO UPDATE
      SET sst_entitled_at = COALESCE(users.sst_entitled_at, NOW()),
          name = COALESCE(NULLIF(users.name, ''), EXCLUDED.name)
    RETURNING id
  `
  return rows[0].id
}

export async function hasSstEntitlement(email: string): Promise<boolean> {
  await ensureColumns()
  const { rows } = await sql`
    SELECT 1 FROM users
    WHERE LOWER(email) = LOWER(${email}) AND sst_entitled_at IS NOT NULL
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
  signupSource?: 'free-course' | 'scat-export' | 'preseason' | 'purchase' | 'admin' | 'squarespace' | 'ai-safety-checklist' | 'sst-clinic' | 'ep-course' | 'intl-syllabus'
  /** prospect_clinics.slug if this signup came from the cold sequence via ?prospect= param */
  sourceProspectSlug?: string
}): Promise<string> {
  await ensureColumns()
  await ensureEmailIndex()

  const id = crypto.randomBytes(16).toString('hex')

  // Atomic upsert: INSERT or update on conflict
  // ON CONFLICT uses the unique index on LOWER(email)
  const { rows } = await sql`
    INSERT INTO users (id, email, name, access_level, created_at, squarespace_order_id, stripe_customer_id, stripe_subscription_id, workshop_location, signup_source, converted_from, source_prospect_slug)
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
      ${null},
      ${data.sourceProspectSlug || null}
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
      END,
      source_prospect_slug = COALESCE(users.source_prospect_slug, EXCLUDED.source_prospect_slug)
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

// Count full-course enrollments for a specific workshop location.
//
// Scoped to the CURRENT round: if CONFIG.WORKSHOP.ROUND_START has a date for
// this location, only users created on/after it are counted — otherwise an
// all-time count would let past-round attendees consume seats/capacity for
// the active workshop. created_at is the closest purchase-time proxy the
// users table has (there is no per-purchase timestamp column); the round
// start is deliberately generous so current-round buyers aren't missed.
// PAID-registrant filter shared by every seat/threshold count: internal/test
// accounts (is_test) and comped access (signup_source 'alumni-grant') must
// never count toward launching a workshop date or occupy a "paid" seat —
// the 2026-07-03 board showed Zac's own accounts + a demo user + a comp as
// "Paid Registrants (5)". Comps still hold real access; they just aren't
// revenue and don't move thresholds.
const COMP_SOURCE = 'alumni-grant'

export async function getEnrollmentCount(location: string): Promise<number> {
  const roundStart = CONFIG.WORKSHOP.ROUND_START[location]
  if (roundStart) {
    const { rows } = await sql`
      SELECT COUNT(*)::int AS count FROM users
      WHERE access_level = 'full-course'
        AND workshop_location = ${location}
        AND created_at >= ${roundStart}
        AND is_test IS NOT TRUE
        AND COALESCE(signup_source, '') <> ${COMP_SOURCE}
    `
    return rows[0]?.count || 0
  }
  const { rows } = await sql`
    SELECT COUNT(*)::int AS count FROM users
    WHERE access_level = 'full-course' AND workshop_location = ${location}
      AND is_test IS NOT TRUE
      AND COALESCE(signup_source, '') <> ${COMP_SOURCE}
  `
  return rows[0]?.count || 0
}

// Get full-course enrollments grouped by location (for admin dashboard).
// Applies the SAME round scoping as getEnrollmentCount — previously this
// listed all-time registrants while the count was round-scoped, so the
// admin board's number and its registrant table disagreed.
export async function getEnrollmentsByLocation(location: string): Promise<Array<{ name: string; email: string; createdAt: string }>> {
  const roundStart = CONFIG.WORKSHOP.ROUND_START[location]
  const { rows } = roundStart
    ? await sql`
        SELECT name, email, created_at FROM users
        WHERE access_level = 'full-course'
          AND workshop_location = ${location}
          AND created_at >= ${roundStart}
          AND is_test IS NOT TRUE
          AND COALESCE(signup_source, '') <> ${COMP_SOURCE}
        ORDER BY created_at DESC
      `
    : await sql`
        SELECT name, email, created_at FROM users
        WHERE access_level = 'full-course' AND workshop_location = ${location}
          AND is_test IS NOT TRUE
          AND COALESCE(signup_source, '') <> ${COMP_SOURCE}
        ORDER BY created_at DESC
      `
  return rows.map(r => ({
    name: r.name,
    email: r.email,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }))
}

// PAID full-course users with NO workshop location — legacy/manual sales
// without a city. Excludes internal (is_test) and comped accounts: the board
// labels these "Paid Registrants", so only genuinely paid rows may appear.
export async function getEnrollmentsWithoutLocation(): Promise<Array<{ name: string; email: string; createdAt: string }>> {
  const { rows } = await sql`
    SELECT name, email, created_at FROM users
    WHERE access_level = 'full-course' AND workshop_location IS NULL
      AND is_test IS NOT TRUE
      AND COALESCE(signup_source, '') <> ${COMP_SOURCE}
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

// Unsubscribe user from nurture emails.
// ALSO inserts into email_suppression (2026-07-02): email_suppression is the
// master blacklist checked by EVERY send lane (nurture, cold-clinic, partner,
// Agent B) — nurture_unsubscribed alone only covered users-table lanes, so an
// unsubscribed user could still be emailed by the prospect/partner engines.
export async function unsubscribeUser(email: string): Promise<boolean> {
  const { rowCount } = await sql`
    UPDATE users SET nurture_unsubscribed = true WHERE LOWER(email) = LOWER(${email})
  `
  try {
    await sql`
      INSERT INTO email_suppression (email, reason, source)
      VALUES (${email.toLowerCase()}, 'unsubscribed', 'admin-unsubscribe')
      ON CONFLICT (email) DO NOTHING
    `
  } catch (err) {
    console.error(`[unsubscribeUser] email_suppression insert failed for ${email.slice(0, 3)}***:`, err)
  }
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

  // Zero-tolerance rule: ANY unsubscribe writes the master blacklist too.
  // Settings-toggle unsubs previously only set nurture_unsubscribed, leaving
  // the user reachable by the prospect/partner lanes (2026-07-05 audit).
  if (updates.nurtureUnsubscribed === true) {
    try {
      await sql`
        INSERT INTO email_suppression (email, reason, source)
        VALUES (${user.email.toLowerCase()}, 'unsubscribed', 'settings-toggle')
        ON CONFLICT (email) DO NOTHING
      `
    } catch (err) {
      console.error(`[updateUserProfile] email_suppression insert failed for ${user.email.slice(0, 3)}***:`, err)
    }
  }

  return { ...user, name: newName, nurtureUnsubscribed: newUnsub, progressEmailsOptedOut: newProgressOptOut }
}
