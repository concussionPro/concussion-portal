/**
 * SST Trainer — Practice-Management-System (PMS) adapter CONTRACT.
 *
 * This is the anti-bloat seam. The SST reporting layer NEVER talks to a specific
 * PMS; it talks only to `PmsAdapter`. Adding Cliniko, Gensolve, Nookal, Halaxy,
 * Best Practice, etc. is a new file that implements this interface plus one line
 * in the `getAdapter` registry — ZERO change to the core, the report skins, or
 * any route.
 *
 * ISOLATION: this module is intentionally standalone (no imports from the live
 * SST app, no route wiring). It defines the shape only; the concrete adapters
 * (`cliniko.ts`, `gensolve.ts`) contain the minimal, documented fetch calls.
 *
 * Every method is async and returns a RESULT rather than throwing on the
 * expected failure modes (not-configured, auth, HTTP). Uncaught throws are for
 * genuinely exceptional bugs only — a missing key must never crash a caller.
 */

/** A patient/client as the PMS models it — the demographic subset SST needs. */
export interface PmsPatient {
  id: string
  firstName: string
  lastName: string
  dob?: string
  /**
   * Free-text ethnicity as the PMS stores it. Load-bearing for NZ/ACC reporting
   * (Māori/Pacific outcome equity fields); usually absent in AU systems.
   */
  ethnicity?: string
}

/** A clinical note to write back to the patient record. */
export interface PmsNote {
  title: string
  body: string
  /** ISO 8601 timestamp of when the clinical event occurred. */
  occurredAt: string
}

/** A generated PDF (report skin rendered to bytes elsewhere) to file on the record. */
export interface PmsPdf {
  filename: string
  bytes: Uint8Array
}

/** An appointment as surfaced by attendance polling (the no-webhooks fallback). */
export interface PmsAppointment {
  id: string
  patientId: string
  /** true = attended; false = did-not-arrive / cancelled (drives ACC885 etc.). */
  attended: boolean
  /** ISO 8601 appointment start. */
  at: string
}

/** Uniform write-back result — `ok:false` carries a human-readable `error`. */
export interface PmsWriteResult {
  ok: boolean
  id?: string
  error?: string
}

/**
 * The single seam every PMS integration implements. Keep it small on purpose:
 * SST only needs to find a patient, read demographics, write a note, attach a
 * PDF, and (optionally) learn whether an appointment was attended.
 */
export interface PmsAdapter {
  /** Stable identifier for logging / UI ('cliniko', 'gensolve', …). */
  readonly name: string

  /** Search patients by free-text query (name, DOB, etc.). */
  findPatient(query: string): Promise<PmsPatient[]>

  /** Read a single patient's demographics, or null if not found. */
  readDemographics(id: string): Promise<PmsPatient | null>

  /** Write a clinical note to the patient record. */
  writeNote(patientId: string, note: PmsNote): Promise<PmsWriteResult>

  /** File a generated PDF against the patient record. */
  attachPdf(patientId: string, pdf: PmsPdf): Promise<PmsWriteResult>

  /**
   * Poll for appointment attendance since an ISO timestamp. OPTIONAL — present
   * only on adapters whose PMS exposes an appointments endpoint. There are NO
   * webhooks in this design; attendance is discovered by polling.
   */
  pollAppointments?(sinceISO: string): Promise<PmsAppointment[]>
}

/** Which PMS an adapter targets. Extend the union to add an integration. */
export type PmsKind = 'cliniko' | 'gensolve' | 'pracsuite' | 'coreplus'

/**
 * Connection config. Region/shard is encoded differently per PMS (Cliniko folds
 * it into the API key; Gensolve uses a fixed host), so the base URL is optional
 * and each adapter derives its own when omitted.
 */
export interface PmsAdapterConfig {
  /** API key / token. HTTP-Basic username for Cliniko; bearer/API key elsewhere. */
  apiKey?: string
  /** Optional explicit base URL override (e.g. a sandbox host). */
  baseUrl?: string
  /** Optional additional credentials some PMSs require (e.g. practice id). */
  creds?: Record<string, string>
  /** User-Agent contact string — Cliniko REQUIRES an identifying UA. */
  userAgent?: string
}

import { ClinikoAdapter } from './cliniko'
import { GensolveAdapter } from './gensolve'
import { PracsuiteAdapter } from './pracsuite'
import { CoreplusAdapter } from './coreplus'

/**
 * Adapter registry — the ONE place that knows the concrete adapters. A new PMS
 * = one new import + one case here. ZERO change to callers or report skins.
 */
export function getAdapter(kind: PmsKind, config: PmsAdapterConfig): PmsAdapter {
  switch (kind) {
    case 'cliniko':
      return new ClinikoAdapter(config)
    case 'gensolve':
      return new GensolveAdapter(config)
    // NOT yet surfaced in PmsConnect — validate every VERIFY marker on a
    // sandbox/trial tenant first (feedback: never declare a path clean from
    // idealized tests).
    case 'pracsuite':
      return new PracsuiteAdapter(config)
    case 'coreplus':
      return new CoreplusAdapter(config)
    default: {
      // Exhaustiveness guard — a new PmsKind without a case is a compile error.
      const _never: never = kind
      throw new Error(`Unknown PMS kind: ${String(_never)}`)
    }
  }
}
