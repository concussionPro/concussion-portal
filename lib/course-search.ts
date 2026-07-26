/**
 * Cross-course search — modules, sections and clinical references.
 *
 * The portal held 16 paid modules, a free 3-module course and 140+ references,
 * with no way to find anything across them. That is the feature the "come back
 * to this between patients" retention story depends on, and it was missing:
 * the reference repository had a local filter, and nothing else did.
 *
 * Built server-side over the existing content (no index to maintain, no build
 * step). The corpus is a few hundred KB of strings — a scan is well under the
 * latency budget and cannot go stale against the content it searches.
 *
 * ENTITLEMENT IS THE CALLER'S JOB: this returns matches from whatever corpus it
 * is handed. The route decides which corpus a given user may search, so search
 * can never become a side channel around the paywall.
 *
 * SERVER-ONLY — imports full course content.
 */
import { getAllModules } from '@/data/modules'
import { getSCATModules } from '@/data/scat-modules'
import { getEpModules, epDisplayId } from '@/data/ep-modules'

export type SearchCourse = 'ccm' | 'crm' | 'scat'

export interface SearchHit {
  course: SearchCourse
  courseLabel: string
  moduleId: number
  moduleTitle: string
  sectionId: string | null
  sectionTitle: string | null
  /** 'section' = module prose, 'reference' = a citation from the module. */
  kind: 'section' | 'reference'
  /** Matching text with surrounding context, markers stripped. */
  snippet: string
  href: string
  score: number
}

const COURSE_LABEL: Record<SearchCourse, string> = {
  ccm: 'Clinical Mastery',
  crm: 'Rehab Mastery (EP)',
  scat: 'SCAT6 Mastery (free)',
}

/** Strip the content DSL so a snippet reads as prose, not markup. */
function plain(line: string): string {
  return line
    .replace(/\[(?:CALLOUT|QUOTE):\s*[^|\]]*\|\s*/g, '')
    .replace(/\[(?:INFOGRAPHIC|VIDEO|HIGHLIGHT|POLL|REVEAL)[^\]]*\]/g, '')
    .replace(/[[\]]/g, '')
    .replace(/^#+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Context window around the first match, trimmed to word boundaries. */
function snippetAround(text: string, needle: string, width = 180): string {
  const i = text.toLowerCase().indexOf(needle)
  if (i < 0) return text.slice(0, width)
  const start = Math.max(0, i - Math.floor(width / 3))
  const end = Math.min(text.length, start + width)
  return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '')
}

interface Corpus {
  course: SearchCourse
  modules: Array<{
    id: number
    title: string
    sections: Array<{ id: string; title: string; content: string[] }>
    clinicalReferences?: string[]
  }>
  /** Module URL builder for this course. */
  href: (moduleId: number) => string
}

/** Which corpora a viewer may search, given what they own. */
export function corporaFor(opts: { ccm: boolean; crm: boolean }): Corpus[] {
  const out: Corpus[] = [
    // The free SCAT course is open to every signed-in user.
    { course: 'scat', modules: getSCATModules() as never, href: (id) => `/modules/${id}` },
  ]
  if (opts.ccm) out.push({ course: 'ccm', modules: getAllModules() as never, href: (id) => `/modules/${id}` })
  if (opts.crm) {
    out.push({
      course: 'crm',
      modules: getEpModules() as never,
      href: (id) => `/ep-course/modules/${epDisplayId(id)}`,
    })
  }
  return out
}

/**
 * Search the supplied corpora. Ranking is deliberately simple and explainable:
 * a title match outranks a body match, and earlier modules break ties, so the
 * ordering is stable and a clinician can predict it.
 */
export function searchCourses(corpora: Corpus[], rawQuery: string, limit = 40): SearchHit[] {
  const q = rawQuery.trim().toLowerCase()
  if (q.length < 2) return []
  const hits: SearchHit[] = []

  for (const corpus of corpora) {
    for (const m of corpus.modules) {
      const moduleHref = corpus.href(m.id)
      const displayId = corpus.course === 'crm' ? epDisplayId(m.id) : m.id

      for (const s of m.sections) {
        const title = s.title || ''
        const bodyText = plain(s.content.join(' '))
        const inTitle = title.toLowerCase().includes(q)
        const inBody = bodyText.toLowerCase().includes(q)
        if (!inTitle && !inBody) continue
        hits.push({
          course: corpus.course,
          courseLabel: COURSE_LABEL[corpus.course],
          moduleId: displayId,
          moduleTitle: m.title,
          sectionId: s.id,
          sectionTitle: title,
          kind: 'section',
          snippet: inBody ? snippetAround(bodyText, q) : bodyText.slice(0, 180),
          href: `${moduleHref}#${encodeURIComponent(s.id)}`,
          score: (inTitle ? 100 : 0) + (inBody ? 10 : 0) - displayId,
        })
      }

      for (const ref of m.clinicalReferences ?? []) {
        if (!ref.toLowerCase().includes(q)) continue
        hits.push({
          course: corpus.course,
          courseLabel: COURSE_LABEL[corpus.course],
          moduleId: displayId,
          moduleTitle: m.title,
          sectionId: null,
          sectionTitle: null,
          kind: 'reference',
          snippet: snippetAround(ref, q, 220),
          href: moduleHref,
          score: 5 - displayId,
        })
      }
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}
