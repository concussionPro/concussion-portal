import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { grantSstEntitlement } from '@/lib/users'
import { recordAdminAction } from '@/lib/admin-audit'
import {
  createSstClinic,
  getSstClinicOwnedByEmail,
  setSstClinicPlan,
  getClinicUsage,
} from '@/lib/sst-trainer/clinic-registry'

/**
 * POST /api/admin/alumni-sst-activation — owner directive 2026-08-03:
 * "give alumni the 1 year free access… ID them and spin up their clinical
 * suite/tools in their dash's."
 *
 * For every PAID, non-test course user (online-only | full-course):
 *   1. grant the SST entitlement (the 'sst' access door — Clinical Testing
 *      unlocks in their dashboard regardless of the launch flag),
 *   2. provision their clinic idempotently (existing clinic wins; clinic
 *      name = their own name — solo-practitioner default, renameable later),
 *   3. set plan 'active' (lifts the 3-patient trial cap for the included year).
 *
 * Deliberately sends NO email — the owner communicates personally. The comp
 * year is recorded in the response (activated_at); billing at year-end is a
 * separate later step.
 *
 * OWNER-ONLY lookup (getSstClinicOwnedByEmail, never getSstClinicByEmail): the
 * member fallback resolves an alumnus SEATED at someone else's clinic to that
 * EMPLOYER's clinic, and this route would then have flipped a third party's
 * clinic to a comped 'active' plan. That lookup also throws rather than
 * swallowing DB errors to null — a swallowed error reads as "no clinic", and
 * the next line mints a DUPLICATE clinic + view key for a clinic that exists.
 * Any lookup failure is now recorded as an error for that alumnus and the run
 * moves on; nothing is provisioned on a guess.
 *
 * Body: { dryRun?: boolean }
 */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const dryRun = body?.dryRun !== false // default TRUE — must pass {dryRun:false} to execute

  const { rows: alumni } = await sql`
    SELECT id, email, name, access_level, created_at::date AS joined
    FROM users
    WHERE access_level IN ('online-only', 'full-course')
      AND COALESCE(is_test, false) = false
    ORDER BY created_at
  `

  const results: Array<Record<string, unknown>> = []
  let errors = 0
  for (const a of alumni) {
    const email = String(a.email).toLowerCase()
    const name = (a.name as string) || email.split('@')[0]
    // The lookup is INSIDE the try: a failure here must never fall through to
    // createSstClinic (see the header note on duplicate clinics).
    try {
      const existing = await getSstClinicOwnedByEmail(email)
      if (dryRun) {
        results.push({
          email,
          name,
          accessLevel: a.access_level,
          joined: a.joined,
          wouldProvision: !existing,
          existingCode: existing?.code ?? null,
        })
        continue
      }
      await grantSstEntitlement(email, name)
      const clinic =
        existing ??
        (await createSstClinic({ clinicName: name, contactName: name, email }))
      await setSstClinicPlan(clinic.code, 'active')
      const usage = await getClinicUsage(clinic.code)
      results.push({
        email,
        name,
        code: clinic.code,
        plan: usage.plan,
        capLifted: usage.cap === null,
        preExisting: Boolean(existing),
        activated_at: new Date().toISOString().slice(0, 10),
      })
    } catch (err) {
      // LOUD: a silent per-row failure in a comp-provisioning run is how a
      // clinic ends up half-activated with nobody noticing.
      errors += 1
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[alumni-sst-activation] FAILED for ${email}:`, err)
      results.push({ email, name, error: message })
    }
  }

  // A dry run mutates nothing, so it is not an audited action.
  if (!dryRun) {
    await recordAdminAction(req, {
      route: '/api/admin/alumni-sst-activation',
      target: `${alumni.length} alumni`,
      detail: { activated: results.length - errors, errors },
    })
  }

  // A partial run is a FAILURE the caller must see in the status code, not a
  // 200 with errors buried in a 25-element array.
  return NextResponse.json(
    { dryRun, count: alumni.length, errors, results },
    { status: errors > 0 ? 500 : 200 },
  )
}
