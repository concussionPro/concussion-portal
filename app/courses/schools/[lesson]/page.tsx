import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { SCHOOLS_COURSE } from '@/data/schools-course'
import { ArrowLeft, ArrowRight, AlertTriangle, KeyRound } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Recognise & Remove — lesson reader.
//
// The landing page has always linked `/courses/schools/lesson-N` for all six
// lessons, but no route existed — every card 404'd (2026-08-05 live link
// crawl). The teaching content was already written in data/schools-course.ts;
// this renders it. The segment is `[lesson]` (App Router has no partial
// dynamic segments) and parses the existing `lesson-N` URL shape, so the
// landing page's links are unchanged. Review-only / noindex, matching the
// landing page's scope.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Lesson — Recognise & Remove | Concussion Education Australia',
  robots: 'noindex, nofollow',
}

export function generateStaticParams() {
  return SCHOOLS_COURSE.lessons.map((l) => ({ lesson: `lesson-${l.id}` }))
}

export default async function SchoolsLessonPage({
  params,
}: {
  params: Promise<{ lesson: string }>
}) {
  const { lesson: slug } = await params
  const match = /^lesson-(\d+)$/.exec(slug)
  if (!match) notFound()
  const lessonId = Number(match[1])
  const lesson = SCHOOLS_COURSE.lessons.find((l) => l.id === lessonId)
  if (!lesson) notFound()

  const idx = SCHOOLS_COURSE.lessons.findIndex((l) => l.id === lessonId)
  const prev = SCHOOLS_COURSE.lessons[idx - 1]
  const next = SCHOOLS_COURSE.lessons[idx + 1]

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main>
        <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-20">
          <Link
            href="/courses/schools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {SCHOOLS_COURSE.title}
          </Link>

          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-2">
            Lesson {lesson.id} of {SCHOOLS_COURSE.lessons.length}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-6">{lesson.title}</h1>

          <div className="space-y-4">
            {lesson.body.map((para, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-slate-700">
                {para}
              </p>
            ))}
          </div>

          {lesson.callout && (
            <div
              className={`mt-8 rounded-xl border p-5 ${
                lesson.callout.tone === 'warn'
                  ? 'border-red-200 bg-red-50'
                  : 'border-accent/30 bg-accent/5'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {lesson.callout.tone === 'warn' ? (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
                ) : (
                  <KeyRound className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                )}
                <h2
                  className={`text-sm font-bold ${
                    lesson.callout.tone === 'warn' ? 'text-red-800' : 'text-foreground'
                  }`}
                >
                  {lesson.callout.title}
                </h2>
              </div>
              <ul className="space-y-1.5">
                {lesson.callout.items.map((item, i) => (
                  <li
                    key={i}
                    className={`text-sm leading-relaxed ${
                      lesson.callout!.tone === 'warn' ? 'text-red-900' : 'text-slate-700'
                    }`}
                  >
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-8 text-xs leading-relaxed text-muted-foreground">{SCHOOLS_COURSE.scopeNote}</p>

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-slate-200 pt-6">
            {prev ? (
              <Link
                href={`/courses/schools/lesson-${prev.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Lesson {prev.id}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/courses/schools/lesson-${next.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white hover:bg-accent/90"
              >
                Lesson {next.id}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/courses/schools"
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white hover:bg-accent/90"
              >
                Back to course overview
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
