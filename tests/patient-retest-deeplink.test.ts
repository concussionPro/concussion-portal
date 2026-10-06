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

  it('each patient card opens the trainer on THAT patient, minting the record if needed', () => {
    expect(page).toContain('`/sst-trainer?clinic=${encodeURIComponent(clinic.code)}`')
    expect(page).toContain("(code ? `&p=${encodeURIComponent(code)}` : '')")
    expect(page).toContain("'&start=1'")
    expect(page).toContain("action: 'ensure'")
  })

  it('the row type carries the minted patient code', () => {
    expect(page).toMatch(/patientCode\?:\s*string \| null/)
  })

  it('a patient whose record cannot be minted still gets a clinic-scoped link, not a dead button', () => {
    expect(page).toContain("(code ? `&p=${encodeURIComponent(code)}` : '')")
    expect(page).toContain("(code ? `&k=${encodeURIComponent(clinic.viewKey)}` : '')")
  })

  it('the tab is opened before the await, or Safari blocks it', () => {
    const i = page.indexOf("window.open('about:blank', '_blank')")
    expect(i).toBeGreaterThan(-1)
    expect(i).toBeLessThan(page.indexOf("action: 'ensure'"))
  })

  it('the label reflects whether this is a first test or a re-test', () => {
    expect(page).toContain("patient.hrt ? 'Run re-test — graded exertion' : 'Run graded test'")
  })
})

describe('clinical hub can start a re-test too', () => {
  const hub = readFileSync('app/clinical-hub/page.tsx', 'utf8')

  it('the SST panel opens the trainer on that patient, minting the record if needed', () => {
    expect(hub).toContain('`/sst-trainer?clinic=${encodeURIComponent(clinicCode)}`')
    expect(hub).toContain("(code ? `&p=${encodeURIComponent(code)}` : '')")
    expect(hub).toContain("action: 'ensure'")
    expect(hub).toContain('void startTestFor(p.name, p.patientCode)')
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

/**
 * Zac 2026-10-06, after the first run: "run re-test asks for input again.
 * account info should be linked. no re-filling out patient info" → "MAKE IT
 * SEAMLESS". The deep link linked the record but the onboarding screen never
 * asked the server about it, so the clinician re-typed name, pathway, goal,
 * date of injury, age, sex and both consents on every re-test.
 */
describe('a clinician re-test opens with nothing to re-enter', () => {
  const route = readFileSync('app/api/sst/patient/route.ts', 'utf8')
  const onboarding = readFileSync('components/platform/SstOnboarding.tsx', 'utf8')
  const app = readFileSync('app/platform/app/page.tsx', 'utf8')
  const hub = readFileSync('app/clinical-hub/page.tsx', 'utf8')
  const roster = readFileSync('app/clinical-testing/patients/page.tsx', 'utf8')

  it('resolve returns the record only to a caller holding the clinic viewKey', () => {
    expect(route).toContain("const suppliedKey = sp.get('k')")
    expect(route).toContain('await verifyViewKey(clinicCode, suppliedKey)')
    // the identity fields live INSIDE the key-gated branch, never outside it
    const i = route.indexOf('clinicianPrefill = {')
    const gate = route.lastIndexOf('verifyViewKey(clinicCode, suppliedKey)', i)
    expect(gate).toBeGreaterThan(-1)
    expect(gate).toBeLessThan(i)
  })

  it('a code-only caller still learns nothing but "this code exists"', () => {
    // label/practitioner appear in the GET only within the gated branch
    const get = route.slice(route.indexOf('export async function GET'))
    const ungated = get.slice(0, get.indexOf("const suppliedKey = sp.get('k')"))
    expect(ungated).not.toContain('patient.label')
    expect(ungated).not.toContain('patient.practitioner')
  })

  it('onboarding resolves the record and fills itself in', () => {
    expect(onboarding).toContain("void fetch(`/api/sst/patient?${q.toString()}`)")
    expect(onboarding).toContain("if (clinicianKey) q.set('k', clinicianKey)")
    expect(onboarding).toContain('setPatientName((v) => v || (d.label as string))')
    expect(onboarding).toContain('setAgeBand((v) => v || (d.ageBand as string))')
  })

  it('a resolved record carries its research consent forward (recordIntake does not COALESCE it)', () => {
    expect(onboarding).toContain("if (typeof d.researchConsentVersion === 'number') setResearchConsent(true)")
  })

  it('a linked record needs no goal, no name and no intake to continue', () => {
    expect(onboarding).toContain("const linked = mode === 'clinic-code' && !!prefill?.label && !editDetails")
    expect(onboarding).toContain('const blocked = codeNotValid || trialBlocked || (!linked && (nameMissing || goal === null))')
    expect(onboarding).toContain("'Start re-test'")
  })

  it('the identity, goal, intake and consent blocks are all hidden when linked', () => {
    expect(onboarding).toContain("{mode === 'clinic-code' && !linked && (")
    expect(onboarding).toContain('{askIntake && (')
    expect(onboarding).toContain('{CONFIG.FEATURES.SST_POTS_PATHWAY_LIVE && !linked && (')
    expect(onboarding).toContain("{CONFIG.FEATURES.SST_RESEARCH_CONSENT_LIVE && mode === 'clinic-code' && !linked && (")
    expect(onboarding).toContain('{!linked && (')
  })

  it('a patient who already answered the intake elsewhere is not asked twice', () => {
    expect(onboarding).toContain('const intakeAnswered =')
    expect(onboarding).toContain('!prefill.needsIntake')
  })

  it('but age and sex are still asked when the record has never held them', () => {
    expect(onboarding).toContain('const askIntake = mode === \'clinic-code\' && (linked ? !!prefill?.needsIntake : !intakeAnswered)')
  })

  it('the shared clinic device always has a way back to the full form', () => {
    expect(onboarding).toContain('setEditDetails(true)')
    expect(onboarding).toContain('Not them?')
  })

  it('both clinician surfaces pass the viewKey, and only alongside a patient code', () => {
    expect(hub).toContain("(code && viewKey ? `&k=${encodeURIComponent(viewKey)}` : '')")
    expect(roster).toContain("(code ? `&k=${encodeURIComponent(clinic.viewKey)}` : '')")
  })

  it('a clinician launch that resolves nothing says so instead of showing a blank form', () => {
    expect(onboarding).toContain('setResolveFailed(true)')
    expect(onboarding).toContain('Couldn&rsquo;t load this patient&rsquo;s record')
  })

  it('the trainer scrubs the key from the address bar and never persists it', () => {
    expect(app).toContain("url.searchParams.delete('k')")
    expect(app).toContain('window.history.replaceState(null, \'\', url.toString())')
    expect(app).not.toMatch(/savePatientState[^\n]*viewKey/)
  })

  it('a shared device never adopts another patient’s episode', () => {
    expect(app).toContain('const otherPatient = !!urlP && !!saved && storedP !== urlP')
    expect(app).toContain('const stored = otherPatient ? null : saved')
  })
})

/**
 * 2026-10-06, second report: "still doesnt populate from run re-test butto[n]".
 * Ground truth from the production DB: sst_clinic_patients was EMPTY — no
 * patient had ever been minted — and the one roster patient carrying a
 * "patientCode" had the CLINIC code in its session payload (someone typed the
 * clinic code into the patient-code box; both are six characters from the same
 * alphabet, so nothing rejected it). So the link resolved nothing and the
 * trainer had nothing to populate from.
 */
describe('a patient with history but no minted record can still be linked', () => {
  const api = readFileSync('app/api/sst/clinic-sessions/route.ts', 'utf8')
  const registry = readFileSync('lib/sst-trainer/patient-registry.ts', 'utf8')
  const route = readFileSync('app/api/sst/patient/route.ts', 'utf8')

  it('a payload code equal to the clinic code is not treated as a patient code', () => {
    expect(api).toContain("if (pc && pc.toUpperCase() !== code) p.patientCode = pc")
  })

  it('the roster back-fills the minted code from the patients table by label', () => {
    expect(api).toContain('SELECT patient_code, label FROM sst_clinic_patients')
    expect(api).toContain('const unlinked = [...byPatient.values()].filter((p) => !p.patientCode')
  })

  it('that back-fill refuses an ambiguous label rather than stitching two people together', () => {
    expect(api).toContain('if (hits && hits.length === 1) p.patientCode = hits[0]')
  })

  it('the demo clinic is never back-filled from the real patients table', () => {
    expect(api).toContain("if (code !== 'DEMO00') {")
  })

  it('find-or-create by label mints only when the label is unambiguous', () => {
    expect(registry).toContain('export async function findOrCreatePatientByLabel')
    expect(registry).toContain('if (rows.length > 1) return null')
    expect(registry).toContain("LIMIT 2")
  })

  it('it mints nothing for a blank label', () => {
    const i = registry.indexOf('export async function findOrCreatePatientByLabel')
    expect(registry.slice(i, i + 1400)).toContain('if (!clinicCode || !label) return null')
  })

  it("the ensure action is clinician-authed and never emails", () => {
    const i = route.indexOf("if (body?.action === 'ensure')")
    expect(i).toBeGreaterThan(-1)
    // sits AFTER the viewKey check and the demo read-only guard
    expect(route.indexOf('await verifyViewKey(clinicCode, viewKey)')).toBeLessThan(i)
    expect(route.indexOf("Demo clinic is read-only")).toBeLessThan(i)
    // returns before any send path is reached
    expect(i).toBeLessThan(route.indexOf('buildPatientWelcomeEmail'))
  })
})
