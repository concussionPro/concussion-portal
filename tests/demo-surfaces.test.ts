import { describe, it, expect } from 'vitest'
import { computePatientSstSummary } from '../lib/sst-trainer/patient-summary'
import { DEMO_CASES } from '../lib/sst-trainer/reports/load'
import { readFileSync } from 'node:fs'

/**
 * Every demo surface must resolve. DEMO00 holds no database rows, so any route
 * that reads the DB directly returns "no episode data" — which is a 404 in the
 * middle of a live demo, on a patient the prospect just clicked.
 *
 * gp-report and patient-summary both had exactly that dead end.
 */
describe('demo surfaces resolve for DEMO00', () => {
  it('patient-summary returns a summary for every case', async () => {
    for (const c of ['recovery', 'adherence', 'stalled'] as const) {
      const s = await computePatientSstSummary('DEMO00', 'demo', '', c)
      expect(s, `case ${c} returned null`).toBeTruthy()
      expect(s!.totalSessions).toBeGreaterThan(0)
      expect(s!.recoveryStatement.length).toBeGreaterThan(40)
    }
  })

  it('only the recovery case is clearance-ready', async () => {
    // The other two are still symptom-limited at their last test — that IS the
    // finding being demonstrated, and a summary claiming otherwise would
    // contradict the report beside it.
    expect((await computePatientSstSummary('DEMO00', 'demo', '', 'recovery'))!.clearanceReady).toBe(true)
    expect((await computePatientSstSummary('DEMO00', 'demo', '', 'adherence'))!.clearanceReady).toBe(false)
    expect((await computePatientSstSummary('DEMO00', 'demo', '', 'stalled'))!.clearanceReady).toBe(false)
  })

  it('the adherence case shows unverified sessions — the whole point of it', async () => {
    const s = (await computePatientSstSummary('DEMO00', 'demo', '', 'adherence'))!
    expect(s.verifiedSessions).toBeLessThan(s.totalSessions)
  })

  it('gp-report delegates DEMO00 rather than querying an empty table', () => {
    const src = readFileSync(new URL('../app/api/sst/gp-report/route.ts', import.meta.url), 'utf8')
    expect(src).toContain('DEMO_CLINIC_CODE')
    expect(src).toMatch(/\/api\/sst\/report/)
  })
})

describe('no demo fixture carries a person-shaped name', () => {
  const files = [
    '../app/api/sst/clinic-sessions/route.ts',
    '../app/clinical-hub/page.tsx',
    '../lib/sst-trainer/reports/load.ts',
  ]
  it('labels are initials plus context, never given names', () => {
    // A clinician on a shared screen cannot tell a fixture from a patient, and
    // should not have to work it out from a banner.
    for (const f of files) {
      const src = readFileSync(new URL(f, import.meta.url), 'utf8')
      for (const bad of ['Liam Carter', 'Priya Raman', 'Sophie Reid', 'Marcus Webb',
                         'Daniel Okafor', 'Ava Nguyen', 'Alex D', 'Sam K', 'Jordan P']) {
        expect(src, `${f} still contains "${bad}"`).not.toContain(bad)
      }
    }
  })

  it('every demo case label is an initialled identifier', () => {
    for (const c of Object.values(DEMO_CASES)) {
      expect(c.label).toMatch(/^[A-Z]\.[A-Z]\. — \d{2}[MF],/)
    }
  })
})
