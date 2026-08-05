'use client'

import { EpCourseNavigation } from '@/components/ep-course/EpCourseNavigation'
import { EpInteractiveElements } from '@/components/ep-course/EpInteractiveElements'
import { epProgressId } from '@/data/ep-module-meta'
import { CourseModulePage, type CourseModuleDescriptor } from '@/components/course/CourseModulePage'

/**
 * EP course (Concussion Rehab Mastery) — private ESSA-review demo. All
 * behaviour lives in the shared CourseModulePage; this descriptor is the
 * complete list of EP-specific behaviour:
 *
 * - Progress ids are namespaced to 201-208 (epProgressId): the shared
 *   ProgressContext store also holds the flagship course's modules 1-8, and
 *   identical ids corrupted progress across the two courses.
 * - Checkpoint keys are ep- prefixed so they can never collide with the
 *   flagship course's `module-N-checkpoint` keys.
 * - No Downloadable Resources / Apply Tomorrow steps: those components are
 *   keyed by moduleId and the EP modules share ids 1-8 with the flagship,
 *   so they'd leak flagship content. Content sections + Knowledge Check only.
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
  showResources: false,
  supportsDemoViewer: true,
  hasScatModules: false,
  // Finishing module 8 surfaces the claim-your-certificate CTA — the CRM cert
  // is a real, server-verified ESSA CPD certificate (/api/certificate?type=crm).
  showCertificateCta: true,
  headerModuleNumber: 'url',
  scatQuizFailUpsellSuffix: '8 modules, 8 CPD hours',
}

export default function ModulePage() {
  return <CourseModulePage descriptor={EP_COURSE} />
}
