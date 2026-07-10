'use client'

import { CourseNavigation } from '@/components/course/CourseNavigation'
import { SectionInteractiveElements } from '@/components/course/SectionInteractiveElements'
import { CourseModulePage, type CourseModuleDescriptor } from '@/components/course/CourseModulePage'

/**
 * Flagship learning-suite course: paid modules 1-8 plus the free SCAT
 * modules 101-103. All behaviour lives in the shared CourseModulePage —
 * this descriptor is the complete list of flagship-specific behaviour.
 */
const FLAGSHIP_COURSE: CourseModuleDescriptor = {
  course: 'flagship',
  NavComponent: CourseNavigation,
  InteractiveComponent: SectionInteractiveElements,
  // Flagship progress ids ARE the display ids (1-8, 101-103).
  progressIdFor: (id) => id,
  checkpointKeyFor: (id) => `module-${id}-checkpoint`,
  loginPathFor: (id) => `/modules/${id}`,
  backHref: '/learning',
  moduleBasePath: '/modules',
  passMarkPercent: 75,
  showResources: true,
  supportsDemoViewer: false,
  hasScatModules: true,
  showCertificateCta: true,
  headerModuleNumber: 'data',
  scatQuizFailUpsellSuffix: '8 modules · 8 CPD hours online (up to 14 with the in-person day)',
}

export default function ModulePage() {
  return <CourseModulePage descriptor={FLAGSHIP_COURSE} />
}
