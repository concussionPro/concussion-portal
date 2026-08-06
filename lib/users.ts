import { sql } from '@/lib/db'
import { CONFIG, roundStartSqlInstant } from '@/lib/config'
import { CRM_PRACTICAL_SLUG } from '@/lib/crm-course'
import { ensureCoursePurchasesTable } from '@/lib/course-purchases'
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
  signupSource?: 'free-course' | 'scat-export' | 'preseason' | 'purchase' | 'admin' | 'squarespace' | 'ai-safety-checklist' | 'sst-clinic' | 'ep-course' | 'intl-syllabus' | 'cpd-tracker'
  convertedFrom?: string  // original signup source before upgrade
  isTest?: boolean
  referenceBookPurchasedAt?: string
  sstEntitledAt?: string
  /**
   * Set when this account's course access came from a CLINIC HUB PACK seat.
   * The pack sells ONLINE seats only — the in-person practical day is a
   * separate A$600 add-on (CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE) — but
   * both hub provisioning paths write access_level 'full-course', which is the
   * repo's marker for "owns a seat at the practical day". This column is the
   * distinct signal: `full-course` still opens every paid ONLINE surface,
   * `hubPackSeatAt != null` says the practical day is NOT held.
   * See holdsPracticalDaySeat() in lib/practical-day-seat.ts.
   */
  hubPackSeatAt?: string
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
  hub_pack_seat_at?: Date | string | null
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
    hubPackSeatAt: row.hub_pack_seat_at
      ? (row.hub_pack_seat_at instanceof Date ? row.hub_pack_seat_at.toISOString() : row.hub_pack_seat_at)
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

/**
 * The user's CURRENT access_level straight from the DB — a cheap indexed
 * single-column select for revocation-aware paid gates. A session JWT lives
 * for 365 days, so a refund/dispute downgrade never reaches the cookie; the
 * highest-value paid surfaces re-check this when (and only when) the session
 * CLAIMS a paid level. Returns null when no row exists or the DB errors —
 * callers fall back to the JWT claim (availability over a hard fail; the
 * webhook downgrade is the enforcement source of truth).
 */
export async function getCurrentAccessLevel(userId: string): Promise<User['accessLevel'] | null> {
  try {
    const { rows } = await sql<{ access_level: User['accessLevel'] }>`
      SELECT access_level FROM users WHERE id = ${userId} LIMIT 1
    `
    return rows[0]?.access_level ?? null
  } catch (err) {
    console.error('[users] getCurrentAccessLevel failed:', err)
    return null
  }
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
    // WHEN the buyer nominated their city (2026-08-05). created_at is the
    // ACCOUNT date, which is wrong for every upgrader: someone who signs up
    // free on day 0 and buys the Complete course on day 56 was, by created_at,
    // past every workshop-email window on the day they paid, and invisible to a
    // round threshold that scopes on created_at >= ROUND_START. This column is
    // stamped whenever workshop_location is actually set/changed.
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS workshop_location_set_at TIMESTAMPTZ`
    // Clinic Hub Pack seat marker (2026-08-06) — see User.hubPackSeatAt. The
    // pack sells ONLINE seats; the practical day is a separate A$600 add-on.
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS hub_pack_seat_at TIMESTAMPTZ`
    // Progress-nudge opt-out (2026-08-06 server-surface audit). updateUserProfile
    // has been WRITING this column since it shipped, but nothing ever created
    // it — production `users` has no `progress_emails_opted_out`. Every PATCH
    // /api/user/profile therefore failed with 42703 and 500'd, which meant the
    // SETTINGS UNSUBSCRIBE TOGGLE HAS NEVER WORKED: the email_suppression
    // insert sits after that UPDATE, so a settings-toggle unsub reached
    // neither the flag nor the master blacklist. Unsubs are zero-tolerance.
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS progress_emails_opted_out BOOLEAN NOT NULL DEFAULT false`
  } catch (err) {
    // A transient failure (lock/statement timeout) on an early ALTER used to
    // skip every later one silently AND still latch columnMigrated=true, so
    // the process spent its whole life 42703-ing with no clue why. Log it and
    // leave the flag unset so the next call retries.
    console.error('[users] ensureColumns migration failed — will retry:', err)
    return
  }
  await backfillHubPackSeats()
  columnMigrated = true
}

/**
 * Mark hub-pack rows that were provisioned BEFORE the marker existed.
 *
 * Deliberately NOT a downgrade: access_level is untouched, so every member
 * keeps the online course they paid for. All this does is stop those rows
 * claiming a practical-day seat they never bought.
 *
 * Two guards keep a genuine Complete buyer who also sits in a clinic hub from
 * being mis-marked:
 *   - `hub_pack_seat_at IS NULL` — never re-stamp (idempotent, and a manual
 *     $600 add-on sale clears it permanently via /api/admin/update-user-access);
 *   - `NOT EXISTS course_purchases` — the hub path writes no purchase row
 *     (app/api/webhooks/stripe/route.ts returns before recordCoursePurchase),
 *     so anyone holding ANY purchase row bought something in their own right
 *     and is left alone.
 * Best-effort: the hub tables are created lazily and may not exist yet.
 */
async function backfillHubPackSeats(): Promise<void> {
  try {
    await sql`
      UPDATE users u
      SET hub_pack_seat_at = m.created_at
      FROM course_hub_members m
      WHERE LOWER(u.email) = LOWER(m.email)
        AND u.hub_pack_seat_at IS NULL
        AND u.access_level = 'full-course'
        AND NOT EXISTS (
          SELECT 1 FROM course_purchases cp WHERE LOWER(cp.user_email) = LOWER(u.email)
        )
    `
  } catch {
    // course_hub_members / course_purchases not created yet — nothing to backfill.
  }
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
  signupSource?: 'free-course' | 'scat-export' | 'preseason' | 'purchase' | 'admin' | 'squarespace' | 'ai-safety-checklist' | 'sst-clinic' | 'ep-course' | 'intl-syllabus' | 'cpd-tracker'
  /** prospect_clinics.slug if this signup came from the cold sequence via ?prospect= param */
  sourceProspectSlug?: string
  /**
   * True when this provisioning is a CLINIC HUB PACK seat — online entitlement
   * with NO practical-day seat. Stamps User.hubPackSeatAt. Sticky like every
   * other marker here: once set it is only cleared by an explicit practical-day
   * grant (/api/admin/update-user-access), never by a later hub re-redeem.
   */
  hubPackSeat?: boolean
}): Promise<string> {
  await ensureColumns()
  await ensureEmailIndex()

  const id = crypto.randomBytes(16).toString('hex')

  // Atomic upsert: INSERT or update on conflict
  // ON CONFLICT uses the unique index on LOWER(email)
  const { rows } = await sql`
    INSERT INTO users (id, email, name, access_level, created_at, squarespace_order_id, stripe_customer_id, stripe_subscription_id, workshop_location, workshop_location_set_at, signup_source, converted_from, source_prospect_slug, hub_pack_seat_at)
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
      ${data.workshopLocation ? new Date().toISOString() : null},
      ${data.signupSource || null},
      ${null},
      ${data.sourceProspectSlug || null},
      ${data.hubPackSeat ? new Date().toISOString() : null}
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
      -- Stamp the nomination time whenever a city is ACTUALLY set or changed.
      -- This is the date the workshop lanes and the round threshold read for
      -- an upgrader whose account long predates the purchase.
      workshop_location_set_at = CASE
        WHEN EXCLUDED.workshop_location IS NOT NULL
          AND EXCLUDED.workshop_location IS DISTINCT FROM users.workshop_location
        THEN EXCLUDED.workshop_location_set_at
        ELSE COALESCE(users.workshop_location_set_at, EXCLUDED.workshop_location_set_at)
      END,
      signup_source = COALESCE(EXCLUDED.signup_source, users.signup_source),
      converted_from = CASE
        WHEN users.signup_source IS NOT NULL AND EXCLUDED.signup_source IS NOT NULL AND users.signup_source != EXCLUDED.signup_source
        THEN COALESCE(users.converted_from, users.signup_source)
        ELSE users.converted_from
      END,
      source_prospect_slug = COALESCE(users.source_prospect_slug, EXCLUDED.source_prospect_slug),
      -- A hub redemption never re-stamps a row that already holds a seat, and
      -- a NON-hub provisioning at 'full-course' (a real Complete purchase, an
      -- admin sale, a Squarespace import) CLEARS the marker — that sale does
      -- buy the practical day, and leaving the marker set would deny the seat
      -- they just paid for.
      hub_pack_seat_at = CASE
        WHEN EXCLUDED.hub_pack_seat_at IS NOT NULL
          THEN COALESCE(users.hub_pack_seat_at, EXCLUDED.hub_pack_seat_at)
        WHEN EXCLUDED.access_level = 'full-course' THEN NULL
        ELSE users.hub_pack_seat_at
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

/**
 * course_purchases slugs the CCM Complete/workshop sale writes: 'ccm-complete'
 * on the first purchase (including an online-only → Complete UPGRADE) and
 * 'ccm-complete-repeat-<session>' when an existing full-course buyer nominates
 * a new round. The LIKE prefix covers both. 'ccm-online' is deliberately
 * excluded — it buys no practical-day seat.
 */
const CCM_COMPLETE_SLUG_PREFIX = 'ccm-complete%'

/**
 * One person holding a seat at the practical day, and which stream sold it.
 *
 * `registeredAt` is the PURCHASE time, never the account-creation time. In
 * priority order:
 *   1. course_purchases 'crm-practical'   — the CRM seat sale;
 *   2. course_purchases 'ccm-complete%'   — the CCM Complete sale, INCLUDING an
 *      online-only → Complete upgrade and a repeat-round nomination;
 *   3. users.workshop_location_set_at     — the nomination itself, for seats
 *      set outside a Stripe purchase (admin grant, /api/workshop/nominate);
 *   4. users.created_at                   — legacy rows that predate all three.
 *
 * created_at alone was WRONG for every upgrader (2026-08-05): a free lead from
 * day 0 who buys the Complete course on day 56 has an account date months
 * before the round they just paid to attend, so a round scoped on created_at
 * dropped them from the count, the registrant table and /admin/ready-to-train
 * — while course_purchases held the correct date all along.
 */
export interface PracticalDayAttendee {
  id: string
  name: string
  email: string
  registeredAt: string
  stream: 'ccm' | 'crm'
}

/**
 * THE roster for the SHARED CCM/CRM practical day (single source of truth).
 *
 * The in-person day is explicitly shared between the two streams
 * (lib/crm-course.ts), and CRM checkout REQUIRES a city — so a CRM
 * Complete/upgrade buyer has PAID for a seat. But their CCM `access_level`
 * stays 'preview' by design (the streams are isolated), so every historical
 * `access_level = 'full-course'` seat query counted zero of them: invisible on
 * the seat board, absent from the confirmation threshold, missing from the
 * roster Zac reads names off on the day, and simultaneously dunned to buy the
 * seat they already own.
 *
 * Union of:
 *   (a) users with access_level 'full-course' nominated to this city, and
 *   (b) owners of course_purchases slug 'crm-practical' nominated to this city.
 *
 * Same PAID-registrant filter as before for both: internal/test accounts
 * (is_test) and comped access (signup_source 'alumni-grant') never move a
 * threshold or occupy a paid seat. Same round scoping too — a past-round
 * attendee must not consume the active round's capacity.
 */
export async function practicalDayAttendees(location: string): Promise<PracticalDayAttendee[]> {
  await ensureCoursePurchasesTable()
  // 00:00 Australian Eastern on the round-start date, as an explicit-UTC
  // instant. The bare 'YYYY-MM-DD' used to be handed straight to Postgres,
  // which resolved it against the server's TimeZone setting while
  // lib/workshop-alumni.ts read the same string as UTC midnight in JS — so the
  // seat counter and the alumni classifier could put a buyer in different
  // rounds. Both now call the same helper (lib/config.ts).
  const roundStart = roundStartSqlInstant(location)
  const { rows } = roundStart
    ? await sql<PracticalDayAttendeeRow>`
        SELECT DISTINCT ON (u.id)
          u.id, u.name, u.email,
          COALESCE(
            cp.purchased_at,
            (SELECT MAX(c2.purchased_at) FROM course_purchases c2
              WHERE LOWER(c2.user_email) = LOWER(u.email)
                AND c2.course_slug LIKE ${CCM_COMPLETE_SLUG_PREFIX}),
            u.workshop_location_set_at,
            u.created_at
          ) AS registered_at,
          CASE WHEN u.access_level = 'full-course' AND u.hub_pack_seat_at IS NULL THEN 'ccm' ELSE 'crm' END AS stream
        FROM users u
        LEFT JOIN course_purchases cp
          ON LOWER(cp.user_email) = LOWER(u.email)
         AND cp.course_slug = ${CRM_PRACTICAL_SLUG}
        WHERE u.workshop_location = ${location}
          AND ((u.access_level = 'full-course' AND u.hub_pack_seat_at IS NULL) OR cp.id IS NOT NULL)
          AND COALESCE(
            cp.purchased_at,
            (SELECT MAX(c2.purchased_at) FROM course_purchases c2
              WHERE LOWER(c2.user_email) = LOWER(u.email)
                AND c2.course_slug LIKE ${CCM_COMPLETE_SLUG_PREFIX}),
            u.workshop_location_set_at,
            u.created_at
          ) >= ${roundStart}
          AND u.is_test IS NOT TRUE
          AND COALESCE(u.signup_source, '') <> ${COMP_SOURCE}
        ORDER BY u.id, registered_at DESC
      `
    : await sql<PracticalDayAttendeeRow>`
        SELECT DISTINCT ON (u.id)
          u.id, u.name, u.email,
          COALESCE(
            cp.purchased_at,
            (SELECT MAX(c2.purchased_at) FROM course_purchases c2
              WHERE LOWER(c2.user_email) = LOWER(u.email)
                AND c2.course_slug LIKE ${CCM_COMPLETE_SLUG_PREFIX}),
            u.workshop_location_set_at,
            u.created_at
          ) AS registered_at,
          CASE WHEN u.access_level = 'full-course' AND u.hub_pack_seat_at IS NULL THEN 'ccm' ELSE 'crm' END AS stream
        FROM users u
        LEFT JOIN course_purchases cp
          ON LOWER(cp.user_email) = LOWER(u.email)
         AND cp.course_slug = ${CRM_PRACTICAL_SLUG}
        WHERE u.workshop_location = ${location}
          AND ((u.access_level = 'full-course' AND u.hub_pack_seat_at IS NULL) OR cp.id IS NOT NULL)
          AND u.is_test IS NOT TRUE
          AND COALESCE(u.signup_source, '') <> ${COMP_SOURCE}
        ORDER BY u.id, registered_at DESC
      `
  return rows.map(toAttendee).sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
}

interface PracticalDayAttendeeRow {
  id: string
  name: string
  email: string
  registered_at: Date | string
  stream: 'ccm' | 'crm'
}

function toAttendee(r: PracticalDayAttendeeRow): PracticalDayAttendee {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    registeredAt: r.registered_at instanceof Date ? r.registered_at.toISOString() : r.registered_at,
    stream: r.stream,
  }
}

// Count paid seats at a location's practical day — feeds
// CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD. Both streams count: the day is
// shared, so a CRM seat fills the room exactly like a CCM one.
export async function getEnrollmentCount(location: string): Promise<number> {
  return (await practicalDayAttendees(location)).length
}

// The registrant roster for a location (admin dashboard). Same helper as the
// count, so the board's number and its table can never disagree again.
export async function getEnrollmentsByLocation(
  location: string,
): Promise<Array<{ name: string; email: string; createdAt: string; stream: 'ccm' | 'crm' }>> {
  const attendees = await practicalDayAttendees(location)
  return attendees.map((a) => ({
    name: a.name,
    email: a.email,
    createdAt: a.registeredAt,
    stream: a.stream,
  }))
}

// PAID practical-day seats with NO workshop location — legacy/manual sales
// without a city (and any CRM seat whose nomination never landed on the users
// row). Excludes internal (is_test) and comped accounts: the board labels
// these "Paid Registrants", so only genuinely paid rows may appear.
export async function getEnrollmentsWithoutLocation(): Promise<
  Array<{ name: string; email: string; createdAt: string; stream: 'ccm' | 'crm' }>
> {
  await ensureCoursePurchasesTable()
  const { rows } = await sql<PracticalDayAttendeeRow>`
    SELECT DISTINCT ON (u.id)
      u.id, u.name, u.email,
      COALESCE(
        cp.purchased_at,
        (SELECT MAX(c2.purchased_at) FROM course_purchases c2
          WHERE LOWER(c2.user_email) = LOWER(u.email)
            AND c2.course_slug LIKE ${CCM_COMPLETE_SLUG_PREFIX}),
        u.workshop_location_set_at,
        u.created_at
      ) AS registered_at,
      CASE WHEN u.access_level = 'full-course' AND u.hub_pack_seat_at IS NULL THEN 'ccm' ELSE 'crm' END AS stream
    FROM users u
    LEFT JOIN course_purchases cp
      ON LOWER(cp.user_email) = LOWER(u.email)
     AND cp.course_slug = ${CRM_PRACTICAL_SLUG}
    WHERE u.workshop_location IS NULL
      AND ((u.access_level = 'full-course' AND u.hub_pack_seat_at IS NULL) OR cp.id IS NOT NULL)
      AND u.is_test IS NOT TRUE
      AND COALESCE(u.signup_source, '') <> ${COMP_SOURCE}
    ORDER BY u.id, registered_at DESC
  `
  return rows
    .map(toAttendee)
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
    .map((a) => ({ name: a.name, email: a.email, createdAt: a.registeredAt, stream: a.stream }))
}

/**
 * email (lowercased) → ISO timestamp the user ENROLLED for a practical day.
 *
 * Same priority chain as practicalDayAttendees.registeredAt, loaded in one
 * query so a per-run cron can key its workshop lanes on the PURCHASE date
 * instead of users.created_at. Without it, the day-1 reservation email and the
 * momentum sequence both measured "days since signup" from the account date —
 * so a free lead who upgraded on day 56 was past every window on the day they
 * paid $693, and received none of the workshop emails they had just bought
 * their way into.
 *
 * Returns an empty map on failure: callers fall back to created_at, which is
 * exactly the pre-fix behaviour (never a wrong send, just the old one).
 */
export async function loadWorkshopEnrolmentDates(): Promise<Map<string, string>> {
  try {
    await ensureColumns()
    await ensureCoursePurchasesTable()
    const { rows } = await sql<{ email: string; enrolled_at: Date | string }>`
      SELECT LOWER(u.email) AS email,
             COALESCE(
               (SELECT MAX(c.purchased_at) FROM course_purchases c
                 WHERE LOWER(c.user_email) = LOWER(u.email)
                   AND (c.course_slug = ${CRM_PRACTICAL_SLUG} OR c.course_slug LIKE ${CCM_COMPLETE_SLUG_PREFIX})),
               u.workshop_location_set_at
             ) AS enrolled_at
      FROM users u
      WHERE u.workshop_location IS NOT NULL
    `
    const map = new Map<string, string>()
    for (const r of rows) {
      if (!r.enrolled_at) continue
      map.set(
        r.email,
        r.enrolled_at instanceof Date ? r.enrolled_at.toISOString() : String(r.enrolled_at),
      )
    }
    return map
  } catch (err) {
    console.error('[users] loadWorkshopEnrolmentDates failed — falling back to created_at:', err)
    return new Map()
  }
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
  // This write MUST NOT be swallowed. email_suppression is the master
  // blacklist; nurture_unsubscribed above only covers the users-table lanes.
  // Catching here meant a transient DB error left the address unsubscribed
  // from nurture but still fully reachable by the prospect, partner,
  // acc-followup, aus-neuro and workshop-date-float engines — forever, and
  // with the caller told it had succeeded. Unsubs are zero-tolerance, so the
  // failure propagates: /api/unsubscribe already turns a throw into an honest
  // "we could not process your unsubscribe" page with the manual fallback.
  await sql`
    INSERT INTO email_suppression (email, reason, source)
    VALUES (${email.toLowerCase()}, 'unsubscribed', 'admin-unsubscribe')
    ON CONFLICT (email) DO NOTHING
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

  // This function writes progress_emails_opted_out, so it must be the thing
  // that guarantees the column exists — findUserById does not run the
  // migration (2026-08-06 audit: the column was never created anywhere, so
  // every call 42703'd and 500'd the settings page).
  await ensureColumns()

  // SUPPRESSION FIRST. The master-blacklist write used to sit AFTER the UPDATE
  // above, so any failure in the users write — which is exactly what was
  // happening — swallowed the unsubscribe entirely: the user was told nothing,
  // the flag never set, and the address stayed reachable by every cold lane.
  // Zero-tolerance means the blacklist write must not be downstream of
  // anything that can fail. Not swallowed, for the same reason as
  // unsubscribeUser(): reporting a successful opt-out while the blacklist
  // write failed is how a suppressed address keeps receiving cold outreach.
  if (updates.nurtureUnsubscribed === true) {
    await sql`
      INSERT INTO email_suppression (email, reason, source)
      VALUES (${user.email.toLowerCase()}, 'unsubscribed', 'settings-toggle')
      ON CONFLICT (email) DO NOTHING
    `
  }

  await sql`
    UPDATE users SET name = ${newName}, nurture_unsubscribed = ${newUnsub}, progress_emails_opted_out = ${newProgressOptOut} WHERE id = ${userId}
  `

  return { ...user, name: newName, nurtureUnsubscribed: newUnsub, progressEmailsOptedOut: newProgressOptOut }
}
