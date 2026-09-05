import { cookies } from 'next/headers'
import { verifySessionToken } from '@/lib/jwt-session'
import { DEMO_KEY, CLINIC_DEMO_KEY } from '@/lib/demo-key'
import { isDemoUserId } from '@/lib/demo-session'
import { getCurrentAccessLevel } from '@/lib/users'
import {
  resolveModuleForAccess,
  resolveFlagshipCallerAccessLevel,
  type AccessLevel,
} from '@/lib/module-access'
import type { InitialModuleData } from '@/hooks/useModuleData'
import FlagshipModuleClient from './FlagshipModuleClient'

/**
 * /modules/[id] — flagship learning suite (paid modules 1-8 + free SCAT 101-103).
 *
 * SERVER COMPONENT. It resolves the module for the signed-in user's access level
 * using the SAME gate as /api/modules/[id] (lib/module-access.ts) and hands the
 * result to the client player as `initialModuleData`, so the content is present
 * on the first paint.
 *
 * Before this, every module load was: empty HTML + a spinner → hydrate → GET
 * /api/auth/session → GET /api/modules/N (~65KB for Module 1) → render. Three
 * sequential round trips before a paying clinician saw the first word of the
 * course. The client hook still owns re-fetching (it re-checks after a Stripe
 * upgrade completes in another tab), so nothing about the upgrade flow changes.
 *
 * Gating is UNCHANGED and still enforced server-side — a free-tier user gets the
 * same two truncated sections with quiz answers stripped that the API returns.
 * Reviewer demo_key (via /demo/essa etc.) is treated as full-course, matching
 * toolkit-access and /api/auth/session synthesis; clinic_demo stays preview.
 */
export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const moduleId = parseInt(id)

  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  const session = token ? verifySessionToken(token) : null

  const reviewerDemo = cookieStore.get('demo_key')?.value === DEMO_KEY
  // Clinic-prospect demo (/demo/clinic) carries no session — the clinic_demo
  // cookie maps to PREVIEW scope, mirroring /api/modules/[id].
  const clinicDemo = cookieStore.get('clinic_demo')?.value === CLINIC_DEMO_KEY

  let accessLevel: AccessLevel | null = resolveFlagshipCallerAccessLevel({
    sessionAccessLevel: session?.accessLevel ?? null,
    demoKeyCookie: cookieStore.get('demo_key')?.value,
    clinicDemoCookie: cookieStore.get('clinic_demo')?.value,
  })

  // Revocation re-check (2026-08-05 sweep #5): a 365-day session JWT outlives
  // a refund downgrade — when the session CLAIMS a paid level, the DB row is
  // the truth for paid content. One cheap indexed select, only on paid claims;
  // demo_key, unauthenticated and free paths never touch the DB here.
  if (
    !reviewerDemo &&
    session &&
    !isDemoUserId(session.userId) &&
    (session.accessLevel === 'online-only' || session.accessLevel === 'full-course')
  ) {
    const dbLevel = await getCurrentAccessLevel(session.userId)
    if (dbLevel) accessLevel = dbLevel
  }

  let initialModuleData: InitialModuleData | undefined
  if (Number.isFinite(moduleId) && accessLevel) {
    const result = resolveModuleForAccess(moduleId, accessLevel)
    if (result.ok) {
      initialModuleData = {
        // For the free tier this carries a MASKED quiz (correctAnswer +
        // explanation removed) — exactly the shape /api/modules/[id] has always
        // returned to preview users, which the player already renders correctly.
        // The client's `Module` type doesn't model the masked variant, so the
        // cast states what the API contract has always implied.
        module: result.module as InitialModuleData['module'],
        accessLevel: result.accessLevel,
        needsUpgrade: false,
        allSectionTitles: result.allSectionTitles ?? null,
      }
    } else if (result.status === 403 && result.upgrade) {
      // Free tier on a paid module — render the upgrade screen immediately
      // rather than flashing a spinner first.
      initialModuleData = {
        module: null,
        accessLevel: 'preview',
        needsUpgrade: true,
        allSectionTitles: null,
      }
    }
    // 401/404 fall through with no initial data — the client hook fetches and
    // renders its existing error/auth states.
  }

  // Identity the client player would otherwise re-fetch before painting
  // ANYTHING. Without this the server's whole reason for existing here (see the
  // header comment) was cancelled by a client-side auth spinner.
  const initialAuth = {
    authenticated: !!session || clinicDemo || reviewerDemo,
    email: session?.email ?? '',
    isDemo: clinicDemo || reviewerDemo || (session ? isDemoUserId(session.userId) : false),
  }

  return <FlagshipModuleClient initialModuleData={initialModuleData} initialAuth={initialAuth} />
}
