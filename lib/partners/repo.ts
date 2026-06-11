/**
 * Postgres-backed repository for the Concussion Care PARTNERSHIP arm.
 *
 * Fully isolated from the cold-clinic outreach engine (lib/prospect/*):
 * its own table (`partner_institutions`), its own access keys, no shared
 * mutation paths. Nothing here sends email or touches the clinic funnel.
 *
 * Server-only — never import from a client component.
 */
import 'server-only'
import { sql } from '@vercel/postgres'
import { kebabCase, generateAccessKey, tierForType } from './helpers'
import type { PartnerType, PartnerStatus } from './helpers'
import { PARTNER_SEED } from './seed-data'

export interface PartnerInstitution {
  id: number
  slug: string
  name: string
  type: PartnerType
  tier: number
  region: string
  association: string | null
  contactName: string | null
  contactEmail: string | null
  contactRole: string | null
  accessKey: string
  status: PartnerStatus
  notes: string | null
  createdAt: Date
}

interface DbPartnerRow {
  id: number
  slug: string
  name: string
  type: string
  tier: number
  region: string
  association: string | null
  contact_name: string | null
  contact_email: string | null
  contact_role: string | null
  access_key: string
  status: string
  notes: string | null
  created_at: Date
}

function mapRow(row: DbPartnerRow): PartnerInstitution {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type as PartnerType,
    tier: row.tier,
    region: row.region,
    association: row.association,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactRole: row.contact_role,
    accessKey: row.access_key,
    status: row.status as PartnerStatus,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

/** Idempotent table creation — safe to call on every request. */
export async function ensurePartnerTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS partner_institutions (
      id            SERIAL PRIMARY KEY,
      slug          TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      type          TEXT NOT NULL,
      tier          INT NOT NULL,
      region        TEXT,
      association   TEXT,
      contact_name  TEXT,
      contact_email TEXT,
      contact_role  TEXT,
      access_key    TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'lead',
      notes         TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
}

/**
 * Seed the SOM list. Creates the table then UPSERTs every seed row with
 * ON CONFLICT (slug) DO NOTHING, so re-runs are idempotent (existing rows
 * — including any Zac has edited — are left untouched).
 * Returns { created, total }.
 */
export async function seedPartners(): Promise<{ created: number; total: number }> {
  await ensurePartnerTable()

  const payload = PARTNER_SEED.map((s) => ({
    slug: kebabCase(s.name),
    name: s.name,
    type: s.type,
    tier: tierForType(s.type),
    region: s.region,
    association: s.association,
    access_key: generateAccessKey(),
    notes: s.notes ?? null,
  }))

  const { rowCount } = await sql`
    INSERT INTO partner_institutions
      (slug, name, type, tier, region, association, access_key, notes)
    SELECT
      (elem->>'slug')::text,
      (elem->>'name')::text,
      (elem->>'type')::text,
      (elem->>'tier')::int,
      (elem->>'region')::text,
      (elem->>'association')::text,
      (elem->>'access_key')::text,
      (elem->>'notes')::text
    FROM jsonb_array_elements(${JSON.stringify(payload)}::jsonb) AS elem
    ON CONFLICT (slug) DO NOTHING
  `

  return { created: rowCount ?? 0, total: PARTNER_SEED.length }
}

export async function getPartnerBySlug(slug: string): Promise<PartnerInstitution | null> {
  await ensurePartnerTable()
  const { rows } = await sql<DbPartnerRow>`
    SELECT * FROM partner_institutions WHERE slug = ${slug} LIMIT 1
  `
  return rows[0] ? mapRow(rows[0]) : null
}

export async function listPartners(): Promise<PartnerInstitution[]> {
  await ensurePartnerTable()
  const { rows } = await sql<DbPartnerRow>`
    SELECT * FROM partner_institutions ORDER BY tier ASC, name ASC
  `
  return rows.map(mapRow)
}

export interface PartnerUpdateInput {
  status?: PartnerStatus
  contactName?: string | null
  contactEmail?: string | null
  contactRole?: string | null
}

/**
 * Patch mutable fields (status + contact details) on one institution.
 * Only provided fields are written; COALESCE keeps the existing value when
 * a field is omitted. Returns the updated row, or null if id not found.
 */
export async function updatePartner(
  id: number,
  input: PartnerUpdateInput,
): Promise<PartnerInstitution | null> {
  await ensurePartnerTable()
  // COALESCE(newValue, column) — an omitted field arrives as null and keeps
  // the existing value; a provided string (including '') overwrites it.
  const { rows } = await sql<DbPartnerRow>`
    UPDATE partner_institutions SET
      status        = COALESCE(${input.status ?? null}, status),
      contact_name  = COALESCE(${input.contactName ?? null}, contact_name),
      contact_email = COALESCE(${input.contactEmail ?? null}, contact_email),
      contact_role  = COALESCE(${input.contactRole ?? null}, contact_role)
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0] ? mapRow(rows[0]) : null
}
