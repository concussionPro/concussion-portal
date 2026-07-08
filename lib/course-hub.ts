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

export async function getCourseHub(code: string): Promise<CourseHub | null> {
  await ensureHubTables()
  const norm = code.trim().toUpperCase()
  const { rows } = await sql<{
    code: string; owner_email: string; clinic_name: string | null; clinician_seats: number; admin_seats: number
  }>`
    SELECT code, owner_email, clinic_name, clinician_seats, admin_seats
    FROM course_hubs WHERE code = ${norm}
  `
  const r = rows[0]
  if (!r) return null
  return { code: r.code, ownerEmail: r.owner_email, clinicName: r.clinic_name, clinicianSeats: r.clinician_seats, adminSeats: r.admin_seats }
}

export async function getHubByOwner(email: string): Promise<CourseHub | null> {
  await ensureHubTables()
  const { rows } = await sql<{
    code: string; owner_email: string; clinic_name: string | null; clinician_seats: number; admin_seats: number
  }>`
    SELECT code, owner_email, clinic_name, clinician_seats, admin_seats
    FROM course_hubs WHERE owner_email = ${email.toLowerCase()} ORDER BY created_at DESC LIMIT 1
  `
  const r = rows[0]
  if (!r) return null
  return { code: r.code, ownerEmail: r.owner_email, clinicName: r.clinic_name, clinicianSeats: r.clinician_seats, adminSeats: r.admin_seats }
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
  if (!hub) return 'no-hub'

  // Already redeemed on this key → idempotent success (not a new seat, no leak).
  const { rows: existing } = await sql`
    SELECT 1 FROM course_hub_members WHERE hub_code = ${norm} AND email = ${em}
  `
  if (existing.length > 0) return 'already'

  // Guarded atomic insert: only if this role's used-count is still under its cap.
  const { rows: inserted } = await sql<{ email: string }>`
    INSERT INTO course_hub_members (hub_code, email, name, role)
    SELECT ${norm}, ${em}, ${name}, ${role}
    FROM course_hubs h
    WHERE h.code = ${norm}
      AND (
        SELECT COUNT(*) FROM course_hub_members m
        WHERE m.hub_code = ${norm} AND m.role = ${role}
      ) < (CASE WHEN ${role} = 'admin' THEN h.admin_seats ELSE h.clinician_seats END)
    ON CONFLICT (hub_code, email) DO NOTHING
    RETURNING email
  `
  return inserted.length > 0 ? 'ok' : 'full'
}
