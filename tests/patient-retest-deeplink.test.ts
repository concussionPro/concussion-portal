import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

/**
 * Zac 2026-10-06, mid-clinic: the roster card said "Re-test due — last
 * measured 91 days ago" and offered only GP report and Documents. Starting the
 * re-test meant re-keying the clinic code and patient code into the trainer by
 * hand. The deep link already existed; nothing linked to it.
 */
describe('patient roster can start a re-test', () => {
  const page = readFileSync('app/clinical-testing/patients/page.tsx', 'utf8')

  it('each patient card deep-links into the trainer with clinic AND patient code', () => {
    expect(page).toContain('/sst-trainer?clinic=${encodeURIComponent(clinic.code)}')
    expect(page).toContain('&p=${encodeURIComponent(patient.patientCode)}')
    expect(page).toContain('&start=1')
  })

  it('the row type carries the minted patient code', () => {
    expect(page).toMatch(/patientCode\?:\s*string \| null/)
  })

  it('a patient with no minted code still gets a clinic-scoped link, not a dead button', () => {
    const i = page.indexOf('patient.patientCode ? `&p=')
    expect(i).toBeGreaterThan(-1)
    expect(page.slice(i, i + 200)).toContain(": ''")
  })

  it('the label reflects whether this is a first test or a re-test', () => {
    expect(page).toContain("patient.hrt ? 'Run re-test — graded exertion' : 'Run graded test'")
  })
})

describe('clinical hub can start a re-test too', () => {
  const hub = readFileSync('app/clinical-hub/page.tsx', 'utf8')

  it('the SST panel deep-links into the trainer with clinic and patient code', () => {
    expect(hub).toContain('/sst-trainer?clinic=${encodeURIComponent(clinicCode)}')
    expect(hub).toContain('&p=${encodeURIComponent(p.patientCode)}')
  })

  it('the demo clinic never offers it (read-only)', () => {
    const i = hub.indexOf('Run graded test')
    expect(i).toBeGreaterThan(-1)
    expect(hub.slice(Math.max(0, i - 1200), i)).toContain('!isDemo && clinicCode')
  })
})
