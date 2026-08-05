import { getEpModuleById } from '@/data/ep-modules'
import { checkCrmServerAccess } from '@/components/ep-course/CrmCourseGate'
import type { InitialModuleData } from '@/hooks/useModuleData'
import EpModuleClient from './EpModuleClient'

/**
 * /ep-course/modules/[id] — Concussion Rehab Mastery (CRM / EP stream).
 *
 * SERVER COMPONENT, mirroring the flagship /modules/[id]. It resolves the
 * module with the SAME gate the content API uses (checkCrmServerAccess — the
 * non-redirecting half of the CRM gate, so a non-owner still gets the in-page
 * upgrade screen rather than a bounce) and hands the result to the client
 * player as `initialModuleData`, so the content is present on the first paint.
 *
 * Before this, every CRM module load was: empty HTML + a spinner → hydrate →
 * GET /api/auth/session → GET /api/ep-course/modules/N (65-90KB) → render.
 * Three sequential round trips before a paying exercise physiologist saw the
 * first word of the course they bought — while CCM buyers had server-rendered
 * first paint since the flagship page was converted.
 *
 * Gating is UNCHANGED and still enforced server-side: an unentitled visitor
 * gets `needsUpgrade` (module: null) exactly as /api/ep-course/modules/[id]
 * returns on 403, and the client hook still owns re-fetching after a checkout
 * completes in another tab.
 */
export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const moduleId = parseInt(id, 10)

  let initialModuleData: InitialModuleData | undefined
  if (Number.isFinite(moduleId)) {
    const access = await checkCrmServerAccess()
    const epModule = getEpModuleById(moduleId)

    if (access.ok && epModule) {
      initialModuleData = {
        module: epModule,
        accessLevel: 'full-course',
        needsUpgrade: false,
        allSectionTitles: null,
      }
    } else if (!access.ok && epModule) {
      // Not entitled, but a real module — render the enrolment screen
      // immediately rather than flashing a spinner first. Section titles are
      // the same teaser the API's 403 carries.
      initialModuleData = {
        module: null,
        accessLevel: 'preview',
        needsUpgrade: true,
        allSectionTitles: epModule.sections.map((s) => s.title),
      }
    }
    // Unknown module id falls through with no initial data — the client hook
    // fetches and renders its existing 404 state.
  }

  return <EpModuleClient initialModuleData={initialModuleData} />
}
