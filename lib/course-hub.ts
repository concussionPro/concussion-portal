import { sql } from '@/lib/db'
import crypto from 'crypto'

/**
 * Course Hub = a clinic's "full clinic access" purchase. The buyer declares a
 * clinician headcount at checkout; that becomes the KEY'S HARD SEAT CAP. The
 * buyer forwards the key to their team; each member redeems it ONCE for their
 * own login. When the seats are used the key is dead — so it cannot leak access
 * beyond the paid team (owner 2026-07-08: "do NOT leak access ANYWHERE").
 *
 * Redeemed members are provisioned at real `full-course` access via createUser —
 * the EXACT existing suite, no parallel/mock product.
 */

export interface CourseHub {
  code: string
  ownerEmail: string
  clinicName: string | null
  clinicianSeats: number
  adminSeats: number
  /** Set when the purchase was refunded/disputed — a revoked key redeems nothing. */
  revokedAt: string | null
}

export interface HubUsage {
  clinicianUsed: number
  adminUsed: number
  clinicianSeats: number
  adminSeats: number
}

export type HubRole = 'clinician' | 'admin'
export type RedeemResult = 'ok' | 'already' | 'full' | 'no-hub'

/** Hard ceiling on a hub's clinician headcount. Above this it's the on-site pitch. */
export const HUB_MAX_CLINICIANS = 12
/** Included admin/front-desk seats on top of the clinician seats. */
export const HUB_ADMIN_SEATS = 3

let tablesReady = false
async function ensureHubTables(): Promise<void> {
  if (tablesReady) return
  await sql`
    CREATE TABLE IF NOT EXISTS course_hubs (
      code TEXT PRIMARY KEY,
      owner_email TEXT NOT NULL,
      clinic_name TEXT,
      clinician_seats INT NOT NULL DEFAULT 5,
      admin_seats INT NOT NULL DEFAULT 3,
      stripe_session_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS course_hub_members (
      hub_code TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'clinician',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (hub_code, email)
    )
  `
  // Lazy migration — refund/dispute revocation (2026-08-05).
  await sql`ALTER TABLE course_hubs ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ`
  // Seat-cap race guard (2026-08-05 round-J P0: the INSERT references
  // seat_no — this column/index MUST exist or every redemption 42703s).
  // Concurrent last-seat claimants collide on the partial unique index;
  // legacy NULL rows never collide (NULLs are distinct).
  await sql`ALTER TABLE course_hub_members ADD COLUMN IF NOT EXISTS seat_no INT`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS uniq_hub_member_seat
    ON course_hub_members (hub_code, role, seat_no) WHERE seat_no IS NOT NULL`
  tablesReady = true
}

function genHubCode(): string {
  // Readable, uppercase, unambiguous. e.g. CEA-A1B2-C3D4
  const raw = crypto.randomBytes(6).toString('hex').toUpperCase()
  return `CEA-${raw.slice(0, 4)}-${raw.slice(4, 8)}`
}

/** Clamp a declared clinician headcount to a sane, billable range. */
export function clampClinicianSeats(n: unknown): number {
  const v = Math.floor(Number(n))
  if (!Number.isFinite(v) || v < 1) return 1
  return Math.min(v, HUB_MAX_CLINICIANS)
}

export async function createCourseHub(opts: {
  ownerEmail: string
  clinicName?: string | null
  clinicianSeats: number
  adminSeats?: number
  stripeSessionId?: string
}): Promise<string> {
  await ensureHubTables()
  const code = genHubCode()
  await sql`
    INSERT INTO course_hubs (code, owner_email, clinic_name, clinician_seats, admin_seats, stripe_session_id)
    VALUES (${code}, ${opts.ownerEmail.toLowerCase()}, ${opts.clinicName ?? null},
            ${clampClinicianSeats(opts.clinicianSeats)}, ${opts.adminSeats ?? HUB_ADMIN_SEATS},
            ${opts.stripeSessionId ?? null})
  `
  return code
}

type HubRow = {
  code: string; owner_email: string; clinic_name: string | null; clinician_seats: number; admin_seats: number; revoked_at: string | null
}

function toHub(r: HubRow): CourseHub {
  return { code: r.code, ownerEmail: r.owner_email, clinicName: r.clinic_name, clinicianSeats: r.clinician_seats, adminSeats: r.admin_seats, revokedAt: r.revoked_at }
}

export async function getCourseHub(code: string): Promise<CourseHub | null> {
  await ensureHubTables()
  const norm = code.trim().toUpperCase()
  const { rows } = await sql<HubRow>`
    SELECT code, owner_email, clinic_name, clinician_seats, admin_seats, revoked_at
    FROM course_hubs WHERE code = ${norm}
  `
  return rows[0] ? toHub(rows[0]) : null
}

export async function getHubByOwner(email: string): Promise<CourseHub | null> {
  await ensureHubTables()
  const { rows } = await sql<HubRow>`
    SELECT code, owner_email, clinic_name, clinician_seats, admin_seats, revoked_at
    FROM course_hubs WHERE owner_email = ${email.toLowerCase()} ORDER BY created_at DESC LIMIT 1
  `
  return rows[0] ? toHub(rows[0]) : null
}

/**
 * Revoke a hub after a full refund or dispute — the key stops redeeming
 * immediately (`redeemHubSeat` rejects revoked hubs). Idempotent: returns null
 * when no un-revoked hub matches, so a dispute following a refund is a no-op.
 */
export async function revokeHub(ref: { code?: string; stripeSessionId?: string }): Promise<CourseHub | null> {
  await ensureHubTables()
  if (ref.code) {
    const { rows } = await sql<HubRow>`
      UPDATE course_hubs SET revoked_at = now()
      WHERE revoked_at IS NULL AND code = ${ref.code.trim().toUpperCase()}
      RETURNING code, owner_email, clinic_name, clinician_seats, admin_seats, revoked_at
    `
    return rows[0] ? toHub(rows[0]) : null
  }
  if (ref.stripeSessionId) {
    const { rows } = await sql<HubRow>`
      UPDATE course_hubs SET revoked_at = now()
      WHERE revoked_at IS NULL AND stripe_session_id = ${ref.stripeSessionId}
      RETURNING code, owner_email, clinic_name, clinician_seats, admin_seats, revoked_at
    `
    return rows[0] ? toHub(rows[0]) : null
  }
  return null
}

export async function getHubUsage(code: string): Promise<HubUsage | null> {
  const hub = await getCourseHub(code)
  if (!hub) return null
  const { rows } = await sql<{ role: string; n: number }>`
    SELECT role, COUNT(*)::int AS n FROM course_hub_members WHERE hub_code = ${hub.code} GROUP BY role
  `
  const clinicianUsed = rows.find((r) => r.role === 'clinician')?.n ?? 0
  const adminUsed = rows.find((r) => r.role === 'admin')?.n ?? 0
  return { clinicianUsed, adminUsed, clinicianSeats: hub.clinicianSeats, adminSeats: hub.adminSeats }
}

/** List members for the owner's team view. */
export async function getHubMembers(code: string): Promise<Array<{ email: string; name: string | null; role: string; createdAt: string }>> {
  await ensureHubTables()
  const { rows } = await sql<{ email: string; name: string | null; role: string; created_at: string }>`
    SELECT email, name, role, created_at FROM course_hub_members WHERE hub_code = ${code.trim().toUpperCase()} ORDER BY created_at ASC
  `
  return rows.map((r) => ({ email: r.email, name: r.name, role: r.role, createdAt: r.created_at }))
}

/**
 * Atomically claim a seat. The INSERT is guarded by a count-vs-cap subquery in
 * the SAME statement, so it can NEVER over-allocate past the paid cap — the key
 * stops working the instant seats are exhausted. Idempotent per email.
 */
export async function redeemHubSeat(
  code: string,
  email: string,
  name: string,
  role: HubRole,
): Promise<RedeemResult> {
  await ensureHubTables()
  const norm = code.trim().toUpperCase()
  const em = email.trim().toLowerCase()

  const hub = await getCourseHub(norm)
  // A revoked (refunded/disputed) key must never grant a seat again.
  if (!hub || hub.revokedAt) return 'no-hub'

  // Already redeemed on this key → idempotent success (not a new seat, no leak).
  const { rows: existing } = await sql`
    SELECT 1 FROM course_hub_members WHERE hub_code = ${norm} AND email = ${em}
  `
  if (existing.length > 0) return 'already'

  // Guarded atomic insert with a RACE-PROOF cap (2026-08-05 round-I #7):
  // plain count-vs-cap let two concurrent redemptions of the LAST seat both
  // pass under READ COMMITTED. Each insert claims seat_no = count+1; the
  // partial unique index (hub_code, role, seat_no) makes simultaneous
  // claimants collide — the loser retries and then sees the true count.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { rows: inserted } = await sql<{ email: string }>`
        INSERT INTO course_hub_members (hub_code, email, name, role, seat_no)
        SELECT ${norm}, ${em}, ${name}, ${role},
          (SELECT COUNT(*) + 1 FROM course_hub_members m
            WHERE m.hub_code = ${norm} AND m.role = ${role})
        FROM course_hubs h
        WHERE h.code = ${norm}
          AND h.revoked_at IS NULL
          AND (
            SELECT COUNT(*) FROM course_hub_members m
            WHERE m.hub_code = ${norm} AND m.role = ${role}
          ) < (CASE WHEN ${role} = 'admin' THEN h.admin_seats ELSE h.clinician_seats END)
        ON CONFLICT (hub_code, email) DO NOTHING
        RETURNING email
      `
      return inserted.length > 0 ? 'ok' : 'full'
    } catch (err) {
      if ((err as { code?: string })?.code === '23505') continue // seat_no race — re-count
      throw err
    }
  }
  return 'full'
}
