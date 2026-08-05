import type { PmsAdapter, PmsAdapterConfig, PmsNote, PmsPatient, PmsPdf, PmsWriteResult } from './adapter'

/**
 * Coreplus adapter — developers.corepluspm.com.
 *
 * AUTH: JWT server-to-server. Coreplus issues sandbox credentials on developer
 * signup; production access follows their product-team review
 * (integrations@corepluspm.com). Until the sandbox account exists, the exact
 * token-mint flow is unconfirmed, so this adapter accepts a PRE-OBTAINED bearer
 * token as config.apiKey and isolates token acquisition behind `bearer()` —
 * swap in the real JWT exchange there once sandbox credentials arrive, with no
 * change to any caller.
 *
 * Documented capability (2026-07-31): clients list/create/update ✅, Client
 * Files upload + association ✅ (our primary write: the PDF report), Draft
 * Notes endpoint exists but is thinly documented — writeNote() therefore
 * returns a clear not-supported error until sandbox validation, and the report
 * pipeline treats attachPdf as the write that matters (same posture Gensolve
 * launched with).
 *
 * All `// VERIFY:` markers must be exercised on the sandbox before this
 * adapter is surfaced in PmsConnect.
 */
export class CoreplusAdapter implements PmsAdapter {
  readonly name = 'coreplus'
  private baseUrl: string
  private token: string

  constructor(config: PmsAdapterConfig) {
    // VERIFY: production vs sandbox API host on developer signup
    this.baseUrl = (config.baseUrl || 'https://api.coreplus.com.au').replace(/\/$/, '')
    this.token = config.apiKey || ''
  }

  /** Token seam — replace with the real JWT exchange once sandbox creds exist. */
  private bearer(): string | null {
    return this.token || null
  }

  private headers(): Record<string, string> | null {
    const t = this.bearer()
    if (!t) return null
    return { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }
  }

  // VERIFY: client payload field names on sandbox
  private mapPatient(p: Record<string, unknown>): PmsPatient {
    return {
      id: String(p.clientId ?? p.id ?? ''),
      firstName: String(p.firstName ?? p.first_name ?? ''),
      lastName: String(p.lastName ?? p.last_name ?? ''),
      dob: typeof p.dOB === 'string' ? p.dOB : typeof p.dob === 'string' ? p.dob : undefined,
    }
  }

  async probe(): Promise<{ ok: boolean; status?: number }> {
    const h = this.headers()
    if (!h) return { ok: false }
    try {
      // Cheapest authenticated read on the documented clients resource — a
      // rejected bearer token answers 401 with the status kept.
      const res = await fetch(`${this.baseUrl}/api/v2.1/clients?search=a`, { headers: h })
      return { ok: res.ok, status: res.status }
    } catch {
      return { ok: false }
    }
  }

  async findPatient(query: string): Promise<PmsPatient[]> {
    const h = this.headers()
    if (!h) return []
    try {
      // VERIFY: client search/list route + query param name
      const res = await fetch(`${this.baseUrl}/api/v2.1/clients?search=${encodeURIComponent(query)}`, { headers: h })
      if (!res.ok) return []
      const data = await res.json()
      const rows: Record<string, unknown>[] = Array.isArray(data) ? data : data.clients || data.items || []
      return rows.slice(0, 10).map((p) => this.mapPatient(p))
    } catch {
      return []
    }
  }

  async readDemographics(id: string): Promise<PmsPatient | null> {
    const h = this.headers()
    if (!h) return null
    try {
      const res = await fetch(`${this.baseUrl}/api/v2.1/clients/${encodeURIComponent(id)}`, { headers: h })
      if (!res.ok) return null
      return this.mapPatient(await res.json())
    } catch {
      return null
    }
  }

  async writeNote(_patientId: string, _note: PmsNote): Promise<PmsWriteResult> {
    // Draft Notes endpoint exists but is undocumented in depth — refuse loudly
    // rather than write into an unvalidated clinical surface. attachPdf is the
    // supported write until sandbox validation says otherwise.
    return { ok: false, error: 'Coreplus note write pending sandbox validation — reports file as attachments' }
  }

  async attachPdf(patientId: string, pdf: PmsPdf): Promise<PmsWriteResult> {
    const h = this.bearer()
    if (!h) return { ok: false, error: 'Coreplus not connected' }
    try {
      // VERIFY: Client Files upload contract (multipart field names) + the
      // separate Client File Association step documented in the API reference
      const form = new FormData()
      form.append('clientId', patientId)
      form.append('file', new Blob([Buffer.from(pdf.bytes)], { type: 'application/pdf' }), pdf.filename)
      const res = await fetch(`${this.baseUrl}/api/v2.1/clientfiles`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${h}` },
        body: form,
      })
      if (!res.ok) return { ok: false, error: `Coreplus file upload failed (${res.status})` }
      const data = await res.json().catch(() => ({}))
      return { ok: true, id: data?.id ? String(data.id) : undefined }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Coreplus file upload failed' }
    }
  }
}
