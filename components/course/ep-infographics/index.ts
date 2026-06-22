import type { ComponentType } from 'react'
import { NeurometabolicCascade } from './NeurometabolicCascade'
import { BcttProtocol } from './BcttProtocol'
import { HrtToPrescription } from './HrtToPrescription'
import { GradedReturnToSport } from './GradedReturnToSport'
import { PhenotypeMap } from './PhenotypeMap'
import { BrainRegions } from './BrainRegions'
import { ConcussionSymptomClusters } from './ConcussionSymptomClusters'
import { CbfAutoregulation } from './CbfAutoregulation'
import { AutonomicDysfunction } from './AutonomicDysfunction'

/**
 * Registry of EP-course infographics keyed by the id used in the
 * `[INFOGRAPHIC: <id>]` content marker. DynamicContentRenderer looks up the id
 * here; an unknown id resolves to undefined and renders nothing (no raw marker
 * text ever leaks to the page).
 */
export const EP_INFOGRAPHICS: Record<string, ComponentType> = {
  'neurometabolic-cascade': NeurometabolicCascade,
  'bctt-protocol': BcttProtocol,
  'hrt-to-prescription': HrtToPrescription,
  'graded-return-to-sport': GradedReturnToSport,
  'phenotype-map': PhenotypeMap,
  'brain-regions': BrainRegions,
  'concussion-symptom-clusters': ConcussionSymptomClusters,
  'cbf-autoregulation': CbfAutoregulation,
  'autonomic-dysfunction': AutonomicDysfunction,
}

export function getEpInfographic(id: string): ComponentType | undefined {
  return EP_INFOGRAPHICS[id]
}
