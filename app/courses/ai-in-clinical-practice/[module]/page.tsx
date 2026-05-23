import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { findModule, loadModuleContent, MODULES } from '@/lib/ai-course/content'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { CourseSidebar } from '@/components/ai-course/CourseSidebar'
import { ModuleViewer } from '@/components/ai-course/ModuleViewer'
import { parseModuleSections } from '@/lib/ai-course/module-sections'

interface PageParams {
  params: Promise<{ module: string }>
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { module } = await params
  const m = findModule(module)
  return {
    title: m ? `${m.title} — AI in Clinical Practice` : 'Module',
    robots: 'noindex, nofollow',
  }
}

export default async function ModulePage({ params }: PageParams) {
  const access = await requireAiCourseAccess()
  const { module } = await params
  const meta = findModule(module)
  if (!meta) notFound()

  let content: string
  try {
    content = await loadModuleContent(module)
  } catch {
    content = `## Coming soon\n\n_Content not yet available._`
  }
  const { header, sections } = parseModuleSections(module, content)

  // Find prev/next for navigation
  const idx = MODULES.findIndex((m) => m.slug === module)
  const prev = idx > 0 ? MODULES[idx - 1] : null
  const next = idx < MODULES.length - 1 ? MODULES[idx + 1] : null

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <CourseSidebar />
      <main className="md:pl-72">
      <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />

        <Link
          href="/courses/ai-in-clinical-practice"
          className="text-xs text-accent hover:underline mb-4 inline-block"
        >
          ← All modules
        </Link>

        <div className="mb-2 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
            Module {meta.number}
          </span>
          <span className="text-[10px] text-muted-foreground">{meta.durationMin} min</span>
          {meta.loadBearing && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              Required reading
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-8">{meta.title}</h1>

        <ModuleViewer header={header} sections={sections} />

        <hr className="my-12 border-slate-200" />

        <div className="flex items-center justify-between">
          {prev ? (
            <Link
              href={`/courses/ai-in-clinical-practice/${prev.slug}`}
              className="text-sm text-accent hover:underline"
            >
              ← {prev.title}
            </Link>
          ) : <span />}
          {next ? (
            <Link
              href={`/courses/ai-in-clinical-practice/${next.slug}`}
              className="text-sm font-semibold text-accent hover:underline"
            >
              {next.title} →
            </Link>
          ) : (
            <Link
              href="/courses/ai-in-clinical-practice/quiz"
              className="text-sm font-semibold text-accent hover:underline"
            >
              Take the quiz →
            </Link>
          )}
        </div>
      </div>
      </main>
    </div>
  )
}
