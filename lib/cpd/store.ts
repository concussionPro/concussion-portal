/**
 * CPD Tracker persistence — follows the repo's lazy ensure-tables pattern
 * (lib/rtp/store.ts). Structural boundary (spec §0): this module never
 * imports SST patient/session models and holds ZERO patient data — CPD
 * records are the practitioner's own professional data.
 *
 * Evidence files: base64 in Postgres with a 5 MB cap (no blob store exists
 * in this repo — the first upload path; content-addressed via sha256 for
 * immutability checks, per spec §3).
 */

import { sql } from '@/lib/db'

export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024
export const EVIDENCE_MIME_ALLOWLIST = ['application/pdf', 'image/jpeg', 'image/png']

/**
 * Evidence kinds — the credential file (owner research 2026-08-03): the
 * audit pack schemes actually ask for is per-practitioner registration +
 * indemnity + CPD + orientation/training + supervision records, not a CPD
 * dashboard. 'activity' = CPD evidence attached to a logged activity; the
 * rest are standalone credential documents in the same vault.
 */
export const EVIDENCE_KINDS = [
  'activity',
  'registration-cert',
  'indemnity',
  'orientation',
  'training',
  'supervision',
] as const
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number]

let tablesReady = false

export async function ensureCpdTables(): Promise<void> {
  if (tablesReady) return
  await sql`
    CREATE TABLE IF NOT EXISTS cpd_registrations (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      pack_id TEXT NOT NULL,
      reg_number TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (user_email, pack_id)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS cpd_activities (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      title TEXT NOT NULL,
      activity_date DATE NOT NULL,
      hours NUMERIC(6,2) NOT NULL,
      points NUMERIC(6,2),
      categories JSONB NOT NULL DEFAULT '[]'::jsonb,
      provider TEXT,
      notes TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS cpd_activities_user_idx ON cpd_activities (user_email, activity_date)`
  await sql`
    CREATE TABLE IF NOT EXISTS cpd_evidence_files (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      activity_id INTEGER REFERENCES cpd_activities(id) ON DELETE SET NULL,
      filename TEXT NOT NULL,
      mime TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      data_base64 TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS cpd_evidence_user_idx ON cpd_evidence_files (user_email)`
  // Credential-file columns (additive; repo ALTER-IF-NOT-EXISTS pattern).
  await sql`ALTER TABLE cpd_evidence_files ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'activity'`
  await sql`ALTER TABLE cpd_evidence_files ADD COLUMN IF NOT EXISTS expiry_date DATE`
  tablesReady = true
}

export interface CpdRegistrationRow {
  id: number
  packId: string
  regNumber: string | null
}

export interface CpdActivityRow {
  id: number
  title: string
  date: string
  hours: number
  points: number | null
  categories: string[]
  provider: string | null
  notes: string | null
  source: string
  status: 'draft' | 'confirmed'
  evidenceIds: number[]
}

export async function listRegistrations(email: string): Promise<CpdRegistrationRow[]> {
  await ensureCpdTables()
  const { rows } = await sql`
    SELECT id, pack_id, reg_number FROM cpd_registrations
    WHERE user_email = ${email} ORDER BY id
  `
  return rows.map((r) => ({ id: r.id, packId: r.pack_id, regNumber: r.reg_number }))
}

export async function addRegistration(
  email: string,
  packId: string,
  regNumber: string | null,
): Promise<void> {
  await ensureCpdTables()
  await sql`
    INSERT INTO cpd_registrations (user_email, pack_id, reg_number)
    VALUES (${email}, ${packId}, ${regNumber})
    ON CONFLICT (user_email, pack_id)
    DO UPDATE SET reg_number = COALESCE(EXCLUDED.reg_number, cpd_registrations.reg_number)
  `
}

export async function removeRegistration(email: string, packId: string): Promise<void> {
  await ensureCpdTables()
  await sql`DELETE FROM cpd_registrations WHERE user_email = ${email} AND pack_id = ${packId}`
}

export async function listActivities(email: string): Promise<CpdActivityRow[]> {
  await ensureCpdTables()
  const { rows } = await sql`
    SELECT a.id, a.title, a.activity_date::text AS date, a.hours, a.points, a.categories,
           a.provider, a.notes, a.source, a.status,
           COALESCE(json_agg(e.id) FILTER (WHERE e.id IS NOT NULL), '[]') AS evidence_ids
    FROM cpd_activities a
    LEFT JOIN cpd_evidence_files e ON e.activity_id = a.id
    WHERE a.user_email = ${email}
    GROUP BY a.id
    ORDER BY a.activity_date DESC, a.id DESC
  `
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    date: r.date,
    hours: Number(r.hours),
    points: r.points === null ? null : Number(r.points),
    categories: Array.isArray(r.categories) ? r.categories : [],
    provider: r.provider,
    notes: r.notes,
    source: r.source,
    status: r.status,
    evidenceIds: Array.isArray(r.evidence_ids) ? r.evidence_ids : [],
  }))
}

export async function addActivity(
  email: string,
  a: {
    title: string
    date: string
    hours: number
    points?: number | null
    categories: string[]
    provider?: string | null
    notes?: string | null
    source?: string
  },
): Promise<number> {
  await ensureCpdTables()
  const { rows } = await sql`
    INSERT INTO cpd_activities
      (user_email, title, activity_date, hours, points, categories, provider, notes, source, status)
    VALUES
      (${email}, ${a.title}, ${a.date}, ${a.hours}, ${a.points ?? null},
       ${JSON.stringify(a.categories)}::jsonb, ${a.provider ?? null}, ${a.notes ?? null},
       ${a.source ?? 'manual'}, 'confirmed')
    RETURNING id
  `
  return rows[0].id
}

export async function deleteActivity(email: string, id: number): Promise<boolean> {
  await ensureCpdTables()
  const { rowCount } = await sql`
    DELETE FROM cpd_activities WHERE id = ${id} AND user_email = ${email}
  `
  return (rowCount ?? 0) > 0
}

export async function addEvidence(
  email: string,
  f: {
    activityId: number | null
    filename: string
    mime: string
    sha256: string
    dataBase64: string
    kind?: EvidenceKind
    expiryDate?: string | null
  },
): Promise<number> {
  await ensureCpdTables()
  const sizeBytes = Math.floor((f.dataBase64.length * 3) / 4)
  const { rows } = await sql`
    INSERT INTO cpd_evidence_files (user_email, activity_id, filename, mime, size_bytes, sha256, data_base64, kind, expiry_date)
    VALUES (${email}, ${f.activityId}, ${f.filename}, ${f.mime}, ${sizeBytes}, ${f.sha256}, ${f.dataBase64},
            ${f.kind ?? 'activity'}, ${f.expiryDate ?? null})
    RETURNING id
  `
  return rows[0].id
}

export interface CredentialDocRow {
  id: number
  kind: EvidenceKind
  filename: string
  expiryDate: string | null
  createdAt: string
}

/** Standalone credential documents (everything except activity-attached CPD
 *  evidence) — the per-practitioner credential file. */
export async function listCredentialDocs(email: string): Promise<CredentialDocRow[]> {
  await ensureCpdTables()
  const { rows } = await sql`
    SELECT id, kind, filename, expiry_date::text AS expiry_date, created_at::text AS created_at
    FROM cpd_evidence_files
    WHERE user_email = ${email} AND kind <> 'activity'
    ORDER BY kind, created_at DESC
  `
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    filename: r.filename,
    expiryDate: r.expiry_date,
    createdAt: r.created_at,
  }))
}

export async function getEvidence(
  email: string,
  id: number,
): Promise<{ filename: string; mime: string; dataBase64: string } | null> {
  await ensureCpdTables()
  const { rows } = await sql`
    SELECT filename, mime, data_base64 FROM cpd_evidence_files
    WHERE id = ${id} AND user_email = ${email}
  `
  if (rows.length === 0) return null
  return { filename: rows[0].filename, mime: rows[0].mime, dataBase64: rows[0].data_base64 }
}
