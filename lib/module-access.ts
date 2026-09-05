/**
 * Flagship module resolution + access gating — ONE implementation.
 *
 * Extracted from app/api/modules/[id]/route.ts so the module PAGE can resolve
 * its content during SERVER rendering instead of the browser fetching it after
 * hydration. Previously every module load was: empty HTML shell with a spinner
 * → hydrate → GET /api/auth/session → GET /api/modules/N (~65KB) → render. Three
 * sequential round trips before a paying customer saw the first word of the
 * course they bought.
 *
 * The route still exists (the client re-fetches after a Stripe upgrade, and the
 * endpoint is used directly elsewhere) and now shares this function, so the
 * server-rendered content and the API can never disagree about what is unlocked.
 *
 * SERVER-ONLY — imports the full course content.
 */
import { getModuleById, type Module, type QuizQuestion } from '@/data/modules'
import { getSCATModuleById } from '@/data/scat-modules'
import { DEMO_KEY, CLINIC_DEMO_KEY } from '@/lib/demo-key'

export type AccessLevel = 'preview' | 'online-only' | 'full-course'

/** How many sections of a PAID module a free-tier user may read. */
export const PREVIEW_SECTION_COUNT = 2

/** A quiz question with the answer + explanation removed for the free tier. */
export type MaskedQuizQuestion = Omit<QuizQuestion, 'correctAnswer' | 'explanation'>

/** What a caller receives: either the full module, or one whose quiz is masked. */
export type ServedModule = Module | (Omit<Module, 'quiz'> & { quiz: MaskedQuizQuestion[] })

export type ModuleAccessResult =
  | { ok: true; module: ServedModule; accessLevel: AccessLevel; allSectionTitles?: string[] }
  | { ok: false; status: 401 | 403 | 404; error: string; upgrade?: boolean }

/** SCAT modules (101-104) are the free course — always fully open. */
export function isScatModuleId(moduleId: number): boolean {
  return moduleId >= 101 && moduleId <= 104
}

/**
 * Resolve a flagship module for a given access level, applying every gate:
 *  - paid (online-only / full-course): the full module;
 *  - free tier: SCAT modules in full, Module 1 truncated to
 *    PREVIEW_SECTION_COUNT sections with quiz ANSWERS STRIPPED and the full
 *    section-title list returned for the locked banner, and modules 2-8 refused
 *    with an upgrade flag.
 *
 * `accessLevel` null means unauthenticated.
 */
export function resolveModuleForAccess(
  moduleId: number,
  accessLevel: AccessLevel | null,
): ModuleAccessResult {
  if (!Number.isFinite(moduleId)) {
    return { ok: false, status: 404, error: 'Module not found' }
  }
  if (!accessLevel) {
    return { ok: false, status: 401, error: 'Authentication required' }
  }

  const hasFullAccess = accessLevel === 'online-only' || accessLevel === 'full-course'
  const isScat = isScatModuleId(moduleId)
  // Named `resolved`, not `module` — `module` is a reserved binding in a Next.js
  // module scope (@next/next/no-assign-module-variable).
  let resolved: Module | undefined

  if (hasFullAccess) {
    resolved = getModuleById(moduleId) || getSCATModuleById(moduleId)
    if (!resolved) return { ok: false, status: 404, error: 'Module not found' }
  } else {
    const scatModule = getSCATModuleById(moduleId)
    if (scatModule) {
      resolved = scatModule
    } else if (moduleId === 1) {
      resolved = getModuleById(moduleId)
      if (!resolved) return { ok: false, status: 404, error: 'Module not found' }
    } else {
      return {
        ok: false,
        status: 403,
        error: 'This module requires full course access',
        upgrade: true,
      }
    }
  }

  // Free tier on a PAID module: truncate + strip answers. SCAT modules keep
  // full quiz data so free users can complete them and earn their CPD hour.
  if (accessLevel === 'preview' && !isScat) {
    const allSectionTitles = resolved.sections.map((s) => s.title)
    const truncated = {
      ...resolved,
      sections: resolved.sections.slice(0, PREVIEW_SECTION_COUNT),
      quiz: (resolved.quiz ?? []).map(
        ({ correctAnswer: _a, explanation: _e, ...q }): MaskedQuizQuestion => q,
      ),
    }
    return { ok: true, module: truncated, accessLevel, allSectionTitles }
  }

  return { ok: true, module: resolved, accessLevel }
}


/**
 * Resolve the caller's AccessLevel for flagship CCM modules from cookies +
 * session claim. Mirrors toolkit-access and /api/auth/session synthesis:
 *  - valid demo_key (ESSA/partner reviewer) → full-course
 *  - session JWT claim → that level
 *  - clinic_demo (prospect tour) → preview only — NEVER paid modules
 *  - localhost DEV → full-course (review without login)
 *  - else null → 401 Authentication required
 *
 * demo_key wins over a lingering clinic_demo / preview session so reviewers
 * who also toured /demo/clinic still get the paid CCM copy. Anonymous users
 * and clinic_demo alone stay gated.
 */
export function resolveFlagshipCallerAccessLevel(input: {
  sessionAccessLevel?: AccessLevel | null
  demoKeyCookie?: string | null
  clinicDemoCookie?: string | null
  nodeEnv?: string | null
}): AccessLevel | null {
  if (input.demoKeyCookie === DEMO_KEY) return 'full-course'
  if (
    input.sessionAccessLevel === 'preview' ||
    input.sessionAccessLevel === 'online-only' ||
    input.sessionAccessLevel === 'full-course'
  ) {
    return input.sessionAccessLevel
  }
  if (input.clinicDemoCookie === CLINIC_DEMO_KEY) return 'preview'
  if ((input.nodeEnv ?? process.env.NODE_ENV) !== 'production') return 'full-course'
  return null
}
