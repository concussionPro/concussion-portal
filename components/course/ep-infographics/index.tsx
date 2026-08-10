import type { ComponentType } from 'react'
import { ImageInfographic, INFOGRAPHIC_CONFIG } from './ImageInfographic'
import { HrtToPrescriptionAnimated } from './HrtToPrescriptionAnimated'
import { AutonomicDysfunctionAnimated } from './AutonomicDysfunctionAnimated'
import { NeurometabolicCascadeAnimated } from './NeurometabolicCascadeAnimated'
import { CbfAutoregulationAnimated } from './CbfAutoregulationAnimated'
import { GradedReturnToSportAnimated } from './GradedReturnToSportAnimated'
import { SstaeMechanismAnimated } from './SstaeMechanismAnimated'
import { RedFlagDecisionAnimated } from './RedFlagDecisionAnimated'
import { PhenotypeMapAnimated } from './PhenotypeMapAnimated'
import { FittFrameworkAnimated } from './FittFrameworkAnimated'
import { LoadMonitoringAnimated } from './LoadMonitoringAnimated'
import { RecoveryTimelineAnimated } from './RecoveryTimelineAnimated'

/**
 * Registry of EP-course infographics keyed by the id used in the
 * `[INFOGRAPHIC: <id>]` content marker.
 *
 * TWO BACKINGS. Most ids render a static image via ImageInfographic (PNG → SVG
 * → placeholder fallback). The ids below render an ANIMATED component instead,
 * chosen on one criterion: whether the thing being taught is a SEQUENCE, a
 * RELATIONSHIP or a JUDGEMENT. A picture can show a finished chart; it cannot
 * show that the training band does not exist until the threshold fires, that
 * flow stops being protected when autoregulation fails, or what you do when a
 * week's trace looks fine and load has collapsed.
 *
 * ANIMATED wins over the image for the same id, so this map is the ONLY place
 * an upgrade happens — no course content is edited, the markers in the module
 * data stay exactly as they are, and every existing placement of that id
 * upgrades at once. Reverting any one is deleting a line.
 *
 * Both courses share these ids, so registering here lights them up across CCM
 * and CRM together — 26 placements from 11 entries.
 *
 * Falling back is safe in both directions: an id with no animated component
 * renders its image, and an unknown id returns null so a stray or typo'd marker
 * never leaks raw "[INFOGRAPHIC: …]" text onto the page.
 */
const ANIMATED: Record<string, ComponentType> = {
  'hrt-to-prescription': HrtToPrescriptionAnimated,
  'autonomic-dysfunction': AutonomicDysfunctionAnimated,
  'neurometabolic-cascade': NeurometabolicCascadeAnimated,
  'cbf-autoregulation': CbfAutoregulationAnimated,
  'graded-return-to-sport': GradedReturnToSportAnimated,
  'sstae-mechanism': SstaeMechanismAnimated,
  'red-flag-decision': RedFlagDecisionAnimated,
  'phenotype-map': PhenotypeMapAnimated,
  'fitt-framework': FittFrameworkAnimated,
  'load-monitoring': LoadMonitoringAnimated,
  'recovery-timeline': RecoveryTimelineAnimated,
}

export function getEpInfographic(id: string): ComponentType | null {
  const animated = ANIMATED[id]
  if (animated) return animated
  if (!(id in INFOGRAPHIC_CONFIG)) return null
  return function EpInfographic() {
    return <ImageInfographic id={id} />
  }
}
