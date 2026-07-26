import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Lock, Clock, BookOpen } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { PreviewSectionContent } from '@/components/course/PreviewSectionContent'
import { getPreviewContent, previewCourseFromParam, type PreviewCourse } from '@/lib/preview-content'
import { CONFIG } from '@/lib/config'

/**
 * /preview/[module] — one indexable page per module of the public trial.
 *
 * WHY SEPARATE URLS: the trial's unlocked sections are real clinical writing
 * that is already public, but they all lived on a single /preview page. One URL
 * can rank for one intent; sixteen can rank for sixteen. Splitting them costs
 * no new content and turns the trial from a single sales page into the top of
 * the SEO/GEO funnel — which is the join between the traffic engine and the
 * learning portal.
 *
 * THE UNLOCK IS UNCHANGED. These pages render exactly what getPreviewContent()
 * already returns (Module 1: 3 sections, every other module: 1) — the same
 * ceiling the /preview page and the API use, asserted in tests/module-access.
 * This adds URLs, never content.
 *
 * ?course=crm serves the EP stream module of the same number.
 */
const COURSE_META: Record<PreviewCourse, { label: string; enrolHref: string; enrolLabel: string }> = {
  ccm: { label: 'Concussion Clinical Mastery', enrolHref: '/pricing', enrolLabel: 'See pricing & enrol' },
  crm: { label: 'Concussion Rehab Mastery', enrolHref: '/concussion-rehab-mastery', enrolLabel: 'See the EP course' },
}

type Params = { module: string }
type Search = { course?: string }

function resolve(moduleParam: string, courseParam?: string) {
  const course = previewCourseFromParam(courseParam)
  const id = Number(moduleParam)
  if (!Number.isInteger(id) || id < 1 || id > 8) return null
  const data = getPreviewContent(course).find((m) => m.id === id)
  return data ? { course, data } : null
}

export function generateStaticParams(): Params[] {
  return Array.from({ length: 8 }, (_, i) => ({ module: String(i + 1) }))
}

/**
 * Only the eight generated modules are valid routes — anything else 404s at the
 * ROUTING layer rather than relying on notFound() inside the component. Both
 * courses have exactly 8 modules, so there is no case this wrongly excludes,
 * and it stops /preview/99 rendering a soft-404 that a crawler could index.
 */
export const dynamicParams = false

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<Search>
}): Promise<Metadata> {
  const { module: m } = await params
  const { course: c } = await searchParams
  const hit = resolve(m, c)
  if (!hit) return { title: 'Module preview', robots: 'noindex, nofollow' }
  const { course, data } = hit
  const meta = COURSE_META[course]
  return {
    title: `${data.title} — Module ${data.id} preview | ${meta.label}`,
    description: `${data.description} Read the opening of Module ${data.id} free — no signup.`,
    // Only the flagship variant is canonical; ?course=crm points back at it so
    // the two streams can't compete for the same query.
    alternates: { canonical: `/preview/${data.id}` },
    robots: course === 'ccm' ? 'index, follow' : 'noindex, follow',
  }
}

export default async function PreviewModulePage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<Search>
}) {
  const { module: m } = await params
  const { course: c } = await searchParams
  const hit = resolve(m, c)
  if (!hit) notFound()
  const { course, data } = hit
  const meta = COURSE_META[course]
  const suffix = course === 'crm' ? '?course=crm' : ''
  const locked = data.sectionTitles.slice(data.previewSections.length)

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-6 pb-20 pt-[120px]">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-500">
          <Link href={`/preview${suffix}`} className="hover:text-accent">
            Course preview
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-700">Module {data.id}</span>
        </nav>

        <header className="mb-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
            {meta.label} · Module {data.id} of 8
          </p>
          <h1 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
            {data.title}
          </h1>
          <p className="mb-4 text-lg leading-relaxed text-slate-600">{data.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {data.duration}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> {data.totalSections} sections
            </span>
          </div>
        </header>

        <div className="space-y-6">
          {data.previewSections.map((section, i) => (
            <PreviewSectionContent
              key={section.id}
              moduleId={data.id}
              section={section}
              sectionNumber={i + 1}
            />
          ))}
        </div>

        {locked.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
              <p className="m-0 inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Lock className="h-4 w-4" />
                {locked.length} more section{locked.length === 1 ? '' : 's'} in this module
              </p>
            </div>
            <ul className="m-0 list-none space-y-1.5 p-4">
              {locked.map((title) => (
                <li key={title} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 opacity-70">
                  <Lock className="h-3 w-3 shrink-0 text-slate-400" />
                  <span className="truncate text-sm text-slate-500">{title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 rounded-2xl border-2 border-accent/25 bg-white p-6 text-center">
          <p className="m-0 text-lg font-bold text-slate-900">Read the rest of this module</p>
          <p className="mx-auto mt-1.5 mb-4 max-w-md text-sm leading-relaxed text-slate-600">
            {course === 'ccm'
              ? `8 modules · ${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours online (up to ${CONFIG.COURSE.TOTAL_CPD_POINTS} with the practical day) · endorsed by Osteopathy Australia.`
              : `8 modules · ${CONFIG.COURSE.ONLINE_CPD_POINTS} ESSA CPD points · scoped for Accredited Exercise Physiologists.`}
          </p>
          <Link
            href={meta.enrolHref}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-dark"
          >
            {meta.enrolLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <nav className="mt-8 flex items-center justify-between gap-3 text-sm" aria-label="Module navigation">
          {data.id > 1 ? (
            <Link href={`/preview/${data.id - 1}${suffix}`} className="font-semibold text-accent hover:underline">
              ← Module {data.id - 1}
            </Link>
          ) : (
            <span />
          )}
          {data.id < 8 && (
            <Link href={`/preview/${data.id + 1}${suffix}`} className="font-semibold text-accent hover:underline">
              Module {data.id + 1} →
            </Link>
          )}
        </nav>
      </div>
    </div>
  )
}
