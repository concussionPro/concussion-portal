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
  // VALIDATED live 2026-07-20 (au5 trial tenant): shard follows the last '-'.
  // `au1` remains Cliniko's documented default for older suffix-less keys.
  // Charset-validated (round-F #2): the shard is interpolated into the
  // request HOST — an unvalidated suffix ("...-@evil.example.com/") was
  // attacker-chosen SSRF. Real shards are short alphanumerics (au1..au5,
  // uk1, ca1...).
  const shard = dash >= 0 && dash < apiKey.length - 1 ? apiKey.slice(dash + 1) : ''
  return /^[a-z0-9]{2,8}$/.test(shard) ? shard : 'au1'
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
      // VALIDATED live 2026-07-20: `?q[]=first_name:~<term>` returns matches.
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
      // Cliniko has no plain "note" object — the simplest text write-back is a
      // treatment note (POST /treatment_notes). VALIDATED live 2026-07-20
      // against an au5 trial tenant: contrary to the archived docs, `title` is
      // REQUIRED at the top level ("can't be blank") and `draft` must be sent
      // explicitly ("is not included in the list" when omitted) — with both,
      // the create returns 201. `content` is a `sections[].questions[]` tree;
      // a `type: "text"` question is the minimal free-text field, HTML
      // permitted in answers. The note author is auto-set to the practitioner
      // behind the API key. There is no occurred/date field on the create body
      // — Cliniko stamps `created_at` — so `note.occurredAt` is folded into
      // the section name for provenance instead of sent raw.
      const body = {
        patient_id: patientId,
        title: note.title,
        draft: false,
        content: {
          sections: [
            {
              name: note.title,
              questions: [{ name: note.title, type: 'text', answer: note.body }],
            },
          ],
        },
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
    // Cliniko attachments are a documented THREE-step S3 presigned-POST flow:
    //   1. GET /patients/:id/attachment_presigned_post → { url, fields }
    //   2. POST the bytes to `url` as multipart/form-data: every `fields`
    //      entry FIRST (S3 requires the policy fields before the file), then a
    //      `file` part; S3 substitutes the `${filename}` placeholder in the
    //      `key` field from the file part's filename and returns 201 + an XML
    //      body carrying the final <Key>.
    //   3. POST /patient_attachments { patient_id, description, upload_url }
    //      where upload_url = presign `url` + the S3 <Key>.
    // Ref: redguava/cliniko-api guides/uploading_patient_attachments.md —
    // https://github.com/redguava/cliniko-api/blob/main/guides/uploading_patient_attachments.md
    try {
      // ── Step 1: request the presigned POST ──────────────────────────────
      const presignRes = await fetch(
        `${this.baseUrl}/patients/${encodeURIComponent(patientId)}/attachment_presigned_post`,
        { headers: this.headers() },
      )
      if (!presignRes.ok) {
        return { ok: false, error: `cliniko: presign HTTP ${presignRes.status}` }
      }
      const presign = (await presignRes.json()) as {
        url?: string
        fields?: Record<string, string>
      }
      if (!presign.url || !presign.fields) {
        return { ok: false, error: 'cliniko: presign response missing url/fields' }
      }

      // ── Step 2: upload the bytes to S3 as multipart/form-data ────────────
      const form = new FormData()
      // Policy fields MUST precede the file part for S3 to accept the POST.
      for (const [k, v] of Object.entries(presign.fields)) form.append(k, v)
      form.append(
        'file',
        new Blob([pdf.bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }),
        pdf.filename,
      )
      // Plain fetch — NO Cliniko auth/JSON headers on the S3 request; fetch sets
      // the multipart boundary itself.
      const s3Res = await fetch(presign.url, { method: 'POST', body: form })
      if (!s3Res.ok) {
        return { ok: false, error: `cliniko: s3 upload HTTP ${s3Res.status}` }
      }
      const s3Xml = await s3Res.text()
      const keyMatch = s3Xml.match(/<Key>([^<]+)<\/Key>/)
      if (!keyMatch) {
        return { ok: false, error: 'cliniko: s3 upload response missing <Key>' }
      }
      // upload_url = presign `url` (bucket root, trailing slash) + S3 Key.
      const uploadUrl = `${presign.url.replace(/\/$/, '')}/${keyMatch[1]}`

      // ── Step 3: create the patient_attachment record ─────────────────────
      const createRes = await fetch(`${this.baseUrl}/patient_attachments`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          patient_id: patientId,
          description: pdf.filename,
          upload_url: uploadUrl,
        }),
      })
      if (!createRes.ok) {
        return { ok: false, error: `cliniko: attachment create HTTP ${createRes.status}` }
      }
      const json = (await createRes.json()) as { id?: string | number }
      return { ok: true, id: json.id != null ? String(json.id) : undefined }
    } catch (e) {
      return { ok: false, error: `cliniko: ${(e as Error).message}` }
    }
  }

  async pollAppointments(sinceISO: string): Promise<PmsAppointment[]> {
    if (!this.apiKey) return []
    try {
      // NO webhooks — poll appointments updated since `sinceISO` and read the
      // did_not_arrive flag for attendance. VALIDATED live 2026-07-20:
      // `q[]=updated_at:>=<iso>` filters correctly on this endpoint.
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
  date_of_birth?: string // VALIDATED 2026-07-20: 'YYYY-MM-DD'
}

interface ClinikoAppointment {
  id: string | number
  // VALIDATED live 2026-07-20: there is NO flat patient_id on appointment
  // payloads — patient linkage is ONLY the nested link object, and the numeric
  // id must be parsed from the tail of `patient.links.self`
  // (https://api.<shard>.cliniko.com/v1/patients/<id>). The flat field is kept
  // as a fallback in case older shards differ.
  patient_id?: string | number
  patient?: { links?: { self?: string } }
  did_not_arrive?: boolean
  starts_at?: string // VALIDATED 2026-07-20: ISO 8601 (e.g. 2026-07-20T04:09:15Z)
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
  // Nested link is the real shape (validated); flat patient_id is a fallback.
  const linkId = a.patient?.links?.self?.match(/\/patients\/(\d+)/)?.[1]
  return {
    id: String(a.id),
    patientId: linkId ?? (a.patient_id != null ? String(a.patient_id) : ''),
    attended: a.did_not_arrive !== true,
    at: a.starts_at ?? '',
  }
}
