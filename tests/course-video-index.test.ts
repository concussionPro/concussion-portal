import { describe, it, expect } from 'vitest'
import {
  extractModuleVideos, groupByModule, isAnimated, moduleHref,
  ANIMATED_INFOGRAPHIC_IDS,
} from '../lib/course-video-index'
import { readFileSync } from 'node:fs'

describe('the video index is derived from the course, not maintained beside it', () => {
  it('pulls embedded footage with its title', () => {
    const out = extractModuleVideos(
      'text [VIDEO: abc123 | 2-Minute Neuroscience] more text', 'crm', 4, 'SSTAE',
    )
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ kind: 'video', ref: 'abc123', title: '2-Minute Neuroscience' })
  })

  it('includes ANIMATED infographics but never static ones', () => {
    const out = extractModuleVideos(
      '[INFOGRAPHIC: hrt-to-prescription] and [INFOGRAPHIC: brain-regions]', 'crm', 4, 'SSTAE',
    )
    // Listing static diagrams would pad the count and break the page's promise —
    // which is the exact complaint the index exists to answer.
    expect(out.map((e) => e.ref)).toEqual(['hrt-to-prescription'])
  })

  it('de-duplicates a clip placed twice in one module', () => {
    const out = extractModuleVideos(
      '[VIDEO: x | A] ... [VIDEO: x | A]', 'ccm', 1, 'M1',
    )
    expect(out).toHaveLength(1)
  })

  it('links each entry back to the module it sits in', () => {
    expect(moduleHref('crm', 4)).toBe('/ep-course/modules/4')
    expect(moduleHref('ccm', 4)).toBe('/modules/4')
  })

  it('groups in module order', () => {
    const g = groupByModule([
      { stream: 'crm', moduleId: 7, moduleTitle: 'B', kind: 'video', ref: 'b', title: 'B' },
      { stream: 'crm', moduleId: 2, moduleTitle: 'A', kind: 'video', ref: 'a', title: 'A' },
    ])
    expect(g.map((x) => x.moduleId)).toEqual([2, 7])
  })
})

describe('the animated list cannot drift from the registry', () => {
  it('every id here has an entry in the ANIMATED map', () => {
    // lib/course-video-index is consumed server-side and must not import React
    // components, so the id list is duplicated. This is what stops it rotting.
    const registry = readFileSync(
      new URL('../components/course/ep-infographics/index.tsx', import.meta.url), 'utf8',
    )
    for (const id of ANIMATED_INFOGRAPHIC_IDS) {
      expect(registry, `'${id}' is listed as animated but has no ANIMATED registry entry`)
        .toContain(`'${id}':`)
      expect(isAnimated(id)).toBe(true)
    }
  })

  it('and every registry entry is listed here', () => {
    const registry = readFileSync(
      new URL('../components/course/ep-infographics/index.tsx', import.meta.url), 'utf8',
    )
    const block = registry.slice(registry.indexOf('const ANIMATED'), registry.indexOf('export function getEpInfographic'))
    for (const m of block.matchAll(/'([a-z0-9-]+)':/g)) {
      expect(ANIMATED_INFOGRAPHIC_IDS, `registry has '${m[1]}' but the video index does not`)
        .toContain(m[1])
    }
  })
})
