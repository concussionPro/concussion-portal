/**
 * Red-flag / review ACKNOWLEDGEMENTS — per clinic, server-side.
 *
 * The Clinical Hub's escalation ladder raises an URGENT (red-flag) or REVIEW
 * (flare / symptom-stopped / overrode-stop / next-day flare / aborted test)
 * banner on a patient until a clinician marks it reviewed. That acknowledgement
 * used to live in localStorage, which meant:
 *   - clinician A acknowledging on her laptop left the other 14 seats still
 *     seeing the URGENT banner (and, worse, made it look handled to nobody);
 *   - there was NO record of who reviewed what, or when — the exact thing a
 *     supervision surface must be able to answer.
 *
 * One row per (clinic_code, patient_key, date_key). `patient_key` is the same
 * identity the hub groups on — the install-UUID patientRef, or `label:<name>`
 * for pre-patientRef rows. `date_key` is the escalating EVENT's date, so a NEW
 * red flag on a later date raises a fresh banner instead of inheriting the old
 * acknowledgement. Re-acknowledging is idempotent and keeps the FIRST reviewer
 * (the audit answer is "who reviewed it", not "who clicked it last").
 *
 * The localStorage copy stays, as an optimistic cache only.
 */

import { sql } from '@/lib/db'

export interface ClinicAck {
  patientKey: string
  dateKey: string
  acknowledgedBy: string | null
  acknowledgedAt: string
}

let tableEnsured = false
async function ensureTable(): Promise<void> {
  if (tableEnsured) return
  await sql`
    CREATE TABLE IF NOT EXISTS sst_clinic_acks (
      clinic_code TEXT NOT NULL,
      patient_key TEXT NOT NULL,
      date_key TEXT NOT NULL,
      acknowledged_by TEXT,
      acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (clinic_code, patient_key, date_key)
    )
  `
  tableEnsured = true
}

/** Trim + bound a free-text key so a crafted client can't write unbounded rows. */
function key(v: unknown, max = 120): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

/**
 * Every acknowledgement on record for a clinic. Read alongside the roster so
 * the hub renders the same banner state for every seat.
 *
 * NEVER THROWS: an ack store that is unavailable must not take the roster down
 * with it — the caller falls back to "nothing acknowledged", which shows the
 * banner. Fail-loud is the safe direction for a clinical escalation.
 */
export async function listClinicAcks(clinicCode: string): Promise<ClinicAck[]> {
  const code = clinicCode.trim().toUpperCase()
  if (!code) return []
  try {
    await ensureTable()
    const { rows } = await sql<{
      patient_key: string
      date_key: string
      acknowledged_by: string | null
      acknowledged_at: Date | string
    }>`
      SELECT patient_key, date_key, acknowledged_by, acknowledged_at
      FROM sst_clinic_acks WHERE clinic_code = ${code}
    `
    return rows.map((r) => ({
      patientKey: r.patient_key,
      dateKey: r.date_key,
      acknowledgedBy: r.acknowledged_by,
      acknowledgedAt:
        r.acknowledged_at instanceof Date ? r.acknowledged_at.toISOString() : String(r.acknowledged_at),
    }))
  } catch (err) {
    console.error('[clinic-acks] list failed:', err)
    return []
  }
}

/**
 * Record an acknowledgement. Idempotent: a second clinician marking the same
 * event reviewed does NOT overwrite the first reviewer or the first timestamp.
 * Returns the ack now on record (the caller echoes it back to the UI).
 */
export async function recordClinicAck(args: {
  clinicCode: string
  patientKey: string
  dateKey: string
  acknowledgedBy?: string | null
}): Promise<ClinicAck | null> {
  const code = args.clinicCode.trim().toUpperCase()
  const patientKey = key(args.patientKey)
  const dateKey = key(args.dateKey, 60)
  if (!code || !patientKey || !dateKey) return null
  const by = key(args.acknowledgedBy, 120) || null
  await ensureTable()
  const { rows } = await sql<{
    patient_key: string
    date_key: string
    acknowledged_by: string | null
    acknowledged_at: Date | string
  }>`
    INSERT INTO sst_clinic_acks (clinic_code, patient_key, date_key, acknowledged_by)
    VALUES (${code}, ${patientKey}, ${dateKey}, ${by})
    ON CONFLICT (clinic_code, patient_key, date_key) DO UPDATE
      -- no-op update so RETURNING gives back the row that was already there
      SET acknowledged_by = sst_clinic_acks.acknowledged_by
    RETURNING patient_key, date_key, acknowledged_by, acknowledged_at
  `
  const r = rows[0]
  if (!r) return null
  return {
    patientKey: r.patient_key,
    dateKey: r.date_key,
    acknowledgedBy: r.acknowledged_by,
    acknowledgedAt:
      r.acknowledged_at instanceof Date ? r.acknowledged_at.toISOString() : String(r.acknowledged_at),
  }
}
