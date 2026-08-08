/**
 * PATIENT REGISTRY — the server side of patient identity.
 *
 * One row per patient per clinic. Created when the clinician adds the patient;
 * resolved when a patient types their code on any device. This is what turns a
 * reinstall from "new identity, empty history, re-enter everything" into "same
 * record, one field".
 *
 * See patient-identity.ts for why identity is a minted code rather than the
 * free-text label or the install UUID.
 */

import { sql } from '@/lib/db'
import {
  generatePatientCode,
  generateResearchRef,
  normalisePatientCode,
  type PatientIdentity,
} from './patient-identity'
import { normaliseClinicCode } from './clinic-registry'
import { AGE_BANDS, SEXES, RESEARCH_CONSENT_VERSION, type AgeBand, type Sex } from './research'

export interface PatientRecord extends PatientIdentity {
  ageBand: AgeBand | null
  sex: Sex | null
  researchConsentVersion: number | null
  createdAt: string
}

/**
 * LAZY MIGRATION, matching the sst_clinics pattern already in this codebase.
 * Every read that could hit a not-yet-migrated database goes through a guarded
 * path, because naming a column that does not exist makes Postgres reject the
 * whole statement rather than return NULL.
 */
export async function ensureSstPatientsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS sst_clinic_patients (
      clinic_code   TEXT NOT NULL,
      patient_code  TEXT NOT NULL,
      research_ref  TEXT NOT NULL,
      label         TEXT,
      age_band      TEXT,
      sex           TEXT,
      research_consent_version INTEGER,
      injury_days_at_intake    INTEGER,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (clinic_code, patient_code)
    )
  `
  // researchRef must be globally unique — it is the join key of every analysis,
  // and a duplicate would silently pool two people into one participant.
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS sst_patients_research_ref ON sst_clinic_patients (research_ref)`
}

/**
 * Create a patient and mint both keys. Retries on the (vanishingly unlikely)
 * code collision rather than returning a duplicate — 28^6 is ~480M, but a
 * collision here would merge two people's clinical records, so it is handled
 * explicitly rather than left to chance.
 */
export async function createPatient(
  rawClinicCode: unknown,
  label?: string | null,
): Promise<PatientRecord | null> {
  const clinicCode = normaliseClinicCode(rawClinicCode)
  if (!clinicCode) return null
  await ensureSstPatientsTable()

  for (let attempt = 0; attempt < 5; attempt++) {
    const patientCode = generatePatientCode()
    const researchRef = generateResearchRef()
    const { rowCount } = await sql`
      INSERT INTO sst_clinic_patients (clinic_code, patient_code, research_ref, label)
      VALUES (${clinicCode}, ${patientCode}, ${researchRef}, ${label?.trim() || null})
      ON CONFLICT (clinic_code, patient_code) DO NOTHING
    `
    if (rowCount) {
      return {
        clinicCode, patientCode, researchRef,
        label: label?.trim() || null,
        ageBand: null, sex: null, researchConsentVersion: null,
        createdAt: new Date().toISOString(),
      }
    }
  }
  console.error(`[sst-patients] could not mint a unique patient code for clinic ${clinicCode}`)
  return null
}

/**
 * Resolve a typed code to a patient. This is the whole "new device" path: the
 * patient types six characters and gets their record back.
 *
 * SCOPED TO THE CLINIC. A patient code is only meaningful inside its clinic, so
 * a code guessed or copied from elsewhere resolves to nothing rather than to
 * someone else's record.
 */
export async function resolvePatient(
  rawClinicCode: unknown,
  rawPatientCode: unknown,
): Promise<PatientRecord | null> {
  const clinicCode = normaliseClinicCode(rawClinicCode)
  const patientCode = normalisePatientCode(rawPatientCode)
  if (!clinicCode || !patientCode) return null
  try {
    const { rows } = await sql<{
      clinic_code: string; patient_code: string; research_ref: string; label: string | null
      age_band: string | null; sex: string | null; research_consent_version: number | null
      created_at: string
    }>`
      SELECT clinic_code, patient_code, research_ref, label, age_band, sex,
             research_consent_version, created_at
      FROM sst_clinic_patients
      WHERE clinic_code = ${clinicCode} AND patient_code = ${patientCode}
      LIMIT 1
    `
    const r = rows[0]
    if (!r) return null
    return {
      clinicCode: r.clinic_code,
      patientCode: r.patient_code,
      researchRef: r.research_ref,
      label: r.label,
      ageBand: (AGE_BANDS as readonly string[]).includes(r.age_band ?? '') ? (r.age_band as AgeBand) : null,
      sex: (SEXES as readonly string[]).includes(r.sex ?? '') ? (r.sex as Sex) : null,
      researchConsentVersion: r.research_consent_version,
      createdAt: r.created_at,
    }
  } catch {
    // Table not migrated yet → no patient, never a throw into a clinical path.
    return null
  }
}

/**
 * Record the one-screen intake. Demographics live here, on the patient, not on
 * every session row — they do not change between sessions and repeating them
 * would multiply the re-identification surface for no analytical gain.
 *
 * CONSENT IS WRITE-ONCE-FORWARD AND REVOCABLE TO NULL, never silently upgraded:
 * a version is only accepted if it is a real, current version. A client
 * claiming a version that does not exist is claiming agreement to wording that
 * was never shown, so it is stored as NULL (not enrolled) rather than trusted.
 */
export async function recordIntake(
  rawClinicCode: unknown,
  rawPatientCode: unknown,
  intake: {
    ageBand?: string | null
    sex?: string | null
    researchConsent?: boolean
    daysSinceInjury?: number | null
    label?: string | null
  },
): Promise<boolean> {
  const clinicCode = normaliseClinicCode(rawClinicCode)
  const patientCode = normalisePatientCode(rawPatientCode)
  if (!clinicCode || !patientCode) return false

  const ageBand = (AGE_BANDS as readonly string[]).includes(intake.ageBand ?? '') ? intake.ageBand : null
  const sex = (SEXES as readonly string[]).includes(intake.sex ?? '') ? intake.sex : null
  const consent = intake.researchConsent === true ? RESEARCH_CONSENT_VERSION : null
  const days =
    typeof intake.daysSinceInjury === 'number' &&
    Number.isInteger(intake.daysSinceInjury) &&
    intake.daysSinceInjury >= 0
      ? intake.daysSinceInjury
      : null

  try {
    await ensureSstPatientsTable()
    // COALESCE on the existing value: an intake screen that omits a field must
    // never blank one already recorded (a returning patient re-entering only
    // their code would otherwise erase their own demographics).
    await sql`
      UPDATE sst_clinic_patients SET
        age_band = COALESCE(${ageBand}, age_band),
        sex = COALESCE(${sex}, sex),
        research_consent_version = ${consent},
        injury_days_at_intake = COALESCE(${days}, injury_days_at_intake),
        label = COALESCE(${intake.label?.trim() || null}, label)
      WHERE clinic_code = ${clinicCode} AND patient_code = ${patientCode}
    `
    return true
  } catch (err) {
    console.error('[sst-patients] intake write failed:', err)
    return false
  }
}

/**
 * THE RESEARCH EXTRACT.
 *
 * The single place an analysis dataset is produced, so no ad-hoc query can
 * quietly widen the cohort or leak an identifier.
 *
 * WHAT IT DROPS, and why each matters:
 *   clinic_code    — a clinic plus a date is close to re-identifying in one city
 *   patient_code   — the clinic holds the code→name mapping
 *   patient_label  — a name
 *   created_at     — replaced by days-since-injury; an exact session timestamp
 *                    plus a small clinic re-identifies almost as well as a name
 *
 * WHAT IT KEEPS: researchRef, the covariates, and the session measurements.
 * Only patients with a recorded consent version appear at all.
 */
export interface ResearchRow {
  researchRef: string
  ageBand: string | null
  sex: string | null
  condition: string | null
  daysSinceInjury: number | null
  hrtBpm: number | null
  bandLow: number | null
  bandHigh: number | null
  sessionType: string | null
  payload: Record<string, unknown>
}

export async function researchExtract(minConsentVersion = 1): Promise<ResearchRow[]> {
  try {
    const { rows } = await sql<{
      research_ref: string; age_band: string | null; sex: string | null
      condition: string | null; days_since_injury: number | null
      hrt_bpm: number | null; band_low: number | null; band_high: number | null
      session_type: string | null; payload: Record<string, unknown>
    }>`
      SELECT p.research_ref, p.age_band, p.sex,
             s.condition,
             (s.payload->>'daysSinceInjury')::int AS days_since_injury,
             s.hrt_bpm, s.band_low, s.band_high, s.session_type, s.payload
      FROM sst_clinic_sessions s
      JOIN sst_clinic_patients p
        ON p.clinic_code = s.clinic_code
       AND p.patient_code = s.payload->>'patientCode'
      WHERE p.research_consent_version IS NOT NULL
        AND p.research_consent_version >= ${minConsentVersion}
      ORDER BY p.research_ref, s.created_at ASC
    `
    return rows.map((r) => ({
      researchRef: r.research_ref,
      ageBand: r.age_band,
      sex: r.sex,
      condition: r.condition,
      daysSinceInjury: r.days_since_injury,
      hrtBpm: r.hrt_bpm,
      bandLow: r.band_low,
      bandHigh: r.band_high,
      sessionType: r.session_type,
      // Strip anything identifying that rode along inside the payload blob.
      payload: stripIdentifiers(r.payload),
    }))
  } catch (err) {
    console.error('[sst-research] extract failed:', err)
    return []
  }
}

/**
 * The payload is a free-form jsonb blob written by the client, so an extract
 * that returned it verbatim would leak whatever a future client happens to put
 * there. Denylist the known identifiers AND anything name-shaped, and fail
 * toward dropping rather than keeping.
 */
const IDENTIFYING_KEYS = new Set([
  'patientCode', 'patientRef', 'patientName', 'patientLabel', 'label',
  'clinicCode', 'clinicName', 'email', 'phone', 'dob', 'dateOfBirth', 'injuryDate',
  'syncId', 'researchRef',
])

export function stripIdentifiers(payload: Record<string, unknown> | null): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(payload ?? {})) {
    if (IDENTIFYING_KEYS.has(k)) continue
    if (/name|email|phone|birth|address/i.test(k)) continue
    out[k] = v
  }
  return out
}
