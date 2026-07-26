import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * ONE CLINIC CODE, BOTH TOOLS.
 *
 * The SST Trainer and the Preseason Baseline tool share the `clinic:{code}` KV
 * namespace deliberately — a clinic hands out ONE code and it drives both. But
 * the two minting paths had drifted:
 *
 *   - /api/preseason/register wrote a record with NO viewKey;
 *   - every SST clinician READ path requires one (verifyViewKey).
 *
 * So a baseline-first clinic got a code that ACCEPTED SST patient writes
 * (isRegisteredClinic only checks existence) while FAILING every read. Their
 * patients' threshold tests and training sessions went in and could never come
 * back out — a silent clinical-data blackhole.
 *
 * And because portal provisioning keyed idempotency off `sst_clinics` alone,
 * the same clinician logging into the portal later was minted a SECOND code,
 * splitting their patients across two.
 *
 * Source-level assertions: these are KV/DB paths that can't be exercised without
 * live infrastructure, so this guards the invariants at the places they broke.
 */
const REPO = join(__dirname, '..')
const read = (p: string) => readFileSync(join(REPO, p), 'utf8')

describe('both minting paths produce a fully-featured code', () => {
  it('preseason registration mints a viewKey', () => {
    const src = read('app/api/preseason/register/route.ts')
    expect(src).toMatch(/randomBytes\(18\)\.toString\('base64url'\)/)
    // …and actually stores it on the shared clinic record.
    expect(src).toMatch(/kv\.set\(`clinic:\$\{code\}`[\s\S]{0,300}viewKey/)
  })

  it('SST provisioning mints a viewKey', () => {
    const src = read('lib/sst-trainer/clinic-registry.ts')
    expect(src).toMatch(/const viewKey = crypto\.randomBytes\(18\)\.toString\('base64url'\)/)
  })

  it('clinician reads still REQUIRE the key — a code alone must not read a roster', () => {
    const src = read('lib/sst-trainer/clinic-registry.ts')
    expect(src).toMatch(/if \(!clinic\?\.viewKey\) return false/)
    expect(src).toMatch(/timingSafeEqual/)
  })
})

describe('a clinic never ends up with two codes', () => {
  it('portal provisioning adopts an existing preseason clinic before minting', () => {
    const src = read('app/api/clinical-testing/clinic/route.ts')
    expect(src).toMatch(/adoptExistingClinicForEmail/)
    // Both GET and POST must adopt, or the two disagree about which code is real.
    expect((src.match(/adoptExistingClinicForEmail\(session\.email\)/g) ?? []).length).toBe(2)
    // Adoption must be tried BEFORE createSstClinic.
    expect(src.indexOf('adoptExistingClinicForEmail')).toBeLessThan(src.indexOf('await createSstClinic'))
  })

  it('adoption backfills the viewKey and ensures the session table', () => {
    const src = read('lib/sst-trainer/clinic-registry.ts')
    const fn = src.slice(src.indexOf('export async function adoptExistingClinicForEmail'))
    expect(fn).toMatch(/preseason_clinics/)
    expect(fn).toMatch(/ensureSstClinicSessionsTable\(\)/)
    expect(fn).toMatch(/INSERT INTO sst_clinics/)
  })
})

describe('every SST clinician read path is key-gated', () => {
  const READ_ROUTES = [
    'app/api/sst/clinic-sessions/route.ts',
    'app/api/sst/report/route.ts',
    'app/api/sst/gp-report/route.ts',
    'app/api/sst/patient-summary/route.ts',
    'app/api/sst/live/route.ts',
  ]
  it.each(READ_ROUTES)('%s verifies the viewKey', (file) => {
    expect(read(file)).toMatch(/verifyViewKey/)
  })
})
