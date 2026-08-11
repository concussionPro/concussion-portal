/**
 * Nookal PMS adapter (AU/NZ allied health — MSCC's system).
 *
 * AUTH: a per-account API key the clinic's Practice Manager enables in Nookal
 * (Setup → Connections/API). Requests carry it BOTH as the documented
 * `api_key` parameter and as an `x-api-key` header — integrators report each
 * transport in the wild, the redundancy is harmless, and whichever the shard
 * ignores, the other authenticates. // VERIFY: which one Nookal actually reads.
 *
 * SURFACE (docs: https://api.nookal.com/dev/reference/patient):
 *   probe            → getLocations (cheapest authenticated read)
 *   findPatient      → searchPatients (first/last + fuzzy_search)
 *   readDemographics → searchPatients by patient_id
 *   writeNote        → addTreatmentNote — Nookal REQUIRES case_id +
 *                      practitioner_id, which Cliniko doesn't. Zero-config for
 *                      the clinic: the adapter resolves the patient's most
 *                      recent case (or creates an "SST — concussion episode"
 *                      case) and the first active practitioner (or the stored
 *                      creds.practitionerId when a clinic pins one).
 *   attachPdf        → uploadFile → presigned S3 PUT (30-min expiry)
 *                      → setFileActive (three documented steps)
 *   pollAppointments → NOT implemented in v1 (optional on the contract);
 *                      Nookal exposes appointments, but attendance-field
 *                      semantics are unverified and a wrong "attended" would
 *                      reach ACC885 forms. Add only after live validation.
 *
 * RESPONSE ENVELOPE: Nookal wraps results as
 *   { status: "success", data: { results: { <entity>: [...] } } }
 *   { status: "failure", details: { errorMessage } }
 * Field casing varies between entities (ID/Id/id, FirstName/first_name), so
 * every extractor below reads both spellings. // VERIFY per-entity on a live
 * tenant before trusting beyond filing-to-a-TEST-patient.
 *
 * Every unverified shape is marked // VERIFY: — the MSCC go-live protocol is
 * to run the connect probe, then file one report against a TEST patient in
 * their Nookal and eyeball it there, before any real record is touched.
 */

import type {
  PmsAdapter,
  PmsAdapterConfig,
  PmsNote,
  PmsPatient,
  PmsPdf,
  PmsWriteResult,
} from './adapter'

const NOT_CONFIGURED = 'nookal: not configured (no API key)'
const DEFAULT_BASE = 'https://api.nookal.com/production/v2'
const SST_CASE_TITLE = 'SST — concussion episode'

type Json = Record<string, unknown>

/** Read a field under any of the casings Nookal uses across entities. */
function field(o: Json, ...names: string[]): unknown {
  for (const n of names) {
    if (o[n] != null) return o[n]
    const lower = n.toLowerCase()
    for (const k of Object.keys(o)) if (k.toLowerCase() === lower) return o[k]
  }
  return undefined
}

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : undefined

/** First array found under results.<any of names> (envelope casing varies). */
function digArray(results: unknown, ...names: string[]): Json[] {
  if (!results || typeof results !== 'object') return []
  const r = results as Json
  for (const n of names) {
    const v = field(r, n)
    if (Array.isArray(v)) return v.filter((x): x is Json => !!x && typeof x === 'object')
  }
  // Fallback: a lone array anywhere under results.
  for (const v of Object.values(r)) {
    if (Array.isArray(v)) return v.filter((x): x is Json => !!x && typeof x === 'object')
  }
  return []
}

export class NookalAdapter implements PmsAdapter {
  readonly name = 'nookal'
  private readonly apiKey: string | null
  private readonly baseUrl: string
  private readonly pinnedPractitionerId: string | null

  constructor(config: PmsAdapterConfig) {
    this.apiKey = config.apiKey?.trim() || null
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE).replace(/\/$/, '')
    // Optional: a clinic can pin the authoring practitioner at connect time;
    // absent, the adapter resolves the first active practitioner itself so
    // the clinic has NOTHING to configure beyond the key.
    this.pinnedPractitionerId = config.creds?.practitionerId?.trim() || null
  }

  /**
   * One call shape for the whole API: `${base}/<fn>`, form-encoded POST (the
   * documented write verbs) or GET with query params (the getters). Returns
   * `data.results` on success, or an error string — never throws on the
   * expected failure modes.
   */
  private async call(
    fn: string,
    params: Record<string, string>,
    method: 'GET' | 'POST' = 'GET',
  ): Promise<{ ok: true; results: unknown } | { ok: false; error: string; status?: number }> {
    if (!this.apiKey) return { ok: false, error: NOT_CONFIGURED }
    const withKey = new URLSearchParams({ api_key: this.apiKey, ...params })
    const url =
      method === 'GET' ? `${this.baseUrl}/${fn}?${withKey.toString()}` : `${this.baseUrl}/${fn}`
    try {
      const res = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          'x-api-key': this.apiKey, // belt to the documented api_key param
          ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        },
        ...(method === 'POST' ? { body: withKey.toString() } : {}),
      })
      if (!res.ok) return { ok: false, error: `nookal: ${fn} HTTP ${res.status}`, status: res.status }
      const json = (await res.json().catch(() => null)) as Json | null
      if (!json) return { ok: false, error: `nookal: ${fn} returned non-JSON` }
      const status = str(field(json, 'status'))
      if (status && status !== 'success') {
        const details = field(json, 'details') as Json | undefined
        const msg = (details && str(field(details, 'errorMessage', 'error_message'))) || 'request failed'
        return { ok: false, error: `nookal: ${fn} — ${msg}` }
      }
      const data = field(json, 'data') as Json | undefined
      return { ok: true, results: data ? field(data, 'results') : undefined }
    } catch (e) {
      return { ok: false, error: `nookal: ${fn} — ${(e as Error).message}` }
    }
  }

  async probe(): Promise<{ ok: boolean; status?: number }> {
    if (!this.apiKey) return { ok: false }
    const r = await this.call('getLocations', { page_length: '1' })
    return r.ok ? { ok: true } : { ok: false, status: r.status }
  }

  async findPatient(query: string): Promise<PmsPatient[]> {
    if (!this.apiKey) return []
    const term = query.trim()
    if (!term) return []
    // searchPatients supports (last_name, first_name, fuzzy_search).
    // "First Last" → both fields; single term → try it as EACH name, merged
    // (a surname-only search must not come back empty). fuzzy_search covers
    // typos and partials. // VERIFY: fuzzy flag value ('1' vs 'true').
    const searches: Array<Record<string, string>> = /\s/.test(term)
      ? (() => {
          const [first, ...rest] = term.split(/\s+/)
          return [{ first_name: first, last_name: rest.join(' '), fuzzy_search: '1' }]
        })()
      : [
          { last_name: term, fuzzy_search: '1' },
          { first_name: term, fuzzy_search: '1' },
        ]
    const seen = new Set<string>()
    const out: PmsPatient[] = []
    for (const params of searches) {
      const r = await this.call('searchPatients', params, 'POST')
      if (!r.ok) continue
      for (const p of digArray(r.results, 'patients', 'patient')) {
        const mapped = toPmsPatient(p)
        if (!mapped || seen.has(mapped.id)) continue
        seen.add(mapped.id)
        out.push(mapped)
        if (out.length >= 25) return out
      }
    }
    return out
  }

  async readDemographics(id: string): Promise<PmsPatient | null> {
    if (!this.apiKey) return null
    const r = await this.call('searchPatients', { patient_id: id }, 'POST')
    if (!r.ok) return null
    const rows = digArray(r.results, 'patients', 'patient')
    return rows.length ? toPmsPatient(rows[0]) : null
  }

  /**
   * Nookal's addTreatmentNote requires practitioner_id — resolve the pinned
   * one, else the first ACTIVE practitioner. The actual treating clinician is
   * named inside the note body the report layer composes, so authorship in
   * Nookal being the API practitioner mirrors how Cliniko attributes notes to
   * the key's owner.
   */
  private async resolvePractitionerId(): Promise<string | null> {
    if (this.pinnedPractitionerId) return this.pinnedPractitionerId
    const r = await this.call('getPractitioners', { page_length: '50' })
    if (!r.ok) return null
    const rows = digArray(r.results, 'practitioners', 'practitioner')
    if (!rows.length) return null
    // Prefer an active practitioner when a status field exists; else first.
    // VERIFY: status field name/values on a live tenant.
    const active = rows.find((p) => {
      const s = str(field(p, 'Status', 'status', 'Active', 'active'))
      return s === undefined || s === '1' || s?.toLowerCase() === 'active' || s?.toLowerCase() === 'true'
    })
    return str(field(active ?? rows[0], 'ID', 'Id', 'id', 'practitioner_id')) ?? null
  }

  /** Most recent case for the patient, else a fresh SST case. */
  private async resolveCaseId(patientId: string): Promise<string | null> {
    const r = await this.call('getCases', { patient_id: patientId, page_length: '50' })
    if (r.ok) {
      const rows = digArray(r.results, 'cases', 'case')
      // Highest numeric ID = newest (IDs are sequential). // VERIFY ordering.
      let best: { id: string; n: number } | null = null
      for (const c of rows) {
        const id = str(field(c, 'ID', 'Id', 'id', 'case_id', 'caseID'))
        if (!id) continue
        const n = Number(id)
        if (!best || (Number.isFinite(n) && n > best.n)) best = { id, n: Number.isFinite(n) ? n : 0 }
      }
      if (best) return best.id
    }
    const today = new Date().toISOString().slice(0, 10)
    const added = await this.call(
      'addCase',
      { patient_id: patientId, title: SST_CASE_TITLE, start_date: today },
      'POST',
    )
    if (!added.ok) return null
    // The new id may come back as case_id / ID / a lone value in results.
    // VERIFY: exact create-response shape.
    const rows = digArray(added.results, 'cases', 'case')
    const fromRow = rows.length ? str(field(rows[0], 'ID', 'Id', 'id', 'case_id', 'caseID')) : undefined
    if (fromRow) return fromRow
    const direct =
      added.results && typeof added.results === 'object'
        ? str(field(added.results as Json, 'case_id', 'caseID', 'ID', 'id'))
        : undefined
    return direct ?? null
  }

  async writeNote(patientId: string, note: PmsNote): Promise<PmsWriteResult> {
    if (!this.apiKey) return { ok: false, error: NOT_CONFIGURED }
    const practitionerId = await this.resolvePractitionerId()
    if (!practitionerId) return { ok: false, error: 'nookal: could not resolve a practitioner for note authorship' }
    const caseId = await this.resolveCaseId(patientId)
    if (!caseId) return { ok: false, error: 'nookal: could not resolve or create a case for this patient' }
    // occurredAt → 'YYYY-MM-DD HH:MM:SS' (Nookal's documented datetime shape).
    const at = note.occurredAt ? new Date(note.occurredAt) : new Date()
    const date = Number.isNaN(at.getTime())
      ? new Date().toISOString().slice(0, 19).replace('T', ' ')
      : at.toISOString().slice(0, 19).replace('T', ' ')
    const r = await this.call(
      'addTreatmentNote',
      {
        patient_id: patientId,
        case_id: caseId,
        practitioner_id: practitionerId,
        date,
        // Title folded into the body: addTreatmentNote's documented required
        // field is `notes` (free text); there is no separate title parameter.
        notes: `${note.title}\n\n${note.body}`,
      },
      'POST',
    )
    if (!r.ok) return { ok: false, error: r.error }
    const rows = digArray(r.results, 'notes', 'treatment_notes', 'treatmentNotes')
    const id = rows.length
      ? str(field(rows[0], 'ID', 'Id', 'id', 'note_id'))
      : r.results && typeof r.results === 'object'
        ? str(field(r.results as Json, 'note_id', 'ID', 'id'))
        : undefined
    return { ok: true, id }
  }

  async attachPdf(patientId: string, pdf: PmsPdf): Promise<PmsWriteResult> {
    if (!this.apiKey) return { ok: false, error: NOT_CONFIGURED }
    // ── Step 1: register the file, receive a presigned S3 URL + file id ──────
    const name = pdf.filename.replace(/\.pdf$/i, '')
    const reg = await this.call(
      'uploadFile',
      {
        patient_id: patientId,
        name,
        extension: 'pdf',
        file_type: 'application/pdf',
        // Documented-required metadata field; the original filename is the
        // honest value. // VERIFY: exact expectation on a live tenant.
        file_path: pdf.filename,
      },
      'POST',
    )
    if (!reg.ok) return { ok: false, error: reg.error }
    const bag = (reg.results ?? {}) as Json
    const rows = digArray(reg.results, 'files', 'file')
    const src = rows.length ? rows[0] : bag
    const uploadUrl = str(field(src, 'url', 'upload_url', 'uploadUrl', 'presigned_url'))
    const fileId = str(field(src, 'file_id', 'fileID', 'ID', 'Id', 'id'))
    if (!uploadUrl) return { ok: false, error: 'nookal: uploadFile returned no presigned URL' }

    // ── Step 2: PUT the bytes to S3 (URL valid 30 min; plain request, no
    //            Nookal auth). Content-Type must match what the URL was signed
    //            for — application/pdf is what we registered. // VERIFY. ─────
    try {
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/pdf' },
        body: pdf.bytes as Uint8Array<ArrayBuffer>,
      })
      if (!put.ok) return { ok: false, error: `nookal: s3 upload HTTP ${put.status}` }
    } catch (e) {
      return { ok: false, error: `nookal: s3 upload — ${(e as Error).message}` }
    }

    // ── Step 3: activate — the file is invisible in Nookal until this. ───────
    if (!fileId) {
      // The upload landed but we can't activate what we can't identify —
      // surface it honestly rather than pretend the record shows the file.
      return { ok: false, error: 'nookal: uploaded, but no file_id returned to activate' }
    }
    const act = await this.call('setFileActive', { patient_id: patientId, file_id: fileId }, 'POST')
    if (!act.ok) return { ok: false, error: act.error }
    return { ok: true, id: fileId }
  }
}

// ── field mapping ────────────────────────────────────────────────────────────

function toPmsPatient(p: Json): PmsPatient | null {
  const id = str(field(p, 'ID', 'Id', 'id', 'patient_id', 'PatientID'))
  if (!id) return null
  return {
    id,
    firstName: str(field(p, 'FirstName', 'first_name', 'firstName')) ?? '',
    lastName: str(field(p, 'LastName', 'last_name', 'lastName')) ?? '',
    dob: str(field(p, 'DOB', 'dob', 'date_of_birth', 'DateOfBirth')),
    // Nookal AU has no standard ethnicity field on the patient record.
  }
}
