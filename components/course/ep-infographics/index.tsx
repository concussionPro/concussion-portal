import type { ComponentType } from 'react'
import { ImageInfographic, INFOGRAPHIC_CONFIG } from './ImageInfographic'
import { HrtToPrescriptionAnimated } from './HrtToPrescriptionAnimated'

/**
 * Registry of EP-course infographics keyed by the id used in the
 * `[INFOGRAPHIC: <id>]` content marker.
 *
 * TWO BACKINGS, and the split is deliberate.
 *
 * Most ids render a static image via ImageInfographic (PNG → SVG → placeholder
 * fallback). A small number render an ANIMATED component instead, and those are
 * chosen on one criterion: whether the thing being taught is a SEQUENCE. A
 * picture can show a finished chart; it cannot show that the training band does
 * not exist until the symptom threshold fires. Where the order of events IS the
 * teaching point, motion earns its place. Where it isn't, a static diagram is
 * faster to load and just as good.
 *
 * ANIMATED wins over the image for the same id, so upgrading an infographic is
 * one line here and needs no change to any course content — the marker in the
 * module data stays exactly as it is, and every existing placement of that id
 * upgrades at once.
 *
 * Falling back is safe in both directions: an id with no animated component
 * renders its image, and an unknown id returns null so a stray or typo'd marker
 * never leaks raw "[INFOGRAPHIC: …]" text onto the page.
 */
const ANIMATED: Record<string, ComponentType> = {
  'hrt-to-prescription': HrtToPrescriptionAnimated,
}

export function getEpInfographic(id: string): ComponentType | null {
  const animated = ANIMATED[id]
  if (animated) return animated
  if (!(id in INFOGRAPHIC_CONFIG)) return null
  return function EpInfographic() {
    return <ImageInfographic id={id} />
  }
}
