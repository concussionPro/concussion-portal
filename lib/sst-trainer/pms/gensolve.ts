/**
 * Gensolve (Practice Manager) PMS adapter — NZ, ACC-integrated.
 *
 * Gensolve is the dominant NZ physiotherapy PMS and carries the ACC claim
 * context SST reporting needs for the NZ jurisdiction (ACC45/claim number, the
 * S60.. read-code diagnosis, insurer=ACC funding, attendance for ACC885).
 *
 * BASE: `https://nzgpm.gensolve.com/api/` (NZ tenant). AUTH is an API key /
 * bearer token issued per practice; some deployments also require a practice id
 * in `creds`.
 *
 * Endpoints used (documented surface only; shapes marked `// VERIFY:` are not
 * confirmed against a live tenant):
 *  - GET  /conditions   — ReadCodeList; filter insurer=ACC to pull the ACC claim
 *                          number + S60.. read code (the concussion diagnosis).
 *  - GET  /clients      — demographics incl. ethnicity (ACC equity reporting).
 *  - GET  /appointments — attendance; drives the ACC885 attended-sessions count.
 *  - POST/PUT (conditions/notes) — write-back of the SST outcome note.
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
      // VERIFY: write-back endpoint + payload. Gensolve notes attach to a
      // condition, not the bare client — a real integration resolves the ACC
      // conditionId first (readAccConditions) and POSTs the note there.
      const body = {
        clientId: patientId,
        title: note.title,
        note: note.body,
        occurredAt: note.occurredAt,
      }
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
    // VERIFY: Gensolve document-upload endpoint + multipart contract unknown.
    // Left as a clearly-marked stub rather than guessing a binary upload shape.
    void patientId
    void pdf
    return { ok: false, error: 'gensolve: attachPdf not implemented (VERIFY upload contract)' }
  }

  async pollAppointments(sinceISO: string): Promise<PmsAppointment[]> {
    if (!this.apiKey) return []
    try {
      // GET /appointments — attendance feeds the ACC885 attended-sessions count.
      // VERIFY: date filter param name (`from=` here) + attendance flag field.
      const url = `${this.baseUrl}/appointments?from=${encodeURIComponent(sinceISO)}`
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
