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

describe('patient handover carries the record, so nothing is filled in', () => {
  const card = readFileSync('components/sst-trainer/SstPatientQrCard.tsx', 'utf8')
  const hub = readFileSync('app/clinical-hub/page.tsx', 'utf8')
  const onboarding = readFileSync('components/platform/SstOnboarding.tsx', 'utf8')

  it('the QR encodes the per-patient join link when a code is supplied', () => {
    expect(card).toContain("`${origin}/j/${encodeURIComponent(code)}${patientCode ? `?p=${encodeURIComponent(patientCode)}` : ''}`")
  })

  it('a linked patient is told there is nothing to fill in', () => {
    expect(card).toContain('Nothing to fill in')
  })

  it('the hub offers the handover only for a real clinic with a minted code', () => {
    expect(hub).toContain('Give patient their link')
    const i = hub.indexOf('Give patient their link')
    expect(hub.slice(Math.max(0, i - 600), i)).toContain('!isDemo && clinicCode && p.patientCode')
  })

  it('the trainer asks for nothing when the code arrives on the link', () => {
    expect(onboarding).toContain('Linked to your clinic record')
  })
})

describe('the platform emails the patient their setup', () => {
  const route = readFileSync('app/api/sst/patient/route.ts', 'utf8')
  const email = readFileSync('lib/sst-trainer/patient-welcome-email.ts', 'utf8')
  const registry = readFileSync('lib/sst-trainer/patient-registry.ts', 'utf8')
  const qr = readFileSync('app/api/qr/route.ts', 'utf8')

  it('minting a patient with an email sends one onboarding email', () => {
    expect(route).toContain('buildPatientWelcomeEmail')
    expect(route).toContain("value: 'sst-patient-onboarding'")
  })

  it('that send checks suppression and fails closed', () => {
    expect(route).toContain('isEmailSuppressed')
    expect(route.indexOf('isEmailSuppressed')).toBeLessThan(route.indexOf('buildPatientWelcomeEmail'))
    expect(route).toContain('emailBlocked = true')
  })

  it('the email carries the per-patient join link and a QR of the same link', () => {
    expect(route).toContain('/j/${encodeURIComponent(clinicCode)}?p=${encodeURIComponent(patient.patientCode)}')
    expect(email).toContain('/api/qr?d=')
  })

  it('it prompts for broadcasting but defers the per-brand steps to the app', () => {
    expect(email).toContain('broadcast')
    expect(email).toContain('Connect a monitor')
  })

  it('the QR endpoint refuses targets that are not our own domain', () => {
    expect(qr).toContain('ALLOWED_HOSTS')
    expect(qr).toContain('target not allowed')
  })

  it('patient email is stored as optional and typed as PHI', () => {
    expect(registry).toContain('ADD COLUMN IF NOT EXISTS email TEXT')
    expect(registry).toContain('Never surfaced to a patient-facing route')
  })
})
