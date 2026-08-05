import type { PmsAdapter, PmsAdapterConfig, PmsNote, PmsPatient, PmsPdf, PmsWriteResult } from './adapter'

/**
 * PracSuite (Smartsoft) adapter — docs.api.pracsuite.com.
 *
 * AUTH: dual-key. Every request carries BOTH:
 *   x-api-key — OUR vendor key (issued by Smartsoft after the api@pracsuite.com
 *               privacy/security application; env PRACSUITE_VENDOR_KEY)
 *   a-api-key — the CLINIC's subscriber key (generated in their PracSuite;
 *               stored per-clinic as config.apiKey)
 *
 * Documented endpoints (API reference, 2026-07-31): /openapi/patient (search
 * via q[] filter params), /openapi/clinical-note, /openapi/patient-attachment.
 * Requests are rate-limited per vendor key (429 on excess) — callers already
 * treat ok:false as retryable.
 *
 * Every `// VERIFY:` marks a field/shape written from the public reference but
 * not yet exercised against a live tenant — validate ALL of them on the first
 * trial clinic before flipping this adapter on (same discipline as Gensolve).
 */
export class PracsuiteAdapter implements PmsAdapter {
  readonly name = 'pracsuite'
  private baseUrl: string
  private subscriberKey: string
  private vendorKey: string

  constructor(config: PmsAdapterConfig) {
    this.baseUrl = (config.baseUrl || 'https://api.pracsuite.com').replace(/\/$/, '')
    this.subscriberKey = config.apiKey || ''
    this.vendorKey = config.creds?.vendorKey || process.env.PRACSUITE_VENDOR_KEY || ''
  }

  private configured(): string | null {
    if (!this.vendorKey) return 'PracSuite vendor key not configured'
    if (!this.subscriberKey) return 'Clinic subscriber key not connected'
    return null
  }

  private headers(): Record<string, string> {
    return {
      'x-api-key': this.vendorKey,
      'a-api-key': this.subscriberKey,
      'Content-Type': 'application/json',
    }
  }

  // VERIFY: patient payload field names (given_name/surname vs firstName…)
  private mapPatient(p: Record<string, unknown>): PmsPatient {
    return {
      id: String(p.id ?? ''),
      firstName: String(p.first_name ?? p.given_name ?? ''),
      lastName: String(p.last_name ?? p.surname ?? ''),
      dob: typeof p.date_of_birth === 'string' ? p.date_of_birth : undefined,
    }
  }

  async probe(): Promise<{ ok: boolean; status?: number }> {
    if (this.configured()) return { ok: false }
    try {
      // Cheapest authenticated read on the documented patient resource — a
      // rejected vendor/subscriber key answers 401/403 with the status kept.
      const res = await fetch(
        `${this.baseUrl}/openapi/patient?q[]=${encodeURIComponent('name:a')}`,
        { headers: this.headers() },
      )
      return { ok: res.ok, status: res.status }
    } catch {
      return { ok: false }
    }
  }

  async findPatient(query: string): Promise<PmsPatient[]> {
    if (this.configured()) return []
    try {
      // VERIFY: q[] filter syntax for name search on /openapi/patient
      const res = await fetch(
        `${this.baseUrl}/openapi/patient?q[]=${encodeURIComponent('name:' + query)}`,
        { headers: this.headers() },
      )
      if (!res.ok) return []
      const data = await res.json()
      const rows: Record<string, unknown>[] = Array.isArray(data) ? data : data.items || data.patients || []
      return rows.slice(0, 10).map((p) => this.mapPatient(p))
    } catch {
      return []
    }
  }

  async readDemographics(id: string): Promise<PmsPatient | null> {
    if (this.configured()) return null
    try {
      const res = await fetch(`${this.baseUrl}/openapi/patient/${encodeURIComponent(id)}`, {
        headers: this.headers(),
      })
      if (!res.ok) return null
      return this.mapPatient(await res.json())
    } catch {
      return null
    }
  }

  async writeNote(patientId: string, note: PmsNote): Promise<PmsWriteResult> {
    const notConfigured = this.configured()
    if (notConfigured) return { ok: false, error: notConfigured }
    try {
      // VERIFY: clinical-note body field names + whether patient linkage is
      // body-level or path-level on a live tenant
      const res = await fetch(`${this.baseUrl}/openapi/clinical-note`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          patient_id: patientId,
          title: note.title,
          body: note.body,
          date: note.occurredAt,
        }),
      })
      if (!res.ok) return { ok: false, error: `PracSuite note write failed (${res.status})` }
      const data = await res.json().catch(() => ({}))
      return { ok: true, id: data?.id ? String(data.id) : undefined }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'PracSuite note write failed' }
    }
  }

  async attachPdf(patientId: string, pdf: PmsPdf): Promise<PmsWriteResult> {
    const notConfigured = this.configured()
    if (notConfigured) return { ok: false, error: notConfigured }
    try {
      // VERIFY: attachment transport (multipart vs base64 JSON) — the guide has
      // an "Uploading Attachments" section; confirm exact contract on sandbox
      const form = new FormData()
      form.append('patient_id', patientId)
      form.append('file', new Blob([Buffer.from(pdf.bytes)], { type: 'application/pdf' }), pdf.filename)
      const res = await fetch(`${this.baseUrl}/openapi/patient-attachment`, {
        method: 'POST',
        headers: { 'x-api-key': this.vendorKey, 'a-api-key': this.subscriberKey },
        body: form,
      })
      if (!res.ok) return { ok: false, error: `PracSuite attachment failed (${res.status})` }
      const data = await res.json().catch(() => ({}))
      return { ok: true, id: data?.id ? String(data.id) : undefined }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'PracSuite attachment failed' }
    }
  }
}
