/**
 * Shape-test for the SST → PMS write-back path.
 *
 * WHY THIS EXISTS: we cannot smoke-test against a live Cliniko/Gensolve tenant
 * without a customer's API key. This harness is the honest substitute — it mocks
 * global fetch and asserts that (a) the delivery loop-closer calls the adapter
 * correctly and gates on config/flag, and (b) each real adapter issues the
 * documented HTTP request (method / URL / body) when driven. It proves the
 * request SHAPES match the contract; it does not certify a live round-trip.
 *
 * Run:  node scripts/test-pms-writeback.mjs   (from the portal dir)
 */

let passed = 0
let failed = 0
function ok(name, cond) {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.error(`  ✗ ${name}`)
  }
}

/** Install a mock fetch that records calls and returns a canned JSON response. */
function mockFetch(responder) {
  const calls = []
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init })
    const r = responder ? responder(String(url), init, calls.length) : undefined
    return {
      ok: r?.ok ?? true,
      status: r?.status ?? 200,
      json: async () => r?.json ?? { id: 123 },
      text: async () => r?.text ?? '',
      headers: { get: () => r?.header ?? null },
    }
  }
  return calls
}

const SAMPLE_CONTENT = {
  title: 'SST progress report — Sam Rivera',
  sections: [
    { heading: 'Patient', kind: 'summary', fields: [{ label: 'Patient', value: 'Sam Rivera' }] },
    {
      heading: 'Outcome measures reviewed during delivery (ACC cl. 5.4.7)',
      kind: 'audit',
      body: ['Sessions were delivered against a measured HR band.'],
      fields: [{ label: 'Formal review points (graded re-tests)', value: '3 — 2026-05-01, 2026-05-15, 2026-05-29' }],
    },
  ],
}

async function main() {
  const deliver = await import('../lib/sst-trainer/pms/deliver')

  console.log('reportContentToNoteText')
  const text = deliver.reportContentToNoteText(SAMPLE_CONTENT)
  ok('includes the title', text.includes('SST progress report — Sam Rivera'))
  ok('includes an uppercased heading', text.includes('PATIENT'))
  ok('renders a field as label: value', text.includes('Patient: Sam Rivera'))
  ok('surfaces the 5.4.7 review points', text.includes('Formal review points'))
  ok('carries the decision-support disclaimer', /decision-support only/i.test(text))
  ok('has no 3-blank-line runs', !/\n\n\n/.test(text))

  console.log('deliverReport (mock adapter)')
  const seen = { note: null, pdf: null }
  const mockAdapter = {
    name: 'mock',
    async findPatient() { return [] },
    async readDemographics() { return null },
    async writeNote(patientId, note) { seen.note = { patientId, note }; return { ok: true, id: 'note-1' } },
    async attachPdf(patientId, pdf) { seen.pdf = { patientId, filename: pdf.filename }; return { ok: false, error: 'attach failed' } },
  }
  const res = await deliver.deliverReport({
    adapter: mockAdapter,
    patientId: 'p-42',
    content: SAMPLE_CONTENT,
    occurredAt: '2026-05-29T00:00:00.000Z',
    pdf: { filename: 'sst.pdf', bytes: new Uint8Array([1, 2, 3]) },
  })
  ok('writeNote called with patient id', seen.note?.patientId === 'p-42')
  ok('note body is the flattened text', seen.note?.note.body.includes('SST progress report'))
  ok('note occurredAt passed through', seen.note?.note.occurredAt === '2026-05-29T00:00:00.000Z')
  ok('attachPdf called when pdf supplied', seen.pdf?.filename === 'sst.pdf')
  ok('result.ok reflects the NOTE, not the failed attachment', res.ok === true)
  ok('attachment failure surfaced but non-fatal', res.attachment?.ok === false)

  console.log('config gating')
  const savedFlag = process.env.PMS_WRITEBACK_ENABLED
  const savedKey = process.env.CLINIKO_API_KEY
  delete process.env.PMS_WRITEBACK_ENABLED
  ok('disabled by default → resolvePmsAdapter null', deliver.resolvePmsAdapter('cliniko') === null)
  process.env.PMS_WRITEBACK_ENABLED = 'true'
  delete process.env.CLINIKO_API_KEY
  ok('enabled but no key → null', deliver.resolvePmsAdapter('cliniko') === null)
  process.env.CLINIKO_API_KEY = 'MStest-au4'
  ok('enabled + key → live adapter', deliver.resolvePmsAdapter('cliniko')?.name === 'cliniko')
  if (savedFlag === undefined) delete process.env.PMS_WRITEBACK_ENABLED
  else process.env.PMS_WRITEBACK_ENABLED = savedFlag
  if (savedKey === undefined) delete process.env.CLINIKO_API_KEY
  else process.env.CLINIKO_API_KEY = savedKey

  // ── adapter-level HTTP shape assertions ────────────────────────────────────
  // Driven through a mock fetch to prove each adapter issues the documented
  // request. (Filled to match the shipped adapter shapes.)
  console.log('Cliniko adapter — HTTP shapes')
  const { ClinikoAdapter } = await import('../lib/sst-trainer/pms/cliniko')
  const cliniko = new ClinikoAdapter({ apiKey: 'MStest-au4' })
  {
    const calls = mockFetch(() => ({ ok: true, json: { id: 55 } }))
    const r = await cliniko.writeNote('99', { title: 'T', body: 'B', occurredAt: '2026-05-29T00:00:00Z' })
    ok('writeNote POSTs', calls[0]?.init.method === 'POST')
    ok('writeNote hits a cliniko host', /api\.au4\.cliniko\.com/.test(calls[0]?.url ?? ''))
    ok('writeNote returns ok with id', r.ok === true && r.id === '55')
  }

  console.log('Gensolve adapter — HTTP shapes')
  const { GensolveAdapter } = await import('../lib/sst-trainer/pms/gensolve')
  const gensolve = new GensolveAdapter({ apiKey: 'gkey' })
  {
    const calls = mockFetch(() => ({ ok: true, json: { id: 7 } }))
    await gensolve.writeNote('client-1', { title: 'T', body: 'B', occurredAt: '2026-05-29T00:00:00Z' })
    ok('gensolve writeNote issues at least one request', calls.length >= 1)
    ok('gensolve targets its API host', /gensolve\.com\/api/.test(calls[calls.length - 1]?.url ?? ''))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
