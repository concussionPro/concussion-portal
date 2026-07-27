import { isOwnerEmail } from '@/lib/owner'
import { hasSstEntitlement } from '@/lib/users'

/**
 * Who may use the Clinical Testing suite (owner directive 2026-07-06).
 * Three doors, and course content stays purchase-gated regardless:
 *   - owner (test dashboard)
 *   - paid COURSE buyer — tools are "yours with enrolment through the
 *     founding period" (homepage promise)
 *   - SST-entitled clinic — the reverse funnel: signed up for the tool,
 *     access_level still 'preview' so modules/toolkit/reference upsell.
 */
/**
 * Access doors:
 *   owner|course|sst → ENTITLED, render the tools.
 *   'unreleased'     → pre-launch (flag off), non-owner → "in final testing".
 *   'locked'         → launched but this visitor isn't entitled → show-then-sell.
 */
// 'demo' — the scoped /demo/clinic tour: workspace + SST + baseline demos
// ONLY; documents/patients/billing stay locked (owner: "MUST LOCK ALL ASSETS
// except the clinical trainer demos/trial"). Granted by the access ROUTE from
// the clinic_demo cookie — resolveClinicalAccess never returns it.
export type ClinicalAccess = 'owner' | 'course' | 'sst' | 'demo' | 'locked' | 'unreleased'

export async function resolveClinicalAccess(session: {
  email: string
  accessLevel: string
}): Promise<ClinicalAccess> {
  if (isOwnerEmail(session.email)) return 'owner'
  // An SST-entitled clinic ALWAYS gets the tools — the entitlement is a
  // deliberate grant (founding signup / admin), so it's never gated by the
  // launch flag. This is the reverse funnel: they log into the SAME CEA
  // portal, Clinical Testing unlocked, everything else purchase-gated.
  if (await hasSstEntitlement(session.email)) return 'sst'
  // LAUNCH FLAG: until SST_CLINICAL_LIVE=true, COURSE buyers and the public
  // don't yet see the suite (pre-general-launch). Flip to open it to course
  // buyers; entitled clinics above are already in.
  if (process.env.SST_CLINICAL_LIVE !== 'true') return 'unreleased'
  if (session.accessLevel === 'online-only' || session.accessLevel === 'full-course') return 'course'
  return 'locked'
}

const ENTITLED = new Set(['owner', 'course', 'sst'])

export async function hasClinicalAccess(session: {
  email: string
  accessLevel: string
}): Promise<boolean> {
  return ENTITLED.has(await resolveClinicalAccess(session))
}
