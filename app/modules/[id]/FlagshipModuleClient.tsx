'use client'

import { CourseNavigation } from '@/components/course/CourseNavigation'
import { CourseModulePage, type CourseModuleDescriptor } from '@/components/course/CourseModulePage'
import type { InitialModuleData } from '@/hooks/useModuleData'

/**
 * Flagship learning-suite course: paid modules 1-8 plus the free SCAT
 * modules 101-103. All behaviour lives in the shared CourseModulePage —
 * this descriptor is the complete list of flagship-specific behaviour.
 */
const FLAGSHIP_COURSE: CourseModuleDescriptor = {
  course: 'flagship',
  NavComponent: CourseNavigation,
  // No InteractiveComponent: all 152 flagship interactives are authored as
  // DATA (data/module-interactives.ts -> Section.interactives) and render via
  // SectionDataInteractives from the entitlement-gated module payload. They
  // used to be hardcoded JSX imported here, which shipped every answer key and
  // every scenario's clinical reasoning in a PUBLIC client chunk.
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
  scatQuizFailUpsellSuffix: '8 modules · 8 CPD hours online (up to 16 with the in-person day)',
}

export default function FlagshipModuleClient({
  initialModuleData,
  initialAuth,
}: {
  initialModuleData?: InitialModuleData
  initialAuth?: { authenticated: boolean; email: string; isDemo: boolean }
}) {
  return (
    <CourseModulePage
      descriptor={FLAGSHIP_COURSE}
      initialModuleData={initialModuleData}
      initialAuth={initialAuth}
    />
  )
}
