/**
 * THE VIDEO INDEX — every moving asset in both courses, in one place.
 *
 * WHY THIS EXISTS. The most common criticism of the courses from the Embodia
 * side is "too much text, not enough video, not engaging enough". A large part
 * of that is not the amount of video — CCM already carries 23 embeds and CRM 10
 * — it is that video is INVISIBLE until you scroll into it. A learner opening a
 * module sees 11,000 words and no indication that anything moves.
 *
 * A browsable index changes the first impression of the course without changing
 * a word of its content, and gives someone revisiting a concept a way back to it
 * that isn't scrolling.
 *
 * IT IS DERIVED, NEVER HAND-MAINTAINED. The entries are parsed from the same
 * `[VIDEO: id | title]` and `[INFOGRAPHIC: id]` markers the modules already
 * render, so the index cannot drift from the course. Adding a video to a module
 * adds it here; there is no second list to forget.
 */

export type CourseStream = 'ccm' | 'crm'

export interface VideoIndexEntry {
  stream: CourseStream
  moduleId: number
  moduleTitle: string
  /** 'video' = embedded footage; 'animation' = an animated infographic. */
  kind: 'video' | 'animation'
  /** YouTube id for footage, infographic id for animations. */
  ref: string
  title: string
}

/**
 * Infographic ids backed by an ANIMATED component rather than a static image.
 * Mirrors the ANIMATED map in components/course/ep-infographics/index.tsx.
 *
 * Kept as a plain list rather than imported from that module on purpose: this
 * file is consumed by a server route, and the registry pulls in React
 * components. A test asserts the two stay in step, so the duplication cannot
 * rot silently.
 */
export const ANIMATED_INFOGRAPHIC_IDS: readonly string[] = ['hrt-to-prescription']

/** Is there enough moving content to show the index at all? */
export const VIDEO_INDEX_MIN_ENTRIES = 1

export function isAnimated(id: string): boolean {
  return ANIMATED_INFOGRAPHIC_IDS.includes(id)
}

const VIDEO_RE = /\[VIDEO:\s*([^\]|]+?)\s*\|\s*([^\]]+?)\s*\]/g
const INFOGRAPHIC_RE = /\[INFOGRAPHIC:\s*([a-z0-9-]+)\s*\]/g

/**
 * Extract every moving asset from one module's raw content.
 *
 * De-duplicated per module: the same clip is sometimes placed in two sections of
 * one module, and listing it twice in an index reads as a bug rather than as
 * emphasis.
 */
export function extractModuleVideos(
  raw: string,
  stream: CourseStream,
  moduleId: number,
  moduleTitle: string,
  infographicTitles: Record<string, string> = {},
): VideoIndexEntry[] {
  const out: VideoIndexEntry[] = []
  const seen = new Set<string>()

  for (const m of raw.matchAll(VIDEO_RE)) {
    const ref = m[1].trim()
    if (seen.has(`v:${ref}`)) continue
    seen.add(`v:${ref}`)
    out.push({ stream, moduleId, moduleTitle, kind: 'video', ref, title: m[2].trim() })
  }

  for (const m of raw.matchAll(INFOGRAPHIC_RE)) {
    const ref = m[1].trim()
    // Only ANIMATED infographics belong in a video index. Listing static
    // diagrams here would pad the count and immediately break the promise the
    // page makes — which is the specific complaint it exists to answer.
    if (!isAnimated(ref)) continue
    if (seen.has(`i:${ref}`)) continue
    seen.add(`i:${ref}`)
    out.push({
      stream,
      moduleId,
      moduleTitle,
      kind: 'animation',
      ref,
      title: infographicTitles[ref] ?? ref.replace(/-/g, ' '),
    })
  }

  return out
}

/** Group a flat list into module order for rendering. */
export function groupByModule(entries: VideoIndexEntry[]) {
  const map = new Map<number, { moduleId: number; moduleTitle: string; items: VideoIndexEntry[] }>()
  for (const e of entries) {
    const g = map.get(e.moduleId) ?? { moduleId: e.moduleId, moduleTitle: e.moduleTitle, items: [] }
    g.items.push(e)
    map.set(e.moduleId, g)
  }
  return [...map.values()].sort((a, b) => a.moduleId - b.moduleId)
}

/** Deep link to the module a given asset sits in. */
export function moduleHref(stream: CourseStream, moduleId: number): string {
  return stream === 'crm' ? `/ep-course/modules/${moduleId}` : `/modules/${moduleId}`
}
