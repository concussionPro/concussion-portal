/**
 * Gensolve (Practice Manager) PMS adapter — NZ, ACC-integrated.
 *
 * Gensolve is the dominant NZ physiotherapy PMS and carries the ACC claim
 * context SST reporting needs for the NZ jurisdiction (ACC45/claim number, the
 * S60.. read-code diagnosis, insurer=ACC funding, attendance for ACC885).
 *
 * CONFIRMED against Gensolve's public help centre (docs.gensolve.com, GPM API):
 *  - BASE hosts are per-region tenants: `https://nzgpm.gensolve.com/api/` (NZ)
 *    and `https://augpm.gensolve.com/api/` (AU). NZ is the ACC jurisdiction.
 *  - AUTH: a per-practice Secret Key + an API User account are exchanged for an
 *    authorization (bearer) token; the tenant must have API access enabled and
 *    the caller's IP whitelisted. We carry the issued token as `apiKey`.
 *  - Resources are grouped and expose GET/POST/PUT; a documented appointments
 *    resource is `GET /appointments/by_date`.
 *
 * NOT PUBLICLY DOCUMENTED (the OpenAPI.json + per-resource schemas live behind
 * the tenant-auth, IP-whitelisted `/api/` portal, so they can't be read here):
 * the exact clients-search / conditions filter params, the clinical-note POST
 * resource + payload, and the document-upload contract. Everything below marked
 * `// VERIFY:` is a defensible best-effort that MUST be confirmed on a sandbox
 * tenant before production use — it has NOT been smoke-tested against live GPM.
 *
 * Endpoints used:
 *  - GET  /conditions        — ReadCodeList; filter insurer=ACC to pull the ACC
 *                               claim number + S60.. read code (the diagnosis).
 *  - GET  /clients           — demographics incl. ethnicity (ACC equity).
 *  - GET  /appointments/by_date — attendance; drives ACC885 attended-sessions.
 *  - POST /notes             — write-back of the SST outcome note (VERIFY).
 *  - POST /documents         — file the report PDF (VERIFY; gated off).
 *
 * NO not-configured throws: without a key every method returns a clear error
 * (write methods) or an empty result (read methods).
 */

import type {
  PmsAdapter,
  PmsAdapterConfig,
  PmsAppointment,
  PmsNote,
  PmsPatient,
  PmsPdf,
  PmsWriteResult,
} from './adapter'

const NOT_CONFIGURED = 'gensolve: not configured (no API key)'
const DEFAULT_BASE = 'https://nzgpm.gensolve.com/api'

/** A concussion condition + its ACC context, resolved from /conditions. */
export interface GensolveAccCondition {
  conditionId: string
  /** ACC claim number (ACC45), when the condition is ACC-funded. */
  accClaimNumber: string | null
  /** READ-code diagnosis, e.g. an S60.. concussion/head-injury code. */
  readCode: string | null
  readCodeText: string | null
}

export class GensolveAdapter implements PmsAdapter {
  readonly name = 'gensolve'
  /**
   * Flip to true ONLY once the Gensolve documents-resource contract (path,
   * multipart-vs-base64, field names) is confirmed against a sandbox tenant's
   * OpenAPI.json. Until then attachPdf refuses rather than guessing a binary
   * upload shape and pretending it works. Typed `boolean` (not the `false`
   * literal) so the gated code path stays type-checked and reachable-in-type.
   */
  private static readonly UPLOAD_CONTRACT_CONFIRMED: boolean = false
  private readonly apiKey: string | null
  private readonly baseUrl: string
  private readonly practiceId: string | null

  constructor(config: PmsAdapterConfig) {
    this.apiKey = config.apiKey?.trim() || null
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
    this.practiceId = config.creds?.practiceId ?? null
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
    // VERIFY: some Gensolve tenants scope requests with a practice-id header.
    if (this.practiceId) h['X-Practice-Id'] = this.practiceId
    return h
  }

  async findPatient(query: string): Promise<PmsPatient[]> {
    if (!this.apiKey) return []
    try {
      // VERIFY: /clients search parameter name (using `search=` here).
      const url = `${this.baseUrl}/clients?search=${encodeURIComponent(query)}`
      const res = await fetch(url, { headers: this.headers() })
      if (!res.ok) return []
      const json = (await res.json()) as { clients?: GensolveClient[] } | GensolveClient[]
      const list = Array.isArray(json) ? json : json.clients ?? []
      return list.map(toPmsPatient)
    } catch {
      return []
    }
  }

  async readDemographics(id: string): Promise<PmsPatient | null> {
    if (!this.apiKey) return null
    try {
      const res = await fetch(`${this.baseUrl}/clients/${encodeURIComponent(id)}`, {
        headers: this.headers(),
      })
      if (!res.ok) return null
      const json = (await res.json()) as GensolveClient
      return toPmsPatient(json)
    } catch {
      return null
    }
  }

  /**
   * Pull the ACC condition context for a client — the claim number + S60.. read
   * code SST needs on the ACC report skins. Not part of the generic PmsAdapter
   * surface (NZ/ACC-specific), so it lives as an extra method on this adapter.
   */
  async readAccConditions(clientId: string): Promise<GensolveAccCondition[]> {
    if (!this.apiKey) return []
    try {
      // GET /conditions (ReadCodeList), filtered to ACC-funded conditions.
      // VERIFY: query param names (`clientId`, `insurer=ACC`) against live API.
      const url = `${this.baseUrl}/conditions?clientId=${encodeURIComponent(clientId)}&insurer=ACC`
      const res = await fetch(url, { headers: this.headers() })
      if (!res.ok) return []
      const json = (await res.json()) as { conditions?: GensolveCondition[] } | GensolveCondition[]
      const list = Array.isArray(json) ? json : json.conditions ?? []
      return list.map(toAccCondition)
    } catch {
      return []
    }
  }

  async writeNote(patientId: string, note: PmsNote): Promise<PmsWriteResult> {
    if (!this.apiKey) return { ok: false, error: NOT_CONFIGURED }
    try {
      // Gensolve clinical notes attach to a CONDITION, not the bare client. For
      // the NZ/ACC jurisdiction the SST note belongs in the ACC claim context,
      // so resolve the ACC condition FIRST and file the note against its
      // conditionId when one exists; otherwise fall back to a client-level note.
      // readAccConditions never throws (returns [] on any failure), but guard
      // anyway so a note is still attempted if resolution is degraded.
      let conditionId: string | null = null
      try {
        const conditions = await this.readAccConditions(patientId)
        // Prefer a condition that actually carries an ACC45 claim number; else
        // the first concussion/head-injury condition returned.
        const acc = conditions.find((c) => c.accClaimNumber) ?? conditions[0]
        conditionId = acc?.conditionId ?? null
      } catch {
        conditionId = null
      }

      // CONFIRMED: base host + bearer auth + resources exposing POST.
      // VERIFY: the `/notes` resource path, and the payload field names below
      // (incl. `conditionId` as the attach key) — best-effort until a sandbox
      // tenant / OpenAPI.json confirms them. Note POST shape kept deliberately.
      const body: Record<string, unknown> = {
        clientId: patientId,
        title: note.title,
        note: note.body,
        occurredAt: note.occurredAt,
      }
      // When resolved, attach to the ACC condition; else it files client-level.
      if (conditionId) body.conditionId = conditionId

      const res = await fetch(`${this.baseUrl}/notes`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      })
      if (!res.ok) return { ok: false, error: `gensolve: HTTP ${res.status}` }
      const json = (await res.json()) as { id?: string | number }
      return { ok: true, id: json.id != null ? String(json.id) : undefined }
    } catch (e) {
      return { ok: false, error: `gensolve: ${(e as Error).message}` }
    }
  }

  async attachPdf(patientId: string, pdf: PmsPdf): Promise<PmsWriteResult> {
    if (!this.apiKey) return { ok: false, error: NOT_CONFIGURED }
    // Gensolve DOES have a document store, but its upload contract (resource
    // path, multipart-vs-base64, field names) is NOT in the public docs — it
    // lives behind the tenant-auth `/api/` portal. We will not invent a binary
    // upload shape and present it as done. A documented-shape best-effort is
    // wired below (uploadDocument) but GATED OFF until UPLOAD_CONTRACT_CONFIRMED
    // is verified on a sandbox tenant, so this method is ready to complete.
    if (!GensolveAdapter.UPLOAD_CONTRACT_CONFIRMED) {
      void patientId
      void pdf
      return {
        ok: false,
        error: 'gensolve: attachPdf requires sandbox-confirmed upload contract',
      }
    }
    return this.uploadDocument(patientId, pdf)
  }

  /**
   * Best-effort document upload, held behind the UPLOAD_CONTRACT_CONFIRMED gate
   * in attachPdf. VERIFY (sandbox tenant): the documents resource path, whether
   * GPM expects `multipart/form-data` (as attempted here) or base64-in-JSON, and
   * the exact field names (`file` / `clientId` / `filename`). Do NOT enable in
   * production until the documents-resource OpenAPI.json confirms this shape.
   */
  private async uploadDocument(patientId: string, pdf: PmsPdf): Promise<PmsWriteResult> {
    try {
      const form = new FormData()
      // Copy into a fresh ArrayBuffer-backed Blob (pdf.bytes may be a subarray
      // view over a larger buffer).
      const blob = new Blob([new Uint8Array(pdf.bytes)], { type: 'application/pdf' })
      form.append('file', blob, pdf.filename)
      form.append('clientId', patientId)
      form.append('filename', pdf.filename)
      // Multipart: DON'T set Content-Type — the runtime sets the boundary.
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      }
      if (this.practiceId) headers['X-Practice-Id'] = this.practiceId
      const res = await fetch(`${this.baseUrl}/documents`, {
        method: 'POST',
        headers,
        body: form,
      })
      if (!res.ok) return { ok: false, error: `gensolve: HTTP ${res.status}` }
      const json = (await res.json()) as { id?: string | number }
      return { ok: true, id: json.id != null ? String(json.id) : undefined }
    } catch (e) {
      return { ok: false, error: `gensolve: ${(e as Error).message}` }
    }
  }

  async pollAppointments(sinceISO: string): Promise<PmsAppointment[]> {
    if (!this.apiKey) return []
    try {
      // GET /appointments/by_date — CONFIRMED documented resource; attendance
      // feeds the ACC885 attended-sessions count.
      // VERIFY: the date filter param name (`from=` here) + attendance field.
      const url = `${this.baseUrl}/appointments/by_date?from=${encodeURIComponent(sinceISO)}`
      const res = await fetch(url, { headers: this.headers() })
      if (!res.ok) return []
      const json = (await res.json()) as { appointments?: GensolveAppointment[] } | GensolveAppointment[]
      const list = Array.isArray(json) ? json : json.appointments ?? []
      return list.map(toPmsAppointment)
    } catch {
      return []
    }
  }
}

// ── minimal response shapes (documented endpoints only) ──────────────────────

interface GensolveClient {
  id: string | number
  firstName?: string
  lastName?: string
  dateOfBirth?: string // VERIFY: format
  ethnicity?: string // ACC equity field
}

interface GensolveCondition {
  id: string | number
  accClaimNumber?: string | null // ACC45 claim number
  readCode?: string | null // e.g. S60.. head-injury read code
  readCodeDescription?: string | null
}

interface GensolveAppointment {
  id: string | number
  clientId?: string | number
  // VERIFY: attendance representation — status string vs boolean flag.
  attended?: boolean
  status?: string // e.g. 'Attended' | 'DidNotArrive'
  startTime?: string // VERIFY: ISO 8601
}

function toPmsPatient(c: GensolveClient): PmsPatient {
  return {
    id: String(c.id),
    firstName: c.firstName ?? '',
    lastName: c.lastName ?? '',
    dob: c.dateOfBirth,
    ethnicity: c.ethnicity,
  }
}

function toAccCondition(c: GensolveCondition): GensolveAccCondition {
  return {
    conditionId: String(c.id),
    accClaimNumber: c.accClaimNumber ?? null,
    readCode: c.readCode ?? null,
    readCodeText: c.readCodeDescription ?? null,
  }
}

function toPmsAppointment(a: GensolveAppointment): PmsAppointment {
  // Prefer an explicit boolean; else derive from the status string.
  const attended =
    typeof a.attended === 'boolean'
      ? a.attended
      : a.status
        ? a.status.toLowerCase() === 'attended'
        : true
  return {
    id: String(a.id),
    patientId: a.clientId != null ? String(a.clientId) : '',
    attended,
    at: a.startTime ?? '',
  }
}
