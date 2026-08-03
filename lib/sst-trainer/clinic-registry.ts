/**
 * SST Trainer clinic registry — the CLINIC CODE is the launch gate.
 *
 * One registry for both tools: Vercel KV `clinic:{code}` is SHARED with the
 * preseason baseline tool (app/api/preseason/register/route.ts mints codes into
 * the same namespace). This module extends that value shape compatibly:
 *
 *   clinic:{CODE} = {
 *     clinicName:  string
 *     contactName: string
 *     email:       string      // lowercased
 *     createdAt:   string      // ISO
 *     viewKey?:    string      // SST clinician READ key — absent on legacy
 *                              // preseason-minted records
 *     product?:    'sst'       // absent on preseason-minted records
 *   }
 *
 * Preseason readers only ever look at clinicName/contactName/email, so the two
 * extra fields are invisible to them.
 *
 * Access model (APP 11): patients hold the clinic CODE (it's on the QR card),
 * so the code alone must never unlock the clinic's patient roster. Clinician
 * READ paths additionally require the `viewKey` (verifyViewKey below); patient
 * WRITE paths stay code-only. DEMO00 is the shared public demo clinic — no key.
 *
 * Durability: SST-provisioned clinics are mirrored to Postgres `sst_clinics`
 * (same pattern as preseason_clinics) for admin listing and KV-loss recovery.
 */

import crypto from 'crypto'
import { kv } from '@vercel/kv'
import { sql } from '@/lib/db'

export const DEMO_CLINIC_CODE = 'DEMO00'

export interface ClinicRecord {
  clinicName: string
  contactName?: string
  email?: string
  createdAt?: string
  viewKey?: string
  product?: string
  /** 'trial' until the clinic subscribes; 'active' once billing is live.
   *  Absent on legacy/preseason records → treated as 'trial'. */
  plan?: 'trial' | 'active'
}

/** Trial allowance: a clinic may run this many DISTINCT patients free before
 *  it must subscribe. Usage-based, not time-based (owner 2026-07-06). */
export const TRIAL_PATIENT_CAP = 3

export interface ClinicUsage {
  plan: 'trial' | 'active'
  patientCount: number
  cap: number | null // null = unlimited (active plan)
  /** A NEW patient may be admitted. Existing patients are never blocked. */
  canAddPatient: boolean
}

/**
 * Count DISTINCT patients a clinic has run (one patient = ≥1 logged session
 * under a non-empty patient_label) and derive the trial gate. The gate only
 * ever restricts admitting a NEW patient — it must never block data sync for
 * a patient already counted (clinical-safety rule). DEMO00 is unlimited.
 */
export async function getClinicUsage(rawCode: unknown): Promise<ClinicUsage> {
  const code = normaliseClinicCode(rawCode)
  if (!code || code === DEMO_CLINIC_CODE) {
    return { plan: 'active', patientCount: 0, cap: null, canAddPatient: true }
  }
  const clinic = await getClinic(code)
  const plan: 'trial' | 'active' = clinic?.plan === 'active' ? 'active' : 'trial'
  let patientCount = 0
  try {
    const { rows } = await sql<{ n: number }>`
      SELECT COUNT(DISTINCT COALESCE(
        NULLIF(trim(coalesce(payload->>'patientRef', '')), ''),
        NULLIF(trim(coalesce(patient_label, '')), '')
      ))::int AS n
      FROM sst_clinic_sessions
      WHERE upper(clinic_code) = ${code}
    `
    patientCount = rows[0]?.n ?? 0
  } catch {
    /* no sessions table yet → 0 */
  }
  if (plan === 'active') {
    return { plan, patientCount, cap: null, canAddPatient: true }
  }
  return {
    plan,
    patientCount,
    cap: TRIAL_PATIENT_CAP,
    canAddPatient: patientCount < TRIAL_PATIENT_CAP,
  }
}

/** Is this label an already-known patient at the clinic? Re-admitting an
 *  existing patient (re-invite, re-onboard) never counts against the cap. */
export async function isExistingPatient(rawCode: unknown, label: string): Promise<boolean> {
  const code = normaliseClinicCode(rawCode)
  const trimmed = label.trim()
  if (!code || !trimmed) return false
  try {
    const { rows } = await sql<{ n: number }>`
      SELECT COUNT(*)::int AS n FROM sst_clinic_sessions
      WHERE upper(clinic_code) = ${code}
        AND trim(coalesce(patient_label, '')) = ${trimmed}
      LIMIT 1
    `
    return (rows[0]?.n ?? 0) > 0
  } catch {
    return false
  }
}

/**
 * Flip a clinic's billing plan (Stripe webhook → here). 'active' lifts the
 * 3-patient trial cap; reverting to 'trial' re-applies the admission gate
 * but never blocks existing patients. Stripe ids stashed for the billing
 * portal. Writes KV (the live gate) + best-effort PG columns.
 */
export async function setSstClinicPlan(
  rawCode: unknown,
  plan: 'trial' | 'active',
  stripe?: { customerId?: string; subscriptionId?: string },
): Promise<void> {
  const code = normaliseClinicCode(rawCode)
  if (!code || code === DEMO_CLINIC_CODE) return
  let rec = await getClinic(code)
  if (!rec) {
    // 2026-08-04 audit P1-3: a missing/blipped KV record made this a silent
    // no-op — money taken, cap kept, webhook 200'd so Stripe never retried.
    // The PG row is the durable source; reconstruct the KV record from it.
    try {
      const { rows } = await sql`
        SELECT clinic_name, contact_name, email, view_key, created_at
        FROM sst_clinics WHERE code = ${code} LIMIT 1
      `
      if (rows[0]) {
        rec = {
          clinicName: rows[0].clinic_name,
          contactName: rows[0].contact_name,
          email: rows[0].email,
          viewKey: rows[0].view_key,
          createdAt: rows[0].created_at,
        } as NonNullable<typeof rec>
      }
    } catch (err) {
      console.error('[clinic-registry] PG fallback failed in setSstClinicPlan:', err)
    }
  }
  if (!rec) {
    console.error(`[clinic-registry] setSstClinicPlan: no record for ${code} — plan change LOST`)
    return
  }
  const prev = rec as unknown as Record<string, unknown>
  await kv.set(`clinic:${code}`, {
    ...rec,
    plan,
    stripeCustomerId: stripe?.customerId ?? prev.stripeCustomerId,
    stripeSubscriptionId: stripe?.subscriptionId ?? prev.stripeSubscriptionId,
  })
  try {
    await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial'`
    await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`
    await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`
    await sql`
      UPDATE sst_clinics SET plan = ${plan},
        stripe_customer_id = COALESCE(${stripe?.customerId ?? null}, stripe_customer_id),
        stripe_subscription_id = COALESCE(${stripe?.subscriptionId ?? null}, stripe_subscription_id)
      WHERE code = ${code}
    `
  } catch (err) {
    console.error('[sst-registry] setSstClinicPlan PG mirror failed:', err)
  }
}

/** The Stripe customer id stored on a clinic (for the billing portal). */
export async function getSstClinicStripeCustomer(rawCode: unknown): Promise<string | null> {
  const rec = (await getClinic(rawCode)) as unknown as Record<string, unknown> | null
  return (rec?.stripeCustomerId as string) ?? null
}

/** The Stripe subscription id stored on a clinic — used to keep the CRM annual
 *  renewal subscription IDEMPOTENT (never create a second one for a clinic). */
export async function getSstClinicStripeSubscription(rawCode: unknown): Promise<string | null> {
  const rec = (await getClinic(rawCode)) as unknown as Record<string, unknown> | null
  return (rec?.stripeSubscriptionId as string) ?? null
}

/** Uppercase, trim; returns '' when the code can't possibly be valid. */
export function normaliseClinicCode(raw: unknown): string {
  const code = String(raw ?? '').trim().toUpperCase()
  return code.length >= 3 && code.length <= 40 ? code : ''
}

/**
 * Read a clinic record from the shared KV registry. DEMO00 returns a synthetic
 * demo record so demo flows never depend on KV state. Fails closed (null) on
 * KV errors.
 */
export async function getClinic(rawCode: unknown): Promise<ClinicRecord | null> {
  const code = normaliseClinicCode(rawCode)
  if (!code) return null
  if (code === DEMO_CLINIC_CODE) {
    return { clinicName: 'Demo Clinic', product: 'sst' }
  }
  try {
    const rec = await kv.get<ClinicRecord>(`clinic:${code}`)
    return rec && typeof rec === 'object' ? rec : null
  } catch {
    return null // fail closed
  }
}

/** True for DEMO00 and any code present in the shared registry. */
export async function isRegisteredClinic(rawCode: unknown): Promise<boolean> {
  return (await getClinic(rawCode)) != null
}

/**
 * Clinician read-key check. DEMO00 accepts absence of a key (public demo).
 * Everything else requires an exact match against the stored viewKey —
 * legacy records WITHOUT a viewKey always fail (re-provision to grant hub
 * access; the alternative would leave the patient-held code readable).
 * Constant-time compare so the key can't be sniffed byte-by-byte.
 */
export async function verifyViewKey(rawCode: unknown, key: string | null | undefined): Promise<boolean> {
  const code = normaliseClinicCode(rawCode)
  if (!code) return false
  if (code === DEMO_CLINIC_CODE) return true
  if (!key) return false
  const clinic = await getClinic(code)
  if (!clinic?.viewKey) return false
  const a = Buffer.from(String(key))
  const b = Buffer.from(clinic.viewKey)
  if (a.length !== b.length) {
    // Still burn a comparison so length mismatch isn't a faster path.
    crypto.timingSafeEqual(a, a)
    return false
  }
  return crypto.timingSafeEqual(a, b)
}

// ── Provisioning ─────────────────────────────────────────────────────────────

// Same charset as preseason (no I/1/O/0 confusion) — codes are read out loud
// and typed on phones.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]
  }
  return code
}

export async function ensureSstClinicsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS sst_clinics (
      code TEXT PRIMARY KEY,
      clinic_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      view_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

/**
 * Ensure the clinical-session ingest table exists. Mirrors
 * scripts/sql/sst-clinic-sessions.sql so a FRESH environment self-heals rather
 * than 500-ing on the first patient session write (the ingest route inserts
 * without its own ensure). Called at clinic creation — negligible overhead,
 * and any clinic that can exist already has its session table.
 */
export async function ensureSstClinicSessionsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS sst_clinic_sessions (
      id             TEXT PRIMARY KEY,
      clinic_code    TEXT NOT NULL,
      clinic_name    TEXT,
      patient_label  TEXT,
      session_type   TEXT NOT NULL,
      hrt_bpm        INTEGER,
      band_low       INTEGER,
      band_high      INTEGER,
      condition      TEXT,
      payload        JSONB NOT NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_sst_clinic_sessions_code
      ON sst_clinic_sessions (upper(clinic_code), created_at DESC)
  `
}

export interface SstClinic {
  code: string
  clinicName: string
  contactName: string
  email: string
  viewKey: string
  createdAt: string
}

/**
 * Look up an already-provisioned SST clinic by contact email (Postgres mirror).
 * Used to keep founding-form resubmissions idempotent — one clinic per email.
 */
export async function getSstClinicByEmail(email: string): Promise<SstClinic | null> {
  try {
    const { rows } = await sql`
      SELECT code, clinic_name, contact_name, email, view_key, created_at
      FROM sst_clinics
      WHERE email = ${email.toLowerCase()}
      ORDER BY created_at ASC
      LIMIT 1
    `
    const r = rows[0]
    if (!r) return null
    return {
      code: r.code,
      clinicName: r.clinic_name,
      contactName: r.contact_name,
      email: r.email,
      viewKey: r.view_key,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    }
  } catch {
    return null // table may not exist yet — treat as "not provisioned"
  }
}

/**
 * Mint a new SST clinic: unique 6-char code in the SHARED clinic:{code} KV
 * namespace (collision-checked against preseason codes too), a crypto-random
 * viewKey, plus a durable Postgres row. Throws on failure — callers decide
 * whether provisioning is best-effort.
 */
export async function createSstClinic(args: {
  clinicName: string
  contactName: string
  email: string
}): Promise<SstClinic> {
  const clinicName = args.clinicName.trim()
  const contactName = args.contactName.trim()
  const email = args.email.trim().toLowerCase()

  // Generate unique code (shared namespace — a preseason code is a collision).
  let code = generateCode()
  let attempts = 0
  while ((code === DEMO_CLINIC_CODE || (await kv.exists(`clinic:${code}`))) && attempts < 10) {
    code = generateCode()
    attempts++
  }
  if (code === DEMO_CLINIC_CODE || (attempts >= 10 && (await kv.exists(`clinic:${code}`)))) {
    throw new Error('Unable to generate a unique clinic code')
  }

  // 24-char URL-safe read key (144 bits).
  const viewKey = crypto.randomBytes(18).toString('base64url')
  const createdAt = new Date().toISOString()

  // Postgres FIRST (2026-07-06 audit): the PG row is the EMAIL-IDEMPOTENCY
  // index (getSstClinicByEmail reads it). When it was best-effort, a failed
  // mirror write let a later re-POST mint a SECOND code + key for the same
  // clinic, orphaning the first welcome email's key. Fail provisioning
  // loudly instead — the caller retries and idempotency holds.
  await ensureSstClinicsTable()
  await ensureSstClinicSessionsTable()
  await sql`
    INSERT INTO sst_clinics (code, clinic_name, contact_name, email, view_key, created_at)
    VALUES (${code}, ${clinicName}, ${contactName}, ${email}, ${viewKey}, ${createdAt})
    ON CONFLICT (code) DO NOTHING
  `

  // KV second — the registry every access check reads. If this fails, remove
  // the PG row so a retry re-mints cleanly instead of returning a code whose
  // auth record doesn't exist.
  try {
    await kv.set(`clinic:${code}`, {
      clinicName,
      contactName,
      email,
      viewKey,
      product: 'sst',
      createdAt,
    })
  } catch (err) {
    await sql`DELETE FROM sst_clinics WHERE code = ${code}`.catch(() => {})
    throw err
  }

  return { code, clinicName, contactName, email, viewKey, createdAt }
}

/**
 * Adopt an existing clinic code for this email — used before minting a new one.
 *
 * THE PROBLEM THIS SOLVES: preseason (`/api/preseason/register`) and the portal
 * (`/api/clinical-testing/clinic`) both mint into the SHARED `clinic:{code}`
 * namespace, but only the portal path wrote a `viewKey`. A clinic that
 * registered for baseline testing first therefore ended up with a code that:
 *   - ACCEPTS SST patient writes (isRegisteredClinic only checks existence), but
 *   - FAILS every SST clinician read (verifyViewKey needs a stored key).
 * Their patients' threshold tests and sessions went in and could never be read
 * back — a silent clinical-data blackhole.
 *
 * And because the portal path keyed idempotency off `sst_clinics` only, the same
 * clinician logging into the portal later was minted a SECOND code, splitting
 * their patients across two codes.
 *
 * So: find the preseason clinic for this email, give it a viewKey if it has
 * none, mirror it into `sst_clinics`, and hand it back. One clinic, one code,
 * both tools.
 */
export async function adoptExistingClinicForEmail(rawEmail: string): Promise<SstClinic | null> {
  const email = rawEmail.trim().toLowerCase()
  if (!email) return null

  let code: string | null = null
  try {
    const { rows } = await sql<{ code: string; clinic_name: string; contact_name: string }>`
      SELECT code, clinic_name, contact_name FROM preseason_clinics
      WHERE LOWER(email) = ${email}
      ORDER BY id ASC LIMIT 1
    `
    if (!rows.length) return null
    code = normaliseClinicCode(rows[0].code)
  } catch {
    return null // preseason table absent — nothing to adopt
  }
  if (!code) return null

  const rec = await getClinic(code)
  if (!rec) return null // KV entry gone; let the caller mint fresh

  const viewKey = rec.viewKey ?? crypto.randomBytes(18).toString('base64url')
  const createdAt = rec.createdAt ?? new Date().toISOString()
  const clinicName = rec.clinicName || 'Clinic'
  const contactName = rec.contactName || email.split('@')[0]

  if (!rec.viewKey) {
    // Additive only — preseason readers look at clinicName/contactName/email
    // and are unaffected by the extra fields.
    await kv.set(`clinic:${code}`, { ...rec, viewKey, product: 'sst' })
  }

  // Mirror into sst_clinics so the normal email-idempotency path finds it next
  // time, and make sure the session table this clinic will now write to exists.
  try {
    await ensureSstClinicsTable()
    await ensureSstClinicSessionsTable()
    await sql`
      INSERT INTO sst_clinics (code, clinic_name, contact_name, email, view_key, created_at)
      VALUES (${code}, ${clinicName}, ${contactName}, ${email}, ${viewKey}, ${createdAt})
      ON CONFLICT (code) DO UPDATE SET view_key = EXCLUDED.view_key
    `
  } catch (err) {
    console.error('[sst-registry] adopt mirror failed (KV grant still applied):', err)
  }

  return { code, clinicName, contactName, email, viewKey, createdAt }
}

/** Admin listing (newest first). Empty array when the table doesn't exist yet. */
export async function listSstClinics(): Promise<SstClinic[]> {
  try {
    const { rows } = await sql`
      SELECT code, clinic_name, contact_name, email, view_key, created_at
      FROM sst_clinics
      ORDER BY created_at DESC
    `
    return rows.map((r) => ({
      code: r.code,
      clinicName: r.clinic_name,
      contactName: r.contact_name,
      email: r.email,
      viewKey: r.view_key,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    }))
  } catch {
    return []
  }
}
