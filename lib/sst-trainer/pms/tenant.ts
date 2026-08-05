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
  // A connection that has STOPPED working must be able to say so. Without
  // this, `connected: true` was returned forever — after a revoked key, after
  // a SESSION_SECRET rotation, after a tenant was deleted — and the clinic
  // card showed a green "cliniko connected" chip right up until the moment a
  // clinician tried to file a report and it failed.
  await sql`ALTER TABLE sst_clinic_pms ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ`
  await sql`ALTER TABLE sst_clinic_pms ADD COLUMN IF NOT EXISTS last_error TEXT`
}

/**
 * How much confidence we have that this connection still works.
 *  - `ok`      — a successful authenticated call within FRESH_MS.
 *  - `unknown` — connected, but nothing has exercised it lately (or ever).
 *                Callers may probe; the UI says "not verified recently".
 *  - `error`   — the last thing we heard from the PMS was a failure, or the
 *                stored credential can no longer be decrypted.
 */
export type PmsHealth = 'ok' | 'unknown' | 'error'

/** A success this recent is taken at face value — no probe needed. */
export const PMS_FRESH_MS = 24 * 60 * 60 * 1000

export interface PmsConnection {
  kind: PmsKind
  connectedAt: string
  lastOkAt: string | null
  lastErrorAt: string | null
  lastError: string | null
  health: PmsHealth
}

/** Derive health from the stored timestamps (no network). */
export function pmsHealthOf(row: {
  lastOkAt: string | null
  lastErrorAt: string | null
}, nowMs = Date.now()): PmsHealth {
  const ok = row.lastOkAt ? Date.parse(row.lastOkAt) : NaN
  const err = row.lastErrorAt ? Date.parse(row.lastErrorAt) : NaN
  // A failure NEWER than the last success is the live state of the world.
  if (Number.isFinite(err) && (!Number.isFinite(ok) || err >= ok)) return 'error'
  if (Number.isFinite(ok) && nowMs - ok <= PMS_FRESH_MS) return 'ok'
  return 'unknown'
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
    SELECT kind, connected_at, last_ok_at, last_error_at, last_error
    FROM sst_clinic_pms WHERE clinic_code = ${clinicCode.toUpperCase()}
  `
  if (!rows.length || !isPmsKind(rows[0].kind)) return null
  const lastOkAt = rows[0].last_ok_at ? new Date(rows[0].last_ok_at).toISOString() : null
  const lastErrorAt = rows[0].last_error_at ? new Date(rows[0].last_error_at).toISOString() : null
  return {
    kind: rows[0].kind as PmsKind,
    connectedAt: String(rows[0].connected_at),
    lastOkAt,
    lastErrorAt,
    lastError: rows[0].last_error ? String(rows[0].last_error) : null,
    health: pmsHealthOf({ lastOkAt, lastErrorAt }),
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
          creds = EXCLUDED.creds, connected_at = NOW(), last_ok_at = NULL,
          -- a fresh key starts with a clean slate; the connect route's probe
          -- decides immediately whether it works
          last_error_at = NULL, last_error = NULL
  `
}

/**
 * Turn an adapter's raw failure string ("cliniko: HTTP 401") into something a
 * clinician can ACT on. The raw string was being rendered in amber — the same
 * colour as an informational note — which read as a hint rather than "the
 * report did not file".
 */
export function describePmsFailure(
  kind: string,
  raw: string | null | undefined,
): { reason: 'auth' | 'not-found' | 'unavailable' | 'unknown'; message: string } {
  const s = (raw || '').toLowerCase()
  const pms = kind || 'your practice software'
  if (/http 401|http 403|unauthor|forbidden|invalid api key|not configured/.test(s)) {
    return {
      reason: 'auth',
      message:
        `${pms} rejected the connection — the stored API key is no longer valid (revoked, expired, or the tenant changed). ` +
        `Nothing was written. Reconnect ${pms} from your clinic workspace, then file again.`,
    }
  }
  if (/http 404|not found/.test(s)) {
    return {
      reason: 'not-found',
      message: `${pms} could not find that patient record — it may have been merged or archived. Search again and pick the current record.`,
    }
  }
  if (/http 5\d\d|timeout|network|fetch failed|econn/.test(s)) {
    return {
      reason: 'unavailable',
      message: `${pms} did not respond. Nothing was written — try again in a few minutes.`,
    }
  }
  return {
    reason: 'unknown',
    message: `${pms} refused the note, so nothing was filed. Try again; if it keeps failing, reconnect ${pms} from your clinic workspace.`,
  }
}

/**
 * Raw stored connection row — lets the connect route snapshot a WORKING
 * connection before overwriting it with an unproven key, and restore it
 * verbatim (still encrypted — the key is never decrypted in transit) when
 * the probe fails. A typo must never destroy a working connection.
 */
export interface PmsConnectionSnapshot {
  kind: string
  apiKeyEnc: string
  creds: unknown
  connectedAt: string
  lastOkAt: string | null
}

export async function getPmsConnectionSnapshot(clinicCode: string): Promise<PmsConnectionSnapshot | null> {
  await ensureTable()
  const { rows } = await sql`
    SELECT kind, api_key_enc, creds, connected_at, last_ok_at
    FROM sst_clinic_pms WHERE clinic_code = ${clinicCode.toUpperCase()}
  `
  if (!rows.length) return null
  return {
    kind: String(rows[0].kind),
    apiKeyEnc: String(rows[0].api_key_enc),
    creds: rows[0].creds ?? {},
    connectedAt: String(rows[0].connected_at),
    lastOkAt: rows[0].last_ok_at ? String(rows[0].last_ok_at) : null,
  }
}

export async function restorePmsConnection(clinicCode: string, snap: PmsConnectionSnapshot): Promise<void> {
  await ensureTable()
  await sql`
    INSERT INTO sst_clinic_pms (clinic_code, kind, api_key_enc, creds, connected_at, last_ok_at)
    VALUES (${clinicCode.toUpperCase()}, ${snap.kind}, ${snap.apiKeyEnc}, ${JSON.stringify(snap.creds)}::jsonb,
            ${snap.connectedAt}, ${snap.lastOkAt})
    ON CONFLICT (clinic_code) DO UPDATE
      SET kind = EXCLUDED.kind, api_key_enc = EXCLUDED.api_key_enc, creds = EXCLUDED.creds,
          connected_at = EXCLUDED.connected_at, last_ok_at = EXCLUDED.last_ok_at
  `
}

export async function markPmsOk(clinicCode: string): Promise<void> {
  await ensureTable()
  // A success CLEARS the error state — the connection is demonstrably alive.
  await sql`
    UPDATE sst_clinic_pms
    SET last_ok_at = NOW(), last_error_at = NULL, last_error = NULL
    WHERE clinic_code = ${clinicCode.toUpperCase()}
  `
}

/**
 * Record that the PMS refused us. Called from the probe and from a failed
 * report filing so the clinic card can stop claiming a green connection the
 * moment it stops being true. Never throws — health bookkeeping must not take
 * down the operation that discovered the failure.
 */
export async function markPmsFailed(clinicCode: string, error: string): Promise<void> {
  try {
    await ensureTable()
    await sql`
      UPDATE sst_clinic_pms
      SET last_error_at = NOW(), last_error = ${error.slice(0, 300)}
      WHERE clinic_code = ${clinicCode.toUpperCase()}
    `
  } catch (err) {
    console.error('[pms] markPmsFailed bookkeeping failed:', err)
  }
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
