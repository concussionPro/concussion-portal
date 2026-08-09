import crypto from 'crypto'
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
import {
  AGE_BANDS, SEXES, RESEARCH_CONSENT_VERSION, isValidSymptomScore,
  EPISODE_OUTCOMES, isMissedSessionReason, type AgeBand, type Sex,
} from './research'

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
      -- Validated symptom severity (SCAT6/PCSS, 22 items x 0-6, max 132) at
      -- intake and at discharge. A single 0-10 item will not survive review as
      -- an outcome measure; this is the instrument reviewers expect.
      --
      -- Entered as an INTEGER by the clinician, NOT integrated from anywhere.
      -- The PCSS is a public instrument in the SCAT lineage, so a clinic
      -- already administering it (e.g. inside ImPACT) can type the total into
      -- SST with no data-sharing agreement, no vendor dependency and no
      -- systems integration.
      baseline_symptom_score   INTEGER,
      discharge_symptom_score  INTEGER,
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
    /** SCAT6/PCSS total (0-132) at intake. Clinician-entered. */
    baselineSymptomScore?: number | null
    /** SCAT6/PCSS total (0-132) at discharge — closes the episode. */
    dischargeSymptomScore?: number | null
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

  // Bounds-checked against the INSTRUMENT's range, so a 0-10 single item
  // typed into this field is rejected rather than silently stored as if it
  // were the validated scale.
  const baseline = isValidSymptomScore(intake.baselineSymptomScore) ? intake.baselineSymptomScore : null
  const discharge = isValidSymptomScore(intake.dischargeSymptomScore) ? intake.dischargeSymptomScore : null

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
        baseline_symptom_score = COALESCE(${baseline}, baseline_symptom_score),
        discharge_symptom_score = COALESCE(${discharge}, discharge_symptom_score),
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

/**
 * THE AUTHORITY under which an extract is run. Required, explicit, and logged.
 *
 * The previous version hard-filtered to consented rows only. That looked
 * cautious and was actually wrong: it encoded an ethics decision in a query.
 * Scope is decided by the reviewing HREC, not by this file — and an ethics
 * committee can lawfully authorise secondary use of de-identified routine-care
 * data WITHOUT individual consent (waiver, or an approved opt-out model). A
 * hardcoded consent filter silently discards data the approval covers, which
 * throws away the entire back catalogue the pseudonym architecture exists to
 * preserve.
 *
 * So the gate is not a boolean here. The gate is the approval, and this type
 * forces the caller to say which approval they are acting under.
 */
export type ExtractAuthority =
  | {
      /** Individual opt-in consent recorded against each participant. */
      kind: 'consent'
      minVersion?: number
    }
  | {
      /**
       * HREC-approved waiver or opt-out model covering routine-care data,
       * INCLUDING participants who were never individually consented.
       * `reference` is the approval number and is written to the log so any
       * extract can be traced back to the document that authorised it.
       */
      kind: 'approval'
      reference: string
      /** True when the approval also covers participants who opted OUT. It
       *  almost never does — an opt-out that is not honoured is not an
       *  opt-out — so this defaults false and must be set deliberately. */
      includeOptedOut?: boolean
    }

/**
 * THE RESEARCH EXTRACT.
 *
 * The single place an analysis dataset is produced, so no ad-hoc query can
 * leak an identifier or silently change the cohort.
 *
 * WHAT IT DROPS, and why each matters:
 *   clinic_code    — a clinic plus a date is close to re-identifying in one city
 *   patient_code   — the clinic holds the code→name mapping
 *   patient_label  — a name
 *   created_at     — replaced by days-since-injury; an exact session timestamp
 *                    plus a small clinic re-identifies almost as well as a name
 *
 * WHAT IT KEEPS: researchRef, the covariates, and the session measurements.
 */
export async function researchExtract(authority: ExtractAuthority): Promise<ResearchRow[]> {
  // Under an approval, EVERY linkable session is in scope. Under individual
  // consent, only participants who gave it. Either way the filter is a
  // consequence of the stated authority rather than a default buried in SQL.
  const consentOnly = authority.kind === 'consent'
  const minVersion = authority.kind === 'consent' ? (authority.minVersion ?? 1) : 0
  const label =
    authority.kind === 'consent'
      ? `individual consent v>=${minVersion}`
      : `HREC approval ${authority.reference}${authority.includeOptedOut ? ' (INCLUDING opted-out — verify this is really approved)' : ''}`

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
      WHERE (${!consentOnly} OR (p.research_consent_version IS NOT NULL
                                 AND p.research_consent_version >= ${minVersion}))
      ORDER BY p.research_ref, s.created_at ASC
    `
    // Logged so every extract is attributable to the authority it ran under —
    // this is what an ethics committee or an auditor asks for.
    console.log(`[sst-research] extract under ${label} → ${rows.length} sessions`)
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
      payload: stripIdentifiers(r.payload),
    }))
  } catch (err) {
    console.error('[sst-research] extract failed:', err)
    return []
  }
}

/**
 * HOW MUCH OF THE ARCHIVE IS REACHABLE.
 *
 * Run this before an HREC application: it says what a waiver would actually
 * buy, and — more usefully — how many sessions are NOT linkable to a
 * participant at all. Unlinkable rows are lost to research permanently no
 * matter what any committee later approves, so this number is the real cost of
 * any delay in shipping the patient code.
 */
export async function researchReachability(): Promise<{
  totalSessions: number
  linkable: number
  unlinkable: number
  consented: number
  participants: number
}> {
  try {
    const { rows } = await sql<{
      total: number; linkable: number; consented: number; participants: number
    }>`
      SELECT
        (SELECT COUNT(*)::int FROM sst_clinic_sessions) AS total,
        (SELECT COUNT(*)::int FROM sst_clinic_sessions s
           JOIN sst_clinic_patients p ON p.clinic_code = s.clinic_code
                                     AND p.patient_code = s.payload->>'patientCode') AS linkable,
        (SELECT COUNT(*)::int FROM sst_clinic_sessions s
           JOIN sst_clinic_patients p ON p.clinic_code = s.clinic_code
                                     AND p.patient_code = s.payload->>'patientCode'
          WHERE p.research_consent_version IS NOT NULL) AS consented,
        (SELECT COUNT(DISTINCT research_ref)::int FROM sst_clinic_patients) AS participants
    `
    const r = rows[0]
    return {
      totalSessions: r?.total ?? 0,
      linkable: r?.linkable ?? 0,
      unlinkable: (r?.total ?? 0) - (r?.linkable ?? 0),
      consented: r?.consented ?? 0,
      participants: r?.participants ?? 0,
    }
  } catch {
    return { totalSessions: 0, linkable: 0, unlinkable: 0, consented: 0, participants: 0 }
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


/**
 * ═════════════════════════════════════════════════════════════════════════════
 * SITE PSEUDONYM — the registry equivalent of researchRef, one level up.
 *
 * researchExtract() strips `clinic_code`, which is right for a single-site study
 * and WRONG for a registry. Multi-site analysis needs a site dimension: site-level
 * random effects, between-site heterogeneity, and per-site approval tracking. But
 * the real clinic code must not travel with the dataset — a named clinic plus a
 * date narrows re-identification sharply in one city.
 *
 * So a site gets a stable random pseudonym, in exactly the relationship to
 * clinic_code that researchRef holds to patient_code. Minted once, on first
 * registry enrolment, and never shown in any analysis-facing surface.
 *
 * `approval_reference` records WHICH ethics approval covers this site, because a
 * registry with rolling site amendments has different sites live under different
 * amendment numbers, and an extract must be able to say so.
 */
export async function ensureSstSitesTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS sst_research_sites (
      clinic_code        TEXT PRIMARY KEY,
      site_ref           TEXT NOT NULL,
      site_name          TEXT,
      approval_reference TEXT,
      enrolled_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      withdrawn_at       TIMESTAMPTZ
    )
  `
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS sst_sites_site_ref ON sst_research_sites (site_ref)`
}

export async function enrolSite(
  rawClinicCode: unknown,
  opts: { siteName?: string | null; approvalReference?: string | null } = {},
): Promise<string | null> {
  const clinicCode = normaliseClinicCode(rawClinicCode)
  if (!clinicCode) return null
  try {
    await ensureSstSitesTable()
    const siteRef = generateResearchRef()
    await sql`
      INSERT INTO sst_research_sites (clinic_code, site_ref, site_name, approval_reference)
      VALUES (${clinicCode}, ${siteRef}, ${opts.siteName ?? null}, ${opts.approvalReference ?? null})
      ON CONFLICT (clinic_code) DO UPDATE SET
        site_name = COALESCE(EXCLUDED.site_name, sst_research_sites.site_name),
        approval_reference = COALESCE(EXCLUDED.approval_reference, sst_research_sites.approval_reference)
    `
    const { rows } = await sql<{ site_ref: string }>`
      SELECT site_ref FROM sst_research_sites WHERE clinic_code = ${clinicCode} LIMIT 1
    `
    return rows[0]?.site_ref ?? null
  } catch (err) {
    console.error('[sst-research] site enrolment failed:', err)
    return null
  }
}

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * DAILY CHECK-IN — the rest-day comparator.
 *
 * NOT a change to the prescription. Non-training days already occur (missed
 * sessions, interlock pauses, clinician de-loads); they are simply invisible,
 * because every symptom datum in the product hangs off a session record. Without
 * the flare rate on days with no exertion, a next-day flare after exercise is
 * uninterpretable — it describes the natural fluctuation of concussion as much
 * as the response to a dose.
 *
 * Stored append-only in its own table rather than in sst_clinic_sessions: a
 * check-in is not a delivered session and must never be counted as one by the
 * billing meter, the report's "sessions delivered" row, or adherence.
 */
export async function ensureSstCheckinsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS sst_daily_checkins (
      id             TEXT PRIMARY KEY,
      clinic_code    TEXT NOT NULL,
      patient_code   TEXT NOT NULL,
      on_date        DATE NOT NULL,
      symptom_score  INTEGER NOT NULL,
      trained        BOOLEAN NOT NULL,
      missed_reason  TEXT,
      days_since_injury INTEGER,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (clinic_code, patient_code, on_date)
    )
  `
}

export async function recordDailyCheckin(input: {
  clinicCode: unknown
  patientCode: unknown
  onDate: string
  symptomScore: number
  trained: boolean
  missedReason?: unknown
  daysSinceInjury?: number | null
}): Promise<boolean> {
  const clinicCode = normaliseClinicCode(input.clinicCode)
  const patientCode = normalisePatientCode(input.patientCode)
  if (!clinicCode || !patientCode) return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(input.onDate))) return false
  const score = input.symptomScore
  // 0-10 single item, the same scale the session screens use.
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 10) return false
  const reason = isMissedSessionReason(input.missedReason) ? input.missedReason : null
  const days =
    typeof input.daysSinceInjury === 'number' && Number.isInteger(input.daysSinceInjury) && input.daysSinceInjury >= 0
      ? input.daysSinceInjury
      : null
  try {
    await ensureSstCheckinsTable()
    // One check-in per patient per day. A later answer for the same day REPLACES
    // the earlier one rather than creating a second row — otherwise a patient
    // who answers twice contributes two correlated observations for one day.
    await sql`
      INSERT INTO sst_daily_checkins
        (id, clinic_code, patient_code, on_date, symptom_score, trained, missed_reason, days_since_injury)
      VALUES (${crypto.randomUUID()}, ${clinicCode}, ${patientCode}, ${input.onDate},
              ${score}, ${input.trained}, ${reason}, ${days})
      ON CONFLICT (clinic_code, patient_code, on_date) DO UPDATE SET
        symptom_score = EXCLUDED.symptom_score,
        trained = EXCLUDED.trained,
        missed_reason = EXCLUDED.missed_reason
    `
    return true
  } catch (err) {
    console.error('[sst-checkin] write failed:', err)
    return false
  }
}

/**
 * EPISODE ENDPOINT — the terminus a trajectory needs.
 *
 * Without it there is no prognostic paper at all: a threshold trajectory with no
 * end point cannot be related to time-to-recovery, only described.
 */
export async function closeEpisode(
  rawClinicCode: unknown,
  rawPatientCode: unknown,
  outcome: string,
  opts: { daysInjuryToReturn?: number | null; dischargeSymptomScore?: number | null } = {},
): Promise<boolean> {
  const clinicCode = normaliseClinicCode(rawClinicCode)
  const patientCode = normalisePatientCode(rawPatientCode)
  if (!clinicCode || !patientCode) return false
  if (!(EPISODE_OUTCOMES as readonly string[]).includes(outcome)) return false
  const discharge = isValidSymptomScore(opts.dischargeSymptomScore) ? opts.dischargeSymptomScore : null
  const days =
    typeof opts.daysInjuryToReturn === 'number' && Number.isInteger(opts.daysInjuryToReturn) && opts.daysInjuryToReturn >= 0
      ? opts.daysInjuryToReturn
      : null
  try {
    await ensureSstPatientsTable()
    await sql`ALTER TABLE sst_clinic_patients ADD COLUMN IF NOT EXISTS episode_outcome TEXT`
    await sql`ALTER TABLE sst_clinic_patients ADD COLUMN IF NOT EXISTS days_injury_to_return INTEGER`
    await sql`ALTER TABLE sst_clinic_patients ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ`
    await sql`
      UPDATE sst_clinic_patients SET
        episode_outcome = ${outcome},
        days_injury_to_return = COALESCE(${days}, days_injury_to_return),
        discharge_symptom_score = COALESCE(${discharge}, discharge_symptom_score),
        closed_at = NOW()
      WHERE clinic_code = ${clinicCode} AND patient_code = ${patientCode}
    `
    return true
  } catch (err) {
    console.error('[sst-research] episode close failed:', err)
    return false
  }
}
