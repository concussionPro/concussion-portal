'use client'

import { EpCourseNavigation } from '@/components/ep-course/EpCourseNavigation'
import { EpInteractiveElements } from '@/components/ep-course/EpInteractiveElements'
import { epProgressId } from '@/data/ep-module-meta'
import { CourseModulePage, type CourseModuleDescriptor } from '@/components/course/CourseModulePage'
import type { InitialModuleData } from '@/hooks/useModuleData'

/**
 * EP course (Concussion Rehab Mastery). All behaviour lives in the shared
 * CourseModulePage; this descriptor is the complete list of EP-specific
 * behaviour:
 *
 * - Progress ids are namespaced to 201-208 (epProgressId): the shared
 *   ProgressContext store also holds the flagship course's modules 1-8, and
 *   identical ids corrupted progress across the two courses.
 * - Checkpoint keys are ep- prefixed so they can never collide with the
 *   flagship course's `module-N-checkpoint` keys.
 * - Downloadable Resources / Apply Tomorrow are ON (2026-08-05 parity). Both
 *   components are keyed by (course, moduleId) now, so the EP course sees its
 *   OWN deliverables — the printable documents at /ep-course/documents/[slug] —
 *   and never the flagship's, which is what keying on the shared display ids
 *   1-8 alone used to do.
 * - Demo/ESSA-review viewers get isolated quizzes (never persist/restore).
 * - EP pass mark is 80% — must match ProgressContext's quizPassThreshold
 *   for the namespaced ids 201-208.
 */
const EP_COURSE: CourseModuleDescriptor = {
  course: 'ep',
  NavComponent: EpCourseNavigation,
  InteractiveComponent: EpInteractiveElements,
  progressIdFor: epProgressId,
  checkpointKeyFor: (id) => `ep-module-${id}-checkpoint`,
  loginPathFor: (id) => `/ep-course/modules/${id}`,
  // The COURSE dashboard, not Module 1. Every "back"/"view all modules" exit in
  // the shared player lands here, and it is the only surface carrying the CRM
  // certificate link (2026-08-05 parity: finishing module 8 used to dump the
  // buyer back into Module 1 with no route to their certificate).
  backHref: '/ep-course/dashboard',
  moduleBasePath: '/ep-course/modules',
  passMarkPercent: 80,
  showResources: true,
  supportsDemoViewer: true,
  hasScatModules: false,
  // Finishing module 8 surfaces the claim-your-certificate CTA — the CRM cert
  // is a real, server-verified ESSA CPD certificate (/api/certificate?type=crm).
  showCertificateCta: true,
  headerModuleNumber: 'url',
  scatQuizFailUpsellSuffix: '8 modules, 8 CPD hours',
}

export default function EpModuleClient({
  initialModuleData,
  initialAuth,
}: {
  initialModuleData?: InitialModuleData
  initialAuth?: { authenticated: boolean; email: string; isDemo: boolean }
}) {
  return (
    <CourseModulePage
      descriptor={EP_COURSE}
      initialModuleData={initialModuleData}
      initialAuth={initialAuth}
    />
  )
}
