import type { ComponentType } from 'react'
import { ImageInfographic, INFOGRAPHIC_CONFIG } from './ImageInfographic'

/**
 * Registry of EP-course infographics keyed by the id used in the
 * `[INFOGRAPHIC: <id>]` content marker. Every infographic is now image-backed —
 * `getEpInfographic(id)` returns a component that renders the matching image
 * (with graceful PNG → SVG → placeholder fallback) when the id is configured in
 * INFOGRAPHIC_CONFIG, and null otherwise so a stray/typo marker never leaks raw
 * "[INFOGRAPHIC: …]" text to the page.
 */
export function getEpInfographic(id: string): ComponentType | null {
  if (!(id in INFOGRAPHIC_CONFIG)) return null
  return function EpInfographic() {
    return <ImageInfographic id={id} />
  }
}
