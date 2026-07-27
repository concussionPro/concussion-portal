/**
 * Per-CLINIC PMS connections — the piece that turns the adapter seam into a
 * product ("API plugin for these providers is better than our dash" — owner,
 * 2026-07-27).
 *
 * The env-based config in deliver.ts is single-tenant (one key per deploy) and
 * stays for dev/demo. Real clinics connect their OWN tenant here: credentials
 * are stored per clinic code, AES-256-GCM encrypted with a key derived from
 * SESSION_SECRET, and resolved into an adapter on demand.
 *
 * GENSOLVE GATE: the Gensolve adapter's WRITE field shapes have never been
 * validated against a live tenant (no public sandbox — per-tenant key + IP
 * whitelist). Connection + patient SEARCH are allowed (read-only, and exactly
 * how validation starts); note/PDF WRITES stay refused until
 * GENSOLVE_UPLOAD_CONFIRMED=true is set after the first partner validation.
 * Cliniko was validated against a live tenant on 2026-07-20 — writes allowed.
 */
import crypto from 'crypto'
import { sql } from '@/lib/db'
import type { PmsAdapter, PmsAdapterConfig, PmsKind } from './adapter'
import { getAdapter } from './adapter'

const PMS_KINDS: PmsKind[] = ['cliniko', 'gensolve']

function keyBytes(): Buffer {
  const secret = process.env.SESSION_SECRET || process.env.MAGIC_LINK_SECRET
  if (!secret) throw new Error('SESSION_SECRET required for PMS credential encryption')
  return crypto.createHash('sha256').update(`pms-cred:${secret}`).digest()
}

export function encryptCred(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBytes(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${enc.toString('base64')}`
}

export function decryptCred(stored: string): string {
  const [ivB64, tagB64, encB64] = stored.split('.')
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBytes(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(encB64, 'base64')), decipher.final()]).toString('utf8')
}

async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS sst_clinic_pms (
      clinic_code TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      api_key_enc TEXT NOT NULL,
      creds JSONB NOT NULL DEFAULT '{}'::jsonb,
      connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_ok_at TIMESTAMPTZ
    )
  `
}

export interface PmsConnection {
  kind: PmsKind
  connectedAt: string
  lastOkAt: string | null
}

export function isPmsKind(v: unknown): v is PmsKind {
  return typeof v === 'string' && (PMS_KINDS as string[]).includes(v)
}

/** Gensolve writes stay OFF until the first partner tenant validates the shapes. */
export function gensolveWritesConfirmed(): boolean {
  return process.env.GENSOLVE_UPLOAD_CONFIRMED === 'true'
}

export async function getPmsConnection(clinicCode: string): Promise<PmsConnection | null> {
  await ensureTable()
  const { rows } = await sql`
    SELECT kind, connected_at, last_ok_at FROM sst_clinic_pms WHERE clinic_code = ${clinicCode.toUpperCase()}
  `
  if (!rows.length || !isPmsKind(rows[0].kind)) return null
  return {
    kind: rows[0].kind as PmsKind,
    connectedAt: String(rows[0].connected_at),
    lastOkAt: rows[0].last_ok_at ? String(rows[0].last_ok_at) : null,
  }
}

export async function setPmsConnection(args: {
  clinicCode: string
  kind: PmsKind
  apiKey: string
  creds?: Record<string, string>
}): Promise<void> {
  await ensureTable()
  await sql`
    INSERT INTO sst_clinic_pms (clinic_code, kind, api_key_enc, creds)
    VALUES (${args.clinicCode.toUpperCase()}, ${args.kind}, ${encryptCred(args.apiKey)}, ${JSON.stringify(args.creds ?? {})}::jsonb)
    ON CONFLICT (clinic_code) DO UPDATE
      SET kind = EXCLUDED.kind, api_key_enc = EXCLUDED.api_key_enc,
          creds = EXCLUDED.creds, connected_at = NOW(), last_ok_at = NULL
  `
}

export async function markPmsOk(clinicCode: string): Promise<void> {
  await ensureTable()
  await sql`UPDATE sst_clinic_pms SET last_ok_at = NOW() WHERE clinic_code = ${clinicCode.toUpperCase()}`
}

export async function removePmsConnection(clinicCode: string): Promise<void> {
  await ensureTable()
  await sql`DELETE FROM sst_clinic_pms WHERE clinic_code = ${clinicCode.toUpperCase()}`
}

/**
 * Resolve the clinic's OWN connected adapter (or null). This is the tenant
 * counterpart of deliver.ts's env-based resolvePmsAdapter — per-clinic enabled
 * IS the flag, no global env required.
 */
export async function resolveTenantAdapter(
  clinicCode: string,
): Promise<{ adapter: PmsAdapter; kind: PmsKind } | null> {
  await ensureTable()
  const { rows } = await sql`
    SELECT kind, api_key_enc, creds FROM sst_clinic_pms WHERE clinic_code = ${clinicCode.toUpperCase()}
  `
  if (!rows.length || !isPmsKind(rows[0].kind)) return null
  const kind = rows[0].kind as PmsKind
  let apiKey: string
  try {
    apiKey = decryptCred(String(rows[0].api_key_enc))
  } catch {
    return null // secret rotated — connection must be re-created, never crash
  }
  const creds = (rows[0].creds ?? {}) as Record<string, string>
  const config: PmsAdapterConfig = {
    apiKey,
    creds: Object.keys(creds).length ? creds : undefined,
    userAgent: 'SST Trainer (Concussion Education Australia; zac@concussion-education-australia.com)',
  }
  return { adapter: getAdapter(kind, config), kind }
}
