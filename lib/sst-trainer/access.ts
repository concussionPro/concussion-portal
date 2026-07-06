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
export type ClinicalAccess = 'owner' | 'course' | 'sst' | 'locked' | 'unreleased'

export async function resolveClinicalAccess(session: {
  email: string
  accessLevel: string
}): Promise<ClinicalAccess> {
  if (isOwnerEmail(session.email)) return 'owner'
  // LAUNCH FLAG: until SST_CLINICAL_LIVE=true the suite is owner-only
  // (unreleased until the subscription launch). Flip the env to open it to
  // course buyers + SST-entitled clinics in one move.
  if (process.env.SST_CLINICAL_LIVE !== 'true') return 'unreleased'
  if (session.accessLevel === 'online-only' || session.accessLevel === 'full-course') return 'course'
  if (await hasSstEntitlement(session.email)) return 'sst'
  return 'locked'
}

const ENTITLED = new Set(['owner', 'course', 'sst'])

export async function hasClinicalAccess(session: {
  email: string
  accessLevel: string
}): Promise<boolean> {
  return ENTITLED.has(await resolveClinicalAccess(session))
}
