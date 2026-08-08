/**
 * PATIENT IDENTITY — the stable key a clinical record needs and the pseudonym
 * a publication needs, minted once, from one place.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS.
 *
 * Identity used to rest on two things, and both are wrong for a medicolegal
 * record:
 *
 *  1. `patient_label` — free text the clinic types. Two patients at one clinic
 *     entered as "John S" collapse into ONE record, because every lookup
 *     case-folds the label and matches on it. At a large service, duplicate
 *     first-name-plus-initial is not hypothetical, and the failure is silent:
 *     patient A's threshold trajectory appears in patient B's report.
 *
 *  2. `patientRef` — an INSTALL UUID. The same human on a phone and a laptop is
 *     two refs; a reinstall is a third. The report query matches ref-first, so
 *     a report pulled for one device SILENTLY OMITS sessions logged on the
 *     other, while presenting itself as the record of care. The billing counter
 *     already resolves ref→label and counts them as one human, so the system
 *     was simultaneously treating one patient as one (for money) and as several
 *     (for the clinical document).
 *
 * THE FIX: a clinic-scoped PATIENT CODE that is neither typed prose nor tied to
 * a device. The clinician mints it once when the patient is added. The patient
 * enters it once; the app stores it; a new device or a reinstall re-enters the
 * same code and rejoins the same record.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THREE KEYS, THREE JOBS. Keeping them separate is what makes de-identification
 * real rather than promised.
 *
 *   clinicCode    tenancy   — who is billed, whose roster. Shared, on the QR card.
 *   patientCode   identity  — which human. Clinic-scoped, opaque, stable.
 *                             The clinic CAN map it to a name; that is its job.
 *   researchRef   pseudonym — which participant, in an analysis. The clinic
 *                             CANNOT map it. Never shown in any clinic UI.
 *
 * A research export carries `researchRef` and drops `clinicCode`,
 * `patientCode` and `patient_label`. Because the clinic never sees researchRef,
 * a clinician cannot re-identify a published row even from their own patient
 * list — which is the property an HREC will ask about, and the reason
 * researchRef is a fresh random value rather than a hash of the patient code.
 * A hash would be reversible by anyone holding the code list: the clinic.
 */

import crypto from 'crypto'

/**
 * Code alphabet: digits and uppercase letters with the ambiguous glyphs
 * removed (no O/0, I/1, S/5, Z/2). These get read off a screen, said aloud in
 * a clinic, and typed by someone with a headache — transcription errors here
 * silently create a SECOND record for an existing patient, which is the exact
 * failure this module exists to prevent.
 */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRTUVWXY346789'
const PATIENT_CODE_LEN = 6

/** Mint a patient code. Collisions are handled by the caller's unique index. */
export function generatePatientCode(): string {
  let out = ''
  for (let i = 0; i < PATIENT_CODE_LEN; i++) out += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]
  return out
}

/**
 * Normalise a typed patient code. Case-folds, strips spaces and hyphens (people
 * write "4B7K-QM"), and maps the ambiguous glyphs onto their intended member of
 * the alphabet so a patient who types O for Q or 1 for L still lands on their
 * own record rather than on nothing.
 *
 * Returns '' for anything that is not a well-formed code — callers must treat
 * '' as "no identity", never as a wildcard.
 */
export function normalisePatientCode(raw: unknown): string {
  const s = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, 'Q')
    .replace(/0/g, 'Q')
    .replace(/[I1]/g, 'L')
    .replace(/[S5]/g, '4')
    .replace(/[Z2]/g, '3')
  if (s.length !== PATIENT_CODE_LEN) return ''
  for (const ch of s) if (!CODE_CHARS.includes(ch)) return ''
  return s
}

/**
 * Mint a research pseudonym. Deliberately RANDOM, not derived from the patient
 * code — see the header. Minting one for every patient at creation costs
 * nothing, discloses nothing, and is what makes a later consent (or an HREC
 * waiver) able to reach data already collected. Without it the back catalogue
 * is permanently unusable no matter what anyone later agrees to.
 */
export function generateResearchRef(): string {
  return crypto.randomUUID()
}

/**
 * A patient as the system knows them. `label` is DISPLAY ONLY from here on —
 * it is what the clinician reads in their dashboard, and it must never again be
 * used to decide which rows belong to whom.
 */
export interface PatientIdentity {
  clinicCode: string
  patientCode: string
  researchRef: string
  label: string | null
}

/**
 * Fields that may be attached to a session for research. All optional; a clinic
 * that never enrols anyone keeps working exactly as before.
 *
 * Demographics live on the PATIENT, not the session — they do not change
 * between sessions, and duplicating them per row would multiply the
 * re-identification surface for no analytical gain.
 */
export interface PatientResearchProfile {
  /** Band, never a birth date. See research.ts. */
  ageBand: string | null
  sex: string | null
  /** Consent version at enrolment; null = not enrolled, excluded from extracts. */
  researchConsentVersion: number | null
  /** ISO date, stored ONLY on the client. The server receives days, not dates. */
  injuryDateLocalOnly?: never
}

/**
 * THE INTAKE CONTRACT — everything asked of a patient, once, on one screen.
 *
 * Deliberately five controls. Every field here was justified against a specific
 * analysis it enables; anything that could be supplied by the clinician later
 * was pushed to the clinician (prior concussion count, for instance, which a
 * patient reports unreliably anyway).
 *
 *   patientCode   identity      — the only thing that MUST be right
 *   injuryDate    covariate     — days-since-injury is the dominant covariate in
 *                                 concussion recovery. Without it a threshold
 *                                 trajectory cannot be separated from natural
 *                                 history and the dataset is uninterpretable.
 *                                 Converted to an integer on-device; the date
 *                                 itself is never transmitted.
 *   ageBand       covariate     — adolescents recover differently from adults.
 *   sex           covariate     — established recovery modifier.
 *   researchConsent  permission — separate from the QA consent, opt-in.
 *
 * ORDER MATTERS: consent is asked LAST, after the patient has seen exactly what
 * is collected. Asking first, before they know what they are agreeing to, is
 * both worse ethics and a worse consent rate.
 */
export const INTAKE_FIELDS = [
  'patientCode',
  'injuryDate',
  'ageBand',
  'sex',
  'researchConsent',
] as const
export type IntakeField = (typeof INTAKE_FIELDS)[number]

/**
 * Asked ONCE. A returning patient is resolved from stored state and never sees
 * this again — and a patient on a NEW device re-enters only `patientCode`,
 * because the demographics already exist server-side against that code.
 *
 * This is the whole point of separating identity from the install: re-onboarding
 * used to mean re-entering everything AND getting a new identity, which both
 * annoyed the patient and split their clinical record.
 */
export const INTAKE_FIELDS_ON_NEW_DEVICE: readonly IntakeField[] = ['patientCode']
