/**
 * Cliniko PMS adapter (AU/NZ/UK/CA — the dominant AU allied-health PMS).
 *
 * AUTH: HTTP Basic, with the API key as the USERNAME and an empty password.
 * The key itself encodes the region shard after a trailing `-`, e.g.
 * `MS0xxxxxxxxx-au4` → shard `au4` → base `https://api.au4.cliniko.com/v1`.
 * Cliniko ALSO mandates an identifying `User-Agent` (app name + contact email);
 * requests without one are rejected.
 *
 * NO WEBHOOKS: Cliniko has no attendance webhook we rely on, so
 * `pollAppointments` polls `GET /appointments` and reads `did_not_arrive`.
 *
 * This adapter keeps the network surface deliberately minimal and documented.
 * Fields whose exact JSON shape we have not verified against a live account are
 * marked `// VERIFY:` — do NOT trust them for production write-back until
 * confirmed against Cliniko's API reference / a sandbox account.
 *
 * Docs: https://github.com/redguava/cliniko-api
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

const NOT_CONFIGURED = 'cliniko: not configured (no API key)'

/** Base64 for HTTP Basic without pulling in Buffer typing quirks. */
function basicAuth(apiKey: string): string {
  const raw = `${apiKey}:` // key is the username, password empty
  // btoa exists in the Next runtime (edge + node 18+); fall back to Buffer.
  if (typeof btoa === 'function') return btoa(raw)
  return Buffer.from(raw, 'utf8').toString('base64')
}

/** Derive the region shard from the key suffix (`...-au4` → `au4`). */
function shardFromKey(apiKey: string): string {
  const dash = apiKey.lastIndexOf('-')
  // VERIFY: Cliniko keys append the shard after the last '-'. If absent, Cliniko
  // documents `au1` as a safe default for older keys.
  return dash >= 0 && dash < apiKey.length - 1 ? apiKey.slice(dash + 1) : 'au1'
}

export class ClinikoAdapter implements PmsAdapter {
  readonly name = 'cliniko'
  private readonly apiKey: string | null
  private readonly baseUrl: string
  private readonly userAgent: string

  constructor(config: PmsAdapterConfig) {
    this.apiKey = config.apiKey?.trim() || null
    this.baseUrl =
      config.baseUrl ??
      (this.apiKey ? `https://api.${shardFromKey(this.apiKey)}.cliniko.com/v1` : '')
    // Cliniko requires an identifying UA with a contact address.
    this.userAgent = config.userAgent ?? 'CEA-SST-Trainer (support@concussion-education-australia.com)'
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Basic ${basicAuth(this.apiKey as string)}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent,
    }
  }

  async findPatient(query: string): Promise<PmsPatient[]> {
    if (!this.apiKey) return []
    try {
      // VERIFY: Cliniko patient search uses `q[]` LHS-bracket filters; a simple
      // name search is commonly `?q[]=first_name:~<term>`. Endpoint: /patients.
      const url = `${this.baseUrl}/patients?q[]=${encodeURIComponent(`first_name:~${query}`)}&per_page=25`
      const res = await fetch(url, { headers: this.headers() })
      if (!res.ok) return []
      const json = (await res.json()) as { patients?: ClinikoPatient[] }
      return (json.patients ?? []).map(toPmsPatient)
    } catch {
      return []
    }
  }

  async readDemographics(id: string): Promise<PmsPatient | null> {
    if (!this.apiKey) return null
    try {
      const res = await fetch(`${this.baseUrl}/patients/${encodeURIComponent(id)}`, {
        headers: this.headers(),
      })
      if (!res.ok) return null
      const json = (await res.json()) as ClinikoPatient
      return toPmsPatient(json)
    } catch {
      return null
    }
  }

  async writeNote(patientId: string, note: PmsNote): Promise<PmsWriteResult> {
    if (!this.apiKey) return { ok: false, error: NOT_CONFIGURED }
    try {
      // VERIFY: treatment notes are POSTed to /treatment_notes. The exact
      // content structure is a `content.sections[]` tree in Cliniko; we send a
      // single free-text section here and mark it for verification.
      const body = {
        patient_id: patientId,
        // VERIFY: title/date field names + sections schema against live API.
        title: note.title,
        occurred_at: note.occurredAt,
        content: { sections: [{ name: note.title, description: note.body }] },
      }
      const res = await fetch(`${this.baseUrl}/treatment_notes`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      })
      if (!res.ok) return { ok: false, error: `cliniko: HTTP ${res.status}` }
      const json = (await res.json()) as { id?: string | number }
      return { ok: true, id: json.id != null ? String(json.id) : undefined }
    } catch (e) {
      return { ok: false, error: `cliniko: ${(e as Error).message}` }
    }
  }

  async attachPdf(patientId: string, pdf: PmsPdf): Promise<PmsWriteResult> {
    if (!this.apiKey) return { ok: false, error: NOT_CONFIGURED }
    try {
      // VERIFY: Cliniko patient_attachments uploads are a multi-step presigned
      // S3 flow (request upload URL → PUT bytes → confirm), NOT a single POST.
      // This stub performs the first step only and is marked incomplete; wire
      // the presign→PUT→confirm sequence against the live API before use.
      const res = await fetch(`${this.baseUrl}/patient_attachments`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          patient_id: patientId,
          description: pdf.filename,
          // VERIFY: presigned-upload request payload shape.
        }),
      })
      if (!res.ok) return { ok: false, error: `cliniko: HTTP ${res.status}` }
      // Bytes are intentionally not uploaded here — see the presign note above.
      void pdf.bytes
      return { ok: false, error: 'cliniko: attachment presign step only — upload not implemented (VERIFY)' }
    } catch (e) {
      return { ok: false, error: `cliniko: ${(e as Error).message}` }
    }
  }

  async pollAppointments(sinceISO: string): Promise<PmsAppointment[]> {
    if (!this.apiKey) return []
    try {
      // NO webhooks — poll appointments updated since `sinceISO` and read the
      // did_not_arrive flag for attendance.
      // VERIFY: filter key for "updated since" is `q[]=updated_at:>=<iso>`.
      const url = `${this.baseUrl}/appointments?q[]=${encodeURIComponent(`updated_at:>=${sinceISO}`)}&per_page=100`
      const res = await fetch(url, { headers: this.headers() })
      if (!res.ok) return []
      const json = (await res.json()) as { appointments?: ClinikoAppointment[] }
      return (json.appointments ?? []).map(toPmsAppointment)
    } catch {
      return []
    }
  }
}

// ── minimal response shapes (documented endpoints only) ──────────────────────

interface ClinikoPatient {
  id: string | number
  first_name?: string
  last_name?: string
  date_of_birth?: string // VERIFY: 'YYYY-MM-DD'
}

interface ClinikoAppointment {
  id: string | number
  // VERIFY: patient linkage is a nested link object in Cliniko; the numeric id
  // is parsed out of `patient.links.self` in practice. We read a flat
  // `patient_id` here and mark it for verification.
  patient_id?: string | number
  did_not_arrive?: boolean
  starts_at?: string // VERIFY: ISO 8601
}

function toPmsPatient(p: ClinikoPatient): PmsPatient {
  return {
    id: String(p.id),
    firstName: p.first_name ?? '',
    lastName: p.last_name ?? '',
    dob: p.date_of_birth,
    // Cliniko has no standard ethnicity field on the core patient record.
  }
}

function toPmsAppointment(a: ClinikoAppointment): PmsAppointment {
  return {
    id: String(a.id),
    patientId: a.patient_id != null ? String(a.patient_id) : '',
    attended: a.did_not_arrive !== true,
    at: a.starts_at ?? '',
  }
}
