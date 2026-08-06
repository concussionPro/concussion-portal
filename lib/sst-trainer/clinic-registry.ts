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
import { SST_TRIAL_PATIENT_CAP } from '@/lib/config'

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
 *  it must subscribe. Usage-based, not time-based (owner 2026-07-06).
 *  Defined in lib/config so client components can render it too. */
export const TRIAL_PATIENT_CAP = SST_TRIAL_PATIENT_CAP

/** PAID tiers are priced on ACTIVE CASELOAD, not seats (owner 2026-08-05:
 *  "make it fool proof — change pricing tiers i dont care"). Clinicians are
 *  unlimited on every paid tier; the metered unit is distinct active patients
 *  in a rolling 30 days — the one metric a clinic cannot fake without
 *  destroying the product's value to itself. Enforcement = the same
 *  server-side admission gate as the trial. null = unlimited. */
export const TIER_ACTIVE_PATIENT_CAP: Record<string, number | null> = {
  single: 5,
  clinic: 10,
  enterprise: null,
}

export interface ClinicUsage {
  plan: 'trial' | 'active'
  /** trial → lifetime distinct patients; active → distinct active in 30d */
  patientCount: number
  cap: number | null // null = unlimited
  /** 'lifetime' (trial) or '30d' (paid caseload window) — for display copy */
  window: 'lifetime' | '30d'
  /** A NEW patient may be admitted. Existing patients are never blocked. */
  canAddPatient: boolean
  /**
   * True when this clinic is on the trial ALLOWANCE because the platform year
   * included with a course enrolment has lapsed — not because they are a
   * trialist. They paid; their included period simply ended.
   *
   * Every surface that explains the trial must branch on this, because telling
   * a course buyer "you're on the free trial" is false and reads as a
   * bait-and-switch on something they were promised at the point of sale.
   */
  includedLapsed?: boolean
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
    return { plan: 'active', patientCount: 0, cap: null, window: '30d', canAddPatient: true }
  }
  const clinic = await getClinic(code)
  let plan: 'trial' | 'active' = clinic?.plan === 'active' ? 'active' : 'trial'
  let tier: string | null = (clinic as { tier?: string } | null)?.tier ?? null
  if (!clinic || (plan === 'active' && !tier)) {
    // KV blip must not demote a PAYING clinic to trial at the admission gate
    // (2026-08-05 sweep #11) — the PG row is the durable billing source.
    try {
      const { rows } = await sql<{ plan: string; tier: string | null }>`
        SELECT plan, tier FROM sst_clinics WHERE code = ${code} LIMIT 1
      `
      if (rows[0]?.plan === 'active') plan = 'active'
      tier = tier ?? rows[0]?.tier ?? null
    } catch { /* table absent → stay trial */ }
  }
  // The INCLUDED platform year that came with a course enrolment has a hard
  // end date. Once it passes, and no real subscription has been attached, the
  // clinic reverts to the trial allowance for NEW patients — it is not cut off.
  // Existing patients are never blocked (the same doctrine the caseload cap
  // uses), because ending someone's access mid-rehabilitation is a clinical
  // problem, not a billing one. The clinic is PROMPTED to subscribe.
  let includedLapsed = false
  if (plan === 'active') {
    try {
      // `to_jsonb(c) ->> 'included_until'` instead of naming the column: this
      // is a LAZILY migrated column (ensureSstClinicsTable), and naming a
      // column that does not exist yet makes Postgres reject the whole
      // statement. Reading it out of the row's jsonb form yields NULL when the
      // column is absent, which is exactly the "no included period" case. Same
      // reason applies to every other included_until read in this file.
      const { rows } = await sql<{ included_until: string | null; stripe_subscription_id: string | null }>`
        SELECT (to_jsonb(c) ->> 'included_until') AS included_until,
               (to_jsonb(c) ->> 'stripe_subscription_id') AS stripe_subscription_id
        FROM sst_clinics c WHERE code = ${code} LIMIT 1
      `
      const until = rows[0]?.included_until
      const hasSubscription = !!rows[0]?.stripe_subscription_id
      if (until && !hasSubscription && new Date(until).getTime() < Date.now()) {
        plan = 'trial'
        tier = null
        includedLapsed = true
      }
    } catch { /* column/table absent → leave the plan as-is */ }
  }
  // Paid plans meter ACTIVE caseload in a rolling 30 days; the trial meters
  // lifetime distinct patients. A tier of null on an active plan (alumni
  // comps, legacy grants, enterprise) is unlimited.
  const allowance = plan === 'active' ? (tier ? (TIER_ACTIVE_PATIENT_CAP[tier] ?? null) : null) : TRIAL_PATIENT_CAP
  const windowed = plan === 'active'
  let patientCount = 0
  try {
    // One human = one identity, LABEL-first (final sweep #13): the ref is an
    // INSTALL UUID, so the same labeled patient on phone + laptop (or after a
    // reinstall) is one human, not two of a 5-cap. Label when present, ref
    // only for unlabeled installs. This also covers the earlier mixed
    // ref/label double-count (sweep #4): shared label collapses both rows.
    // Ref→label resolution (round-L #5): an install that was unlabeled at
    // first sync and named later must not count twice — a ref that EVER
    // carried a label resolves to that label for all its rows.
    const { rows } = await sql<{ n: number }>`
      WITH s AS (
        SELECT NULLIF(lower(trim(coalesce(patient_label, ''))), '') AS lbl,
               NULLIF(trim(coalesce(payload->>'patientRef', '')), '') AS ref
        FROM sst_clinic_sessions
        WHERE upper(clinic_code) = ${code}
          AND (${!windowed} OR created_at > NOW() - INTERVAL '30 days')
      ), ref_label AS (
        SELECT ref, MAX(lbl) AS lbl FROM s WHERE ref IS NOT NULL AND lbl IS NOT NULL GROUP BY ref
      )
      SELECT COUNT(DISTINCT COALESCE(s.lbl, rl.lbl, s.ref))::int AS n
      FROM s LEFT JOIN ref_label rl ON rl.ref = s.ref
      WHERE COALESCE(s.lbl, rl.lbl, s.ref) IS NOT NULL
    `
    patientCount = rows[0]?.n ?? 0
  } catch {
    /* no sessions table yet → 0 */
  }
  return {
    plan,
    patientCount,
    cap: allowance,
    window: windowed ? '30d' : 'lifetime',
    canAddPatient: allowance == null || patientCount < allowance,
    includedLapsed,
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
        AND lower(trim(coalesce(patient_label, ''))) = ${trimmed.toLowerCase()}
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
  stripe?: { customerId?: string; subscriptionId?: string; tier?: string },
  /**
   * Months of INCLUDED platform that came with a course enrolment. Stamps
   * `included_until` so the renewal prompt has a date to key on. Omit for a
   * real subscription (Stripe governs the period) and for comped clinics.
   */
  includedMonths?: number,
): Promise<void> {
  const code = normaliseClinicCode(rawCode)
  if (!code || code === DEMO_CLINIC_CODE) return
  let rec = await getClinic(code)
  if (!rec) {
    // 2026-08-04 audit P1-3: a missing/blipped KV record made this a silent
    // no-op — money taken, cap kept, webhook 200'd so Stripe never retried.
    // The PG row is the durable source; reconstruct the KV record from it.
    try {
      // Reconstruct the FULL billing state, not just identity (2026-08-05
      // sweep #18): dropping tier/plan/stripe ids here meant a KV loss also
      // lost the billing portal (stripeCustomerId) and the bundle's
      // subscription idempotency key (stripeSubscriptionId).
      const { rows } = await sql`
        SELECT clinic_name, contact_name, email, view_key, created_at,
               plan, tier, stripe_customer_id, stripe_subscription_id
        FROM sst_clinics WHERE code = ${code} LIMIT 1
      `
      if (rows[0]) {
        rec = {
          clinicName: rows[0].clinic_name,
          contactName: rows[0].contact_name,
          email: rows[0].email,
          viewKey: rows[0].view_key,
          createdAt: rows[0].created_at,
          plan: rows[0].plan ?? undefined,
          tier: rows[0].tier ?? undefined,
          stripeCustomerId: rows[0].stripe_customer_id ?? undefined,
          stripeSubscriptionId: rows[0].stripe_subscription_id ?? undefined,
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
  // KV first (it is the live gate), but a KV failure must NOT skip the Postgres
  // mirror below — that would lose the plan flip in BOTH stores while the
  // caller's `await` reports success. Only two of the four callers
  // (alumni-sst-activation, bundle.ts) have any retry behind them at all.
  let kvWriteFailed: unknown = null
  try {
    await kv.set(`clinic:${code}`, {
      ...rec,
      plan,
      tier: stripe?.tier ?? prev.tier,
      stripeCustomerId: stripe?.customerId ?? prev.stripeCustomerId,
      stripeSubscriptionId: stripe?.subscriptionId ?? prev.stripeSubscriptionId,
    })
  } catch (err) {
    kvWriteFailed = err
    console.error(`[clinic-registry] KV plan write FAILED for ${code} — writing the PG mirror anyway:`, err)
  }
  try {
    await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial'`
    await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS tier TEXT`
    await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`
    await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`
    // included_until MUST be self-healed here too. The UPDATE below names the
    // column, and on 2026-08-06 it did NOT exist in production — so the whole
    // mirror threw into the catch and plan/tier/stripe ids were ALL silently
    // lost from Postgres on every plan flip. KV said 'active', PG said 'trial',
    // and PG is what the KV-blip fallback and the admin list read.
    await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS included_until TIMESTAMPTZ`
    await sql`
      UPDATE sst_clinics SET plan = ${plan},
        tier = COALESCE(${stripe?.tier ?? null}, tier),
        stripe_customer_id = COALESCE(${stripe?.customerId ?? null}, stripe_customer_id),
        stripe_subscription_id = COALESCE(${stripe?.subscriptionId ?? null}, stripe_subscription_id),
        included_until = CASE
          WHEN ${includedMonths ?? null}::int IS NULL THEN included_until
          ELSE NOW() + (${includedMonths ?? 0}::int * INTERVAL '1 month')
        END
      WHERE code = ${code}
    `
  } catch (err) {
    console.error('[sst-registry] setSstClinicPlan PG mirror failed:', err)
    // BOTH stores rejected the flip. Surfacing it lets the Stripe webhook's
    // retry actually re-attempt instead of 200-ing on a change that never
    // landed anywhere — silently keeping a paid clinic on the trial cap.
    if (kvWriteFailed) throw err
    return
  }
  // PG holds the durable record, so a KV-only failure is recoverable (getClinic
  // now reads through to Postgres). Still loud — the live gate is stale until
  // the next write.
  if (kvWriteFailed) {
    console.error(`[clinic-registry] clinic ${code} plan=${plan} persisted to Postgres but NOT to KV`)
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
    if (rec && typeof rec === 'object') return rec
  } catch (err) {
    console.error(`[clinic-registry] KV read failed for ${code} — falling back to Postgres:`, err)
  }
  // POSTGRES FALLBACK. `null` from KV is indistinguishable from "no such
  // clinic", and this accessor backs isRegisteredClinic + verifyViewKey, which
  // gate ~18 SST routes. Without this, a KV blip tells a PAYING clinic "Clinic
  // code not recognised" across the hub, GP/ACC reports, PMS filing and live
  // monitoring — and if KV ever drops the key there is no read path back, even
  // though sst_clinics holds every field including the viewKey.
  //
  // It also closes a MONEY hole: getSstClinicStripeSubscription reads through
  // here, and bundle.ts uses that as its "never create a second subscription"
  // idempotency guard. A KV blip made that guard pass and would have attached a
  // SECOND live A$49/mo subscription to a clinic already carrying one.
  //
  // Cost is one indexed primary-key lookup, and only when KV has no record —
  // the same shape of fallback getClinicUsage and /api/sst/session already use.
  try {
    const { rows } = await sql`
      SELECT clinic_name, contact_name, email, view_key, created_at, plan, tier
      FROM sst_clinics WHERE code = ${code} LIMIT 1
    `
    const r = rows[0]
    if (!r) return null // genuinely unknown code
    return {
      clinicName: r.clinic_name,
      contactName: r.contact_name ?? undefined,
      email: r.email ?? undefined,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      viewKey: r.view_key ?? undefined,
      product: 'sst',
      plan: r.plan === 'active' ? 'active' : 'trial',
      // Not on ClinicRecord, but getClinicUsage reads it structurally off the
      // record; dropping it here would silently uncap a tiered clinic.
      ...(r.tier ? { tier: r.tier } : {}),
    } as ClinicRecord
  } catch {
    return null // fail closed — both stores unreachable
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
  // Billing columns are read unconditionally (getSstClinicByEmail, cron
  // watchdog) — self-heal on environments created before they existed.
  await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial'`
  await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS tier TEXT`
  await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS profile JSONB`
  // The INCLUDED platform year that comes with a course enrolment. Set when a
  // course purchase provisions the clinic; NULL for trials, for clinics on a
  // real subscription, and for comped/alumni clinics (which are open-ended by
  // owner decision). At expiry the clinic is PROMPTED to subscribe — never
  // auto-charged, because a domestic course checkout saves no payment method
  // and nobody consented to off-session billing at the point of sale.
  await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS included_until TIMESTAMPTZ`
  // ONE CLINIC PER EMAIL, enforced by the database.
  //
  // Every provisioning path is check-then-create (`getSstClinicByEmail(...) ??
  // createSstClinic(...)`) across FOUR callers — the bundle, the self-serve
  // trial, the in-portal create, and alumni activation. `createSstClinic` mints
  // a fresh random code each call, so `ON CONFLICT (code)` never fires for a
  // duplicate EMAIL: two tabs, a double-tapped submit or a browser retry mint
  // two clinics with two codes and two viewKeys. `getSstClinicByEmail` then
  // returns the OLDEST, so the clinician's workspace shows one code while the
  // welcome email may have handed them the other — and every patient onboarded
  // under the loser lands in a clinic they can never see.
  //
  // A unique index makes all four callers safe by construction, which no amount
  // of application-level locking does. Verified creatable against production on
  // 2026-08-06: 26 clinics, 26 distinct lowercased emails, 0 duplicates.
  // Guarded because a pre-existing duplicate must degrade to the old behaviour
  // rather than break every clinic read behind it.
  try {
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS uniq_sst_clinics_email ON sst_clinics (lower(email))`
  } catch (err) {
    console.error(
      '[clinic-registry] could not create uniq_sst_clinics_email — duplicate emails already exist; ' +
        'de-duplicate sst_clinics before relying on one-clinic-per-email:',
      err,
    )
  }
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
  /** billing state mirrored from PG — 'trial' | 'active' */
  plan: string
  /** paid tier ('single' | 'clinic' | 'enterprise') — null until first subscription */
  tier: string | null
  /**
   * End of the platform year included with a course enrolment, ISO. Null for
   * trials, for clinics on a real subscription, and for comped/alumni clinics.
   * The workspace reads this to prompt BEFORE it lapses.
   */
  includedUntil?: string | null
}

/**
 * Look up an already-provisioned SST clinic by contact email (Postgres mirror).
 * Used to keep founding-form resubmissions idempotent — one clinic per email.
 */
export async function getSstClinicByEmail(email: string): Promise<SstClinic | null> {
  try {
    const { rows } = await sql`
      SELECT code, clinic_name, contact_name, email, view_key, created_at, plan, tier,
             (to_jsonb(c) ->> 'included_until') AS included_until
      FROM sst_clinics c
      WHERE email = ${email.toLowerCase()}
      ORDER BY created_at ASC
      LIMIT 1
    `
    let r = rows[0]
    if (!r) {
      // Member fallback (2026-08-04 seats build): named practitioners log in
      // with their own email and resolve to the clinic that seated them.
      try {
        const { rows: viaMember } = await sql`
          SELECT c.code, c.clinic_name, c.contact_name, c.email, c.view_key, c.created_at, c.plan, c.tier,
                 (to_jsonb(c) ->> 'included_until') AS included_until
          FROM sst_clinic_members m
          JOIN sst_clinics c ON c.code = m.clinic_code
          WHERE m.email = ${email.toLowerCase()} AND m.revoked_at IS NULL
          ORDER BY m.created_at ASC
          LIMIT 1
        `
        r = viaMember[0]
      } catch { /* members table may not exist yet */ }
    }
    if (!r) return null
    return {
      code: r.code,
      clinicName: r.clinic_name,
      contactName: r.contact_name,
      email: r.email,
      viewKey: r.view_key,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      plan: r.plan || 'trial',
      tier: r.tier || null,
      includedUntil: r.included_until ?? null,
    }
  } catch {
    return null // table may not exist yet — treat as "not provisioned"
  }
}

/**
 * OWNER-only clinic lookup that THROWS instead of reporting "not provisioned".
 *
 * Two differences from getSstClinicByEmail, both deliberate:
 *
 *  1. NO member fallback. getSstClinicByEmail resolves a practitioner SEATED at
 *     someone else's clinic to that employer's clinic — fine for "which hub do
 *     I render", catastrophic for anything that MUTATES the clinic (a comped
 *     plan, a cancelled subscription) on that person's behalf. Three call sites
 *     already re-check `clinic.email === email` inline for exactly this reason.
 *
 *  2. Errors PROPAGATE. Swallowing a DB error to `null` reads as "no clinic
 *     exists", so a caller whose next step is `createSstClinic` mints a
 *     DUPLICATE clinic and a second view key for a clinic that was already
 *     there — splitting one clinic's patients across two codes, silently.
 */
export async function getSstClinicOwnedByEmail(email: string): Promise<SstClinic | null> {
  const { rows } = await sql`
    SELECT code, clinic_name, contact_name, email, view_key, created_at, plan, tier,
           (to_jsonb(c) ->> 'included_until') AS included_until
    FROM sst_clinics c
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
    plan: r.plan || 'trial',
    tier: r.tier || null,
    includedUntil: r.included_until ?? null,
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
  // The INSERT is the CLAIM. Untargeted ON CONFLICT covers both the code
  // primary key and uniq_sst_clinics_email, and RETURNING tells us whether we
  // won. Losing means a concurrent caller minted this clinic between our read
  // and our write — the exact double-tap / two-tab race that used to produce a
  // second code and viewKey for one clinician, splitting their patients across
  // a clinic they can see and one they cannot.
  const { rows: claimed } = await sql`
    INSERT INTO sst_clinics (code, clinic_name, contact_name, email, view_key, created_at)
    VALUES (${code}, ${clinicName}, ${contactName}, ${email}, ${viewKey}, ${createdAt})
    ON CONFLICT DO NOTHING
    RETURNING code
  `
  if (claimed.length === 0) {
    // Somebody else won. Return THEIR clinic rather than a code we never
    // persisted — the caller is idempotent by contract and must receive the one
    // real clinic for this email. Do NOT write KV: the winner owns that key,
    // and getClinic falls back to Postgres if the winner hasn't landed it yet.
    const winner = await getSstClinicOwnedByEmail(email)
    if (winner) {
      console.warn(`[clinic-registry] concurrent create for ${email} — returning the winning clinic ${winner.code}`)
      return winner
    }
    // Conflicted on something other than email (a code collision that survived
    // the KV pre-check) — retrying with a fresh code is correct and terminates.
    throw new Error('Clinic code collision — retry provisioning')
  }

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

  return { code, clinicName, contactName, email, viewKey, createdAt, plan: 'trial', tier: null }
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

  return { code, clinicName, contactName, email, viewKey, createdAt, plan: 'trial', tier: null }
}

/** Admin listing (newest first). Empty array when the table doesn't exist yet. */
export async function listSstClinics(): Promise<SstClinic[]> {
  try {
    const { rows } = await sql`
      SELECT code, clinic_name, contact_name, email, view_key, created_at, plan, tier,
             (to_jsonb(c) ->> 'included_until') AS included_until
      FROM sst_clinics c
      ORDER BY created_at DESC
    `
    return rows.map((r) => ({
      code: r.code,
      clinicName: r.clinic_name,
      contactName: r.contact_name,
      email: r.email,
      viewKey: r.view_key,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      plan: r.plan || 'trial',
      tier: r.tier || null,
      includedUntil: r.included_until ?? null,
    }))
  } catch {
    return []
  }
}

/** Resolve the acting clinician's display name for a portal email at a clinic —
 *  owner name if it's the owner, else the seated member's name. Used to stamp
 *  report filing with WHO acted (2026-08-04 seats build). */
export async function resolveActingClinician(email: string, code: string): Promise<string | null> {
  const lower = email.toLowerCase()
  try {
    const { rows: owner } = await sql`
      SELECT contact_name FROM sst_clinics WHERE code = ${code} AND email = ${lower} LIMIT 1
    `
    if (owner[0]?.contact_name) return owner[0].contact_name
    const { rows: member } = await sql`
      SELECT name FROM sst_clinic_members
      WHERE clinic_code = ${code} AND email = ${lower} AND revoked_at IS NULL LIMIT 1
    `
    return member[0]?.name ?? null
  } catch {
    return null
  }
}


/** Server-side clinic profile — the ONE master input (letterhead, provider
 *  block, sign-off) every seat's documents share. localStorage was per-device
 *  (2026-08-05: 15 clinicians = 15 inconsistent letterheads). */
export interface ClinicDocProfile {
  clinic_name?: string
  clinician_name?: string
  ahpra_number?: string
  provider_number?: string
  clinic_address?: string
  clinic_phone?: string
}

export async function getClinicProfile(rawCode: unknown): Promise<ClinicDocProfile | null> {
  const code = normaliseClinicCode(rawCode)
  if (!code) return null
  try {
    const { rows } = await sql<{ profile: ClinicDocProfile | null }>`
      SELECT profile FROM sst_clinics WHERE code = ${code} LIMIT 1
    `
    return rows[0]?.profile ?? null
  } catch {
    return null
  }
}

export async function setClinicProfile(rawCode: unknown, profile: ClinicDocProfile): Promise<boolean> {
  const code = normaliseClinicCode(rawCode)
  if (!code || code === DEMO_CLINIC_CODE) return false
  const clean: ClinicDocProfile = {}
  for (const k of ['clinic_name', 'clinician_name', 'ahpra_number', 'provider_number', 'clinic_address', 'clinic_phone'] as const) {
    const v = profile[k]
    if (typeof v === 'string' && v.trim()) clean[k] = v.trim().slice(0, 200)
  }
  try {
    await ensureSstClinicsTable()
    await sql`UPDATE sst_clinics SET profile = ${JSON.stringify(clean)}::jsonb WHERE code = ${code}`
    return true
  } catch (err) {
    console.error('[clinic-registry] setClinicProfile failed:', err)
    return false
  }
}
