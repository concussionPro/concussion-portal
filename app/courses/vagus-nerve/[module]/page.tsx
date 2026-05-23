import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { findVagusModule, loadVagusModuleContent, VAGUS_MODULES } from '@/lib/vagus-course/content'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { VagusCourseSidebar } from '@/components/ai-course/VagusCourseSidebar'
import { ModuleViewer } from '@/components/ai-course/ModuleViewer'
import { parseModuleSections } from '@/lib/ai-course/module-sections'

interface PageParams {
  params: Promise<{ module: string }>
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { module } = await params
  const m = findVagusModule(module)
  return {
    title: m ? `${m.title} — Vagus Nerve` : 'Module',
    robots: 'noindex, nofollow',
  }
}

export default async function VagusModulePage({ params }: PageParams) {
  const access = await requireAiCourseAccess()
  const { module } = await params
  const meta = findVagusModule(module)
  if (!meta) notFound()

  let content: string
  try {
    content = await loadVagusModuleContent(module)
  } catch {
    content = `## Coming soon\n\n_Content not yet available._`
  }
  const { header, sections } = parseModuleSections(module, content)

  const idx = VAGUS_MODULES.findIndex((m) => m.slug === module)
  const prev = idx > 0 ? VAGUS_MODULES[idx - 1] : null
  const next = idx < VAGUS_MODULES.length - 1 ? VAGUS_MODULES[idx + 1] : null

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <VagusCourseSidebar />
      <main className="md:pl-72">
        <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-20">
          <AdminPreviewBadge access={access} />

          <Link
            href="/courses/vagus-nerve"
            className="text-xs text-accent hover:underline mb-4 inline-block"
          >
            ← All modules
          </Link>

          <div className="mb-2 flex items-center gap-2 flex-wrap">
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
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{meta.title}</h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{meta.description}</p>

          <ModuleViewer header={header} sections={sections} />

          {/* Prev/Next nav */}
          <div className="mt-12 grid grid-cols-2 gap-3">
            {prev ? (
              <Link
                href={`/courses/vagus-nerve/${prev.slug}`}
                className="card rounded-xl p-4 hover:border-accent/40 transition-colors"
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">← Previous</p>
                <p className="text-sm font-semibold text-foreground">Module {prev.number}: {prev.title}</p>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={`/courses/vagus-nerve/${next.slug}`}
                className="card rounded-xl p-4 hover:border-accent/40 transition-colors text-right"
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Next →</p>
                <p className="text-sm font-semibold text-foreground">Module {next.number}: {next.title}</p>
              </Link>
            ) : (
              <Link
                href="/courses/vagus-nerve/quiz"
                className="card rounded-xl p-4 hover:border-accent/40 transition-colors text-right border-accent/40"
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-accent mb-1">Ready?</p>
                <p className="text-sm font-semibold text-foreground">Take the certification quiz →</p>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
