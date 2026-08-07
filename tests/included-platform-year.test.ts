/**
 * The platform year INCLUDED with a course enrolment.
 *
 * Owner model: a course enrolment includes the working clinical platform for 12
 * months at the single-clinician tier, and then the clinic is PROMPTED to
 * subscribe — never auto-charged (a domestic course checkout saves no payment
 * method and nobody consented to off-session billing a year later).
 *
 * These are the invariants that model rests on. Each one has been broken at
 * least once:
 *
 *  1. A DOMESTIC course buyer (CRM or CCM) must land on 'active' at the tier a
 *     course enrolment INCLUDES (SST_INCLUDED_TIER — the 5-patient 'starter'
 *     rung since the 2026-08-07 four-tier restructure; it was 'single' when
 *     'single' still meant five patients) with
 *     FULL, non-watermarked documents — not the 3-patient trial cap. Until
 *     2026-08-06 the cap was lifted only when a Stripe subscription was
 *     attached, and that only ever happened for international CRM, so every AUD
 *     buyer got a trial clinic despite the sales page promising otherwise.
 *  2. The grant is the INCLUDED tier, not unlimited. An earlier unconditional
 *     lift handed every provisioned buyer an uncapped clinic free forever.
 *  3. The grant is a FLOOR, never a downgrade. setSstClinicPlan writes
 *     `tier = COALESCE(new, old)`, so passing a LOW tier overwrites a better
 *     existing entitlement: an alumni comp (active/tier NULL = unlimited) fell
 *     to a 5-patient cap, and a clinic paying $99/mo on tier 'clinic' fell from
 *     10 to 5 while still being billed. All 26 production clinics are
 *     active/tier-NULL comps, and alumni are the warmest CRM buyers there are.
 *  4. At expiry the clinic reverts to the TRIAL ALLOWANCE for NEW patients and
 *     is never cut off — ending access mid-rehabilitation is a clinical
 *     problem, not a billing one.
 *  5. A real Stripe subscription always WINS over included_until (Stripe
 *     governs that period).
 *  6. `included_until` is a LAZILY migrated column. Every read of it must
 *     survive the column not existing yet — on 2026-08-06 it did not exist in
 *     production, and naming it directly made Postgres reject the entire
 *     statement, which silently turned "find this clinic" into "no such
 *     clinic".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SST_INCLUDED_TIER } from '@/lib/config'

// ── A programmable Postgres stand-in ────────────────────────────────────────
// Dispatches on the reconstructed query text so each test can put the database
// in a specific state, including "the column does not exist".
type Row = Record<string, unknown>
let sqlHandler: (query: string, values: unknown[]) => Row[]

vi.mock('@/lib/db', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.join(' ? ').replace(/\s+/g, ' ').trim()
    const rows = sqlHandler(query, values)
    return Promise.resolve({ rows, rowCount: rows.length })
  },
}))

let kvRecord: Row | null = null
vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(async () => kvRecord),
    set: vi.fn(async () => 'OK'),
    exists: vi.fn(async () => 0),
  },
}))

import { getClinicUsage, TRIAL_PATIENT_CAP, TIER_ACTIVE_PATIENT_CAP } from '@/lib/sst-trainer/clinic-registry'

/** The column exists and holds `includedUntil`; the clinic has `subscription`. */
function dbWithColumn(opts: { includedUntil: string | null; subscription: string | null; plan?: string; tier?: string | null; patients?: number }) {
  return (query: string): Row[] => {
    if (query.includes('included_until')) {
      return [{ included_until: opts.includedUntil, stripe_subscription_id: opts.subscription }]
    }
    if (query.startsWith('SELECT plan, tier')) {
      return [{ plan: opts.plan ?? 'active', tier: opts.tier ?? null }]
    }
    if (query.includes('COUNT(DISTINCT')) return [{ n: opts.patients ?? 0 }]
    return []
  }
}

/** The lazily-migrated column has NOT been added yet — Postgres rejects it. */
function dbWithoutColumn(opts: { plan?: string; tier?: string | null; patients?: number } = {}) {
  return (query: string): Row[] => {
    if (query.includes('included_until')) {
      throw new Error('column "included_until" does not exist')
    }
    if (query.startsWith('SELECT plan, tier')) {
      return [{ plan: opts.plan ?? 'active', tier: opts.tier ?? null }]
    }
    if (query.includes('COUNT(DISTINCT')) return [{ n: opts.patients ?? 0 }]
    return []
  }
}

const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
const FUTURE = new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString()

beforeEach(() => {
  kvRecord = null
  sqlHandler = () => []
})

describe('the included platform year, at the admission gate', () => {
  it('a domestic course buyer inside their included year is ACTIVE at the included tier', async () => {
    kvRecord = { clinicName: 'Buyer', plan: 'active', tier: SST_INCLUDED_TIER.plan }
    sqlHandler = dbWithColumn({ includedUntil: FUTURE, subscription: null, tier: SST_INCLUDED_TIER.plan })

    const usage = await getClinicUsage('ABC123')

    expect(usage.plan).toBe('active')
    expect(usage.cap).toBe(TIER_ACTIVE_PATIENT_CAP[SST_INCLUDED_TIER.plan])
    expect(usage.window).toBe('30d')
    // plan === 'active' is exactly what /api/sst/report reads to decide whether
    // to stamp the TRIAL watermark, so this assertion IS the "full documents"
    // guarantee the sales page makes.
    expect(usage.plan).not.toBe('trial')
  })

  it('reverts to the TRIAL allowance once the included year lapses with no subscription', async () => {
    kvRecord = { clinicName: 'Lapsed', plan: 'active', tier: SST_INCLUDED_TIER.plan }
    sqlHandler = dbWithColumn({ includedUntil: PAST, subscription: null, tier: SST_INCLUDED_TIER.plan })

    const usage = await getClinicUsage('ABC123')

    expect(usage.plan).toBe('trial')
    expect(usage.cap).toBe(TRIAL_PATIENT_CAP)
    expect(usage.window).toBe('lifetime')
  })

  it('a REAL Stripe subscription wins over a lapsed included_until', async () => {
    kvRecord = { clinicName: 'Subscriber', plan: 'active', tier: SST_INCLUDED_TIER.plan }
    sqlHandler = dbWithColumn({ includedUntil: PAST, subscription: 'sub_live_123', tier: SST_INCLUDED_TIER.plan })

    const usage = await getClinicUsage('ABC123')

    expect(usage.plan).toBe('active')
    expect(usage.cap).toBe(TIER_ACTIVE_PATIENT_CAP[SST_INCLUDED_TIER.plan])
  })

  it('a comped/alumni clinic (active, tier NULL, no included_until) stays UNLIMITED', async () => {
    kvRecord = { clinicName: 'Alumni comp', plan: 'active' }
    sqlHandler = dbWithColumn({ includedUntil: null, subscription: null, tier: null })

    const usage = await getClinicUsage('ABC123')

    expect(usage.plan).toBe('active')
    expect(usage.cap).toBeNull()
  })

  it('a lapsed clinic still lets its EXISTING patients through — only new admissions stop', async () => {
    // 20 patients seen over the included year, now reverted to the 3 cap.
    kvRecord = { clinicName: 'Lapsed busy', plan: 'active', tier: SST_INCLUDED_TIER.plan }
    sqlHandler = dbWithColumn({ includedUntil: PAST, subscription: null, tier: SST_INCLUDED_TIER.plan, patients: 20 })

    const usage = await getClinicUsage('ABC123')

    // The gate refuses a NEW admission…
    expect(usage.canAddPatient).toBe(false)
    // …and that is the ONLY thing it refuses. app/api/sst/session only consults
    // canAddPatient when the patient has never been seen before, so nobody
    // mid-rehabilitation is cut off. This assertion pins that the function
    // still resolves cleanly rather than throwing or reporting a dead clinic.
    expect(usage.patientCount).toBe(20)
    expect(usage.plan).toBe('trial')
  })

  it('marks a lapsed enrolment as includedLapsed, so no surface calls a buyer a trialist', async () => {
    kvRecord = { clinicName: 'Lapsed', plan: 'active', tier: SST_INCLUDED_TIER.plan }
    sqlHandler = dbWithColumn({ includedUntil: PAST, subscription: null, tier: SST_INCLUDED_TIER.plan })

    const usage = await getClinicUsage('ABC123')

    // Same ALLOWANCE as a trial, but not the same STORY. /api/sst/report,
    // /api/sst/session, /api/clinical-testing/invite and the subscribe page all
    // branch on this to avoid telling a paying course buyer that they are "on
    // the free trial" — which is false and reads as a bait-and-switch.
    expect(usage.plan).toBe('trial')
    expect(usage.includedLapsed).toBe(true)
  })

  it('a genuine trialist is NOT flagged as a lapsed enrolment', async () => {
    kvRecord = { clinicName: 'Real trial' }
    sqlHandler = dbWithColumn({ includedUntil: null, subscription: null, plan: 'trial' })

    const usage = await getClinicUsage('ABC123')

    expect(usage.plan).toBe('trial')
    expect(usage.includedLapsed).toBe(false)
  })

  it('a trial signup keeps the 3-patient cap — the course grant never leaks to it', async () => {
    kvRecord = { clinicName: 'Self-serve trial' }
    sqlHandler = dbWithoutColumn({ plan: 'trial' })

    const usage = await getClinicUsage('ABC123')

    expect(usage.plan).toBe('trial')
    expect(usage.cap).toBe(TRIAL_PATIENT_CAP)
    expect(usage.window).toBe('lifetime')
  })
})

describe('included_until is lazily migrated, so every read must tolerate its absence', () => {
  it('does NOT demote a paying clinic when the column does not exist yet', async () => {
    kvRecord = { clinicName: 'Paid', plan: 'active', tier: SST_INCLUDED_TIER.plan }
    sqlHandler = dbWithoutColumn({ plan: 'active', tier: SST_INCLUDED_TIER.plan })

    const usage = await getClinicUsage('ABC123')

    // Absent column means "no included period recorded", never "expired".
    expect(usage.plan).toBe('active')
    expect(usage.cap).toBe(TIER_ACTIVE_PATIENT_CAP[SST_INCLUDED_TIER.plan])
  })

  it('the gate reads the column through to_jsonb so Postgres never rejects the statement', async () => {
    // Regression: naming `included_until` directly made Postgres reject the
    // WHOLE select, which the caller could only see as "no such clinic".
    const seen: string[] = []
    kvRecord = { clinicName: 'Paid', plan: 'active', tier: SST_INCLUDED_TIER.plan }
    sqlHandler = (query) => {
      seen.push(query)
      if (query.includes('included_until')) {
        // A bare column reference would be rejected by a pre-migration schema.
        expect(query).toContain("to_jsonb")
        return [{ included_until: null, stripe_subscription_id: null }]
      }
      if (query.includes('COUNT(DISTINCT')) return [{ n: 0 }]
      return [{ plan: 'active', tier: SST_INCLUDED_TIER.plan }]
    }

    await getClinicUsage('ABC123')

    expect(seen.some((q) => q.includes('included_until'))).toBe(true)
  })
})

describe('the clinic registry survives a KV outage', () => {
  it('resolves a clinic from Postgres when KV throws, instead of "code not recognised"', async () => {
    // getClinic backs isRegisteredClinic + verifyViewKey, which gate ~18 SST
    // routes. A KV blip used to tell a PAYING clinic its code was unknown
    // across the hub, reports, PMS filing and live monitoring.
    const { kv } = await import('@vercel/kv')
    vi.mocked(kv.get).mockRejectedValueOnce(new Error('KV unreachable'))
    sqlHandler = (query) => {
      if (query.startsWith('SELECT clinic_name')) {
        return [{ clinic_name: 'Real Clinic', contact_name: 'Zac', email: 'z@x.com', view_key: 'vk', created_at: '2026-01-01T00:00:00Z', plan: 'active', tier: 'clinic' }]
      }
      return []
    }

    const { getClinic, isRegisteredClinic, verifyViewKey } = await import('@/lib/sst-trainer/clinic-registry')
    expect((await getClinic('ABC123'))?.clinicName).toBe('Real Clinic')

    vi.mocked(kv.get).mockRejectedValueOnce(new Error('KV unreachable'))
    expect(await isRegisteredClinic('ABC123')).toBe(true)

    // The fallback must carry the viewKey, or every clinician read still fails.
    vi.mocked(kv.get).mockRejectedValueOnce(new Error('KV unreachable'))
    expect(await verifyViewKey('ABC123', 'vk')).toBe(true)
  })

  it('still fails closed for a genuinely unknown code', async () => {
    const { kv } = await import('@vercel/kv')
    vi.mocked(kv.get).mockRejectedValueOnce(new Error('KV unreachable'))
    sqlHandler = () => [] // no such row in Postgres either

    const { isRegisteredClinic } = await import('@/lib/sst-trainer/clinic-registry')
    expect(await isRegisteredClinic('NOSUCH')).toBe(false)
  })

  it('a wrong view key is still rejected when serving from the Postgres fallback', async () => {
    const { kv } = await import('@vercel/kv')
    vi.mocked(kv.get).mockRejectedValueOnce(new Error('KV unreachable'))
    sqlHandler = (query) =>
      query.startsWith('SELECT clinic_name')
        ? [{ clinic_name: 'Real', contact_name: '', email: 'z@x.com', view_key: 'correct-key', created_at: '2026-01-01T00:00:00Z', plan: 'active', tier: null }]
        : []

    const { verifyViewKey } = await import('@/lib/sst-trainer/clinic-registry')
    // Never weaken a gate to survive an outage.
    expect(await verifyViewKey('ABC123', 'wrong-key')).toBe(false)
  })
})

describe('provisioning a course buyer is a FLOOR, never a downgrade', () => {
  // provisionPlatformForBuyer is exercised through its collaborators: what
  // matters is precisely which plan flip it asks for.
  async function provisionAgainst(existing: { plan: string; tier: string | null } | null, subscription: string | null) {
    vi.resetModules()
    const setSstClinicPlan = vi.fn(async () => {})
    const createSstClinic = vi.fn(async () => ({
      code: 'NEW123', clinicName: 'C', contactName: 'N', email: 'e@x.com', viewKey: 'k', createdAt: '', plan: 'trial', tier: null,
    }))
    vi.doMock('@/lib/sst-trainer/clinic-registry', () => ({
      getSstClinicByEmail: vi.fn(async () =>
        existing ? { code: 'EXIST1', clinicName: 'C', contactName: 'N', email: 'e@x.com', viewKey: 'k', createdAt: '', ...existing } : null,
      ),
      getSstClinicStripeSubscription: vi.fn(async () => subscription),
      createSstClinic,
      setSstClinicPlan,
    }))
    vi.doMock('@/lib/sst-trainer/clinic-welcome-email', () => ({ buildWelcomeEmail: () => '<p>hi</p>' }))
    vi.doMock('@/lib/resend-client', () => ({ sendEmail: vi.fn(async () => true), escapeHtml: (s: string) => s }))
    vi.doMock('@/lib/users', () => ({ grantSstEntitlement: vi.fn(async () => 'user-1') }))
    vi.doMock('@/lib/magic-link-jwt', () => ({ createMagicToken: vi.fn(() => 'tok') }))

    const { provisionPlatformForBuyer, INCLUDED_PLATFORM_MONTHS } = await import('@/lib/sst-trainer/bundle')
    await provisionPlatformForBuyer('e@x.com', 'Name', undefined, true)
    return { setSstClinicPlan, createSstClinic, INCLUDED_PLATFORM_MONTHS }
  }

  it('a brand-new domestic buyer gets active at the INCLUDED tier with a 12-month period', async () => {
    const { setSstClinicPlan, INCLUDED_PLATFORM_MONTHS } = await provisionAgainst(null, null)
    expect(setSstClinicPlan).toHaveBeenCalledWith('NEW123', 'active', { tier: SST_INCLUDED_TIER.plan }, INCLUDED_PLATFORM_MONTHS)
    // Explicitly NOT an unlimited clinic: a tier is always named, and it is the
    // tier an enrolment INCLUDES — the 5-patient rung, not the $39 single.
    const [, , stripeArg] = setSstClinicPlan.mock.calls[0] as unknown as [string, string, { tier: string }]
    expect(stripeArg.tier).toBe(SST_INCLUDED_TIER.plan)
    expect(stripeArg.tier).not.toBe(null)
  })

  it('never downgrades an alumni comp (active, tier NULL = unlimited)', async () => {
    const { setSstClinicPlan } = await provisionAgainst({ plan: 'active', tier: null }, null)
    expect(setSstClinicPlan).not.toHaveBeenCalled()
  })

  it('never downgrades a clinic paying on a LARGER tier', async () => {
    const { setSstClinicPlan } = await provisionAgainst({ plan: 'active', tier: 'clinic' }, 'sub_1')
    expect(setSstClinicPlan).not.toHaveBeenCalled()
  })

  it('never stamps an included period over a period Stripe is governing', async () => {
    const { setSstClinicPlan } = await provisionAgainst({ plan: 'active', tier: SST_INCLUDED_TIER.plan }, 'sub_live')
    expect(setSstClinicPlan).not.toHaveBeenCalled()
  })

  it('DOES grant to an existing clinic still on the trial cap', async () => {
    const { setSstClinicPlan, INCLUDED_PLATFORM_MONTHS } = await provisionAgainst({ plan: 'trial', tier: null }, null)
    expect(setSstClinicPlan).toHaveBeenCalledWith('EXIST1', 'active', { tier: SST_INCLUDED_TIER.plan }, INCLUDED_PLATFORM_MONTHS)
  })
})
