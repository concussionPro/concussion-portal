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

// ─────────────────────────────────────────────────────────────────────────────
// PARTNER PORTAL ENGAGEMENT — mirror of prospect_portal_views, keyed to
// partner_institutions. Lets the partnerships analytics show real engagement
// (views / sections / CTA clicks / dwell / last-seen), not just send counts.
// (Zac 2026-06-27 — sweep all outreach tracking into analytics.)
// ─────────────────────────────────────────────────────────────────────────────

/** Idempotent — safe to call on every request (matches ensurePartnerTable). */
export async function ensurePartnerViewsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS partner_portal_views (
      id               SERIAL PRIMARY KEY,
      partner_id       INT NOT NULL,
      viewer_ip        TEXT,
      user_agent       TEXT,
      section_visited  TEXT,
      interaction_type TEXT NOT NULL DEFAULT 'view',
      target           TEXT,
      dwell_ms         INT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS partner_portal_views_partner_idx ON partner_portal_views (partner_id)`
}

/** Log one partner-portal interaction (server 'view' or client section/CTA/exit). */
export async function recordPartnerView(input: {
  partnerId: number
  viewerIp?: string
  userAgent?: string
  section: string
  interactionType?: 'view' | 'section_view' | 'cta_click' | 'exit'
  target?: string
  dwellMs?: number
}): Promise<void> {
  await ensurePartnerViewsTable()
  await sql`
    INSERT INTO partner_portal_views
      (partner_id, viewer_ip, user_agent, section_visited, interaction_type, target, dwell_ms)
    VALUES
      (${input.partnerId}, ${input.viewerIp ?? null}, ${input.userAgent ?? null},
       ${input.section}, ${input.interactionType ?? 'view'}, ${input.target ?? null}, ${input.dwellMs ?? null})
  `
}

export interface PartnerEngagement {
  partnerId: number
  views: number          // non-bot view + section_view events
  ctaClicks: number
  avgDwellMs: number | null
  lastViewedAt: string | null
  topSection: string | null
}

// Mirror of the prospect-engagement bot filter so scanner hits don't inflate.
const PARTNER_BOT_REGEX = 'bot|crawl|spider|slurp|bingpreview|mediapartners|facebookexternalhit|microsoft|defender|mimecast|proofpoint|barracuda|safelinks|preview|monitor|curl|wget|python|headless|phantom|scan'

/** Per-partner engagement rollup for the partnerships analytics segment. */
export async function getPartnerEngagement(): Promise<Map<number, PartnerEngagement>> {
  await ensurePartnerViewsTable()
  const { rows } = await sql<{
    partner_id: number; views: number; cta_clicks: number; avg_dwell_ms: number | null; last_viewed_at: string | null; top_section: string | null
  }>`
    WITH human AS (
      SELECT * FROM partner_portal_views
      WHERE COALESCE(user_agent, '') !~* ${PARTNER_BOT_REGEX}
    )
    SELECT
      partner_id,
      COUNT(*) FILTER (WHERE interaction_type IN ('view','section_view'))::int AS views,
      COUNT(*) FILTER (WHERE interaction_type = 'cta_click')::int AS cta_clicks,
      AVG(dwell_ms) FILTER (WHERE interaction_type = 'exit')::int AS avg_dwell_ms,
      MAX(created_at)::text AS last_viewed_at,
      (SELECT section_visited FROM human h2 WHERE h2.partner_id = h.partner_id
         AND interaction_type IN ('view','section_view')
       GROUP BY section_visited ORDER BY COUNT(*) DESC LIMIT 1) AS top_section
    FROM human h
    GROUP BY partner_id
  `
  const map = new Map<number, PartnerEngagement>()
  for (const r of rows) {
    map.set(r.partner_id, {
      partnerId: r.partner_id,
      views: r.views ?? 0,
      ctaClicks: r.cta_clicks ?? 0,
      avgDwellMs: r.avg_dwell_ms ?? null,
      lastViewedAt: r.last_viewed_at ?? null,
      topSection: r.top_section ?? null,
    })
  }
  return map
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
