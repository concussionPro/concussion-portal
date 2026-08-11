/**
 * Nookal adapter — mocked-transport tests.
 *
 * These prove the adapter's LOGIC (auth carriage, envelope parsing, casing
 * tolerance, case/practitioner resolution, the 3-step upload, honest failure
 * surfacing). They deliberately do NOT prove Nookal's live behaviour — every
 * // VERIFY marker in nookal.ts still requires the live-tenant protocol
 * (probe, then file to a TEST patient) before real records are touched.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NookalAdapter } from '../lib/sst-trainer/pms/nookal'

type Call = { url: string; init?: RequestInit }
let calls: Call[] = []

function mockFetch(handler: (url: string, init?: RequestInit) => unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      const out = handler(url, init)
      if (out instanceof Response) return out
      return new Response(JSON.stringify(out), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }),
  )
}

const ok = (results: unknown) => ({ status: 'success', data: { results } })

beforeEach(() => {
  calls = []
})
afterEach(() => {
  vi.unstubAllGlobals()
})

const adapter = () => new NookalAdapter({ apiKey: 'NK-TEST-KEY' })

describe('nookal auth + envelope', () => {
  it('carries the key as api_key param AND x-api-key header', async () => {
    mockFetch(() => ok({ locations: [{ ID: '1' }] }))
    await adapter().probe()
    expect(calls[0].url).toContain('api_key=NK-TEST-KEY')
    expect((calls[0].init?.headers as Record<string, string>)['x-api-key']).toBe('NK-TEST-KEY')
  })

  it('a failure envelope surfaces its errorMessage, not a fake success', async () => {
    // attachPdf's first call propagates the envelope error verbatim (write
    // paths surface; read-resolution paths deliberately flatten like Cliniko's)
    mockFetch(() => ({ status: 'failure', details: { errorMessage: 'Invalid API key' } }))
    const r = await adapter().attachPdf('9', { filename: 'x.pdf', bytes: new Uint8Array([1]) })
    expect(r.ok).toBe(false)
    expect(r.error).toContain('Invalid API key')
  })

  it('no API key → every method fails closed without a network call', async () => {
    mockFetch(() => ok({}))
    const a = new NookalAdapter({})
    expect(await a.probe()).toEqual({ ok: false })
    expect(await a.findPatient('smith')).toEqual([])
    expect((await a.writeNote('1', { title: 't', body: 'b', occurredAt: '' })).ok).toBe(false)
    expect(calls.length).toBe(0)
  })
})

describe('findPatient', () => {
  it('single term searches BOTH name fields and merges unique by id', async () => {
    mockFetch((url, init) => {
      const body = String(init?.body ?? '')
      if (body.includes('last_name=smith'))
        return ok({ patients: [{ ID: '7', FirstName: 'Anna', LastName: 'Smith', DOB: '1995-04-02' }] })
      return ok({ patients: [{ ID: '7', FirstName: 'Anna', LastName: 'Smith' }, { id: '9', first_name: 'Smith', last_name: 'Jones' }] })
    })
    const out = await adapter().findPatient('smith')
    expect(out.map((p) => p.id).sort()).toEqual(['7', '9'])
    const anna = out.find((p) => p.id === '7')
    expect(anna).toMatchObject({ firstName: 'Anna', lastName: 'Smith', dob: '1995-04-02' })
  })

  it('"First Last" sends one fuzzy two-field search', async () => {
    mockFetch(() => ok({ patients: [] }))
    await adapter().findPatient('Riley Kerr')
    expect(calls.length).toBe(1)
    const body = String(calls[0].init?.body)
    expect(body).toContain('first_name=Riley')
    expect(body).toContain('last_name=Kerr')
    expect(body).toContain('fuzzy_search=1')
  })
})

describe('writeNote — case + practitioner resolution', () => {
  it('uses the newest existing case and the first active practitioner', async () => {
    mockFetch((url, init) => {
      if (url.includes('getPractitioners'))
        return ok({ practitioners: [{ ID: '3', Status: '0' }, { ID: '5', Status: '1' }] })
      if (url.includes('getCases')) return ok({ cases: [{ ID: '11' }, { ID: '42' }] })
      if (url.includes('addTreatmentNote')) {
        const body = String(init?.body)
        expect(body).toContain('case_id=42')
        expect(body).toContain('practitioner_id=5')
        expect(body).toContain('patient_id=9')
        return ok({ notes: [{ ID: '900' }] })
      }
      throw new Error(`unexpected ${url}`)
    })
    const r = await adapter().writeNote('9', {
      title: 'SST progress report',
      body: 'body text',
      occurredAt: '2026-08-11T02:00:00Z',
    })
    expect(r).toMatchObject({ ok: true, id: '900' })
  })

  it('creates an SST case when the patient has none', async () => {
    mockFetch((url, init) => {
      if (url.includes('getPractitioners')) return ok({ practitioners: [{ ID: '3' }] })
      if (url.includes('getCases')) return ok({ cases: [] })
      if (url.includes('addCase')) {
        expect(String(init?.body)).toContain('SST')
        return ok({ case_id: '77' })
      }
      if (url.includes('addTreatmentNote')) {
        expect(String(init?.body)).toContain('case_id=77')
        return ok({ note_id: '901' })
      }
      throw new Error(`unexpected ${url}`)
    })
    const r = await adapter().writeNote('9', { title: 't', body: 'b', occurredAt: '' })
    expect(r).toMatchObject({ ok: true, id: '901' })
  })

  it('a pinned practitioner (creds) skips resolution', async () => {
    mockFetch((url) => {
      if (url.includes('getPractitioners')) throw new Error('must not be called')
      if (url.includes('getCases')) return ok({ cases: [{ ID: '1' }] })
      if (url.includes('addTreatmentNote')) return ok({ note_id: '1' })
      throw new Error(`unexpected ${url}`)
    })
    const a = new NookalAdapter({ apiKey: 'k', creds: { practitionerId: '88' } })
    const r = await a.writeNote('9', { title: 't', body: 'b', occurredAt: '' })
    expect(r.ok).toBe(true)
    expect(calls.some((c) => c.url.includes('getPractitioners'))).toBe(false)
  })
})

describe('attachPdf — three documented steps', () => {
  const pdf = { filename: 'gp-report-rk.pdf', bytes: new Uint8Array([1, 2, 3]) }

  it('register → S3 PUT → activate, in order', async () => {
    mockFetch((url, init) => {
      if (url.includes('uploadFile')) return ok({ files: [{ url: 'https://s3.example/presigned', file_id: 'F1' }] })
      if (url === 'https://s3.example/presigned') {
        expect(init?.method).toBe('PUT')
        expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/pdf')
        return new Response('', { status: 200 })
      }
      if (url.includes('setFileActive')) {
        expect(String(init?.body)).toContain('file_id=F1')
        return ok({})
      }
      throw new Error(`unexpected ${url}`)
    })
    const r = await adapter().attachPdf('9', pdf)
    expect(r).toMatchObject({ ok: true, id: 'F1' })
    expect(calls.map((c) => c.url)).toEqual([
      expect.stringContaining('uploadFile'),
      'https://s3.example/presigned',
      expect.stringContaining('setFileActive'),
    ])
  })

  it('an upload with no file_id reports failure — never pretends the record shows the file', async () => {
    mockFetch((url) => {
      if (url.includes('uploadFile')) return ok({ files: [{ url: 'https://s3.example/presigned' }] })
      if (url === 'https://s3.example/presigned') return new Response('', { status: 200 })
      throw new Error(`unexpected ${url}`)
    })
    const r = await adapter().attachPdf('9', pdf)
    expect(r.ok).toBe(false)
    expect(r.error).toContain('activate')
  })

  it('a failed S3 PUT surfaces the status', async () => {
    mockFetch((url) => {
      if (url.includes('uploadFile')) return ok({ url: 'https://s3.example/presigned', file_id: 'F1' })
      if (url === 'https://s3.example/presigned') return new Response('', { status: 403 })
      throw new Error(`unexpected ${url}`)
    })
    const r = await adapter().attachPdf('9', pdf)
    expect(r.ok).toBe(false)
    expect(r.error).toContain('403')
  })
})
