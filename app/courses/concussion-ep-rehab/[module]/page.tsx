import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { EpCourseSidebar } from '@/components/ep-course/EpCourseSidebar'
import { ModuleViewer } from '@/components/ai-course/ModuleViewer'
import { parseModuleSections } from '@/lib/ai-course/module-sections'
import { EP_MODULES, findEpModule, loadEpModuleContent } from '@/lib/ep-course/content'

interface PageParams {
  params: Promise<{ module: string }>
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { module } = await params
  const m = findEpModule(module)
  return {
    title: m ? `${m.title} — Concussion Rehab for EPs` : 'Module',
    robots: 'noindex, nofollow',
  }
}

export default async function EpModulePage({ params }: PageParams) {
  const access = await requireAiCourseAccess('/login')
  const { module } = await params
  const meta = findEpModule(module)
  if (!meta) notFound()

  let content: string
  try {
    content = await loadEpModuleContent(module)
  } catch {
    content = `# ${meta.title}\n\n---\n\n_Content coming soon._`
  }
  const { header, sections } = parseModuleSections(module, content)

  const idx = EP_MODULES.findIndex((m) => m.slug === module)
  const prev = idx > 0 ? EP_MODULES[idx - 1] : null
  const next = idx < EP_MODULES.length - 1 ? EP_MODULES[idx + 1] : null
  const base = '/courses/concussion-ep-rehab'

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <EpCourseSidebar />
      <main className="md:pl-72">
        <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-20">
          <AdminPreviewBadge access={access} />
          <Link href={base} className="text-sm font-semibold text-accent hover:underline">
            ← Curriculum
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-accent">
            Module {meta.number} · {meta.durationMin} min
          </p>

          <ModuleViewer header={header} sections={sections} />

          <nav className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6">
            {prev ? (
              <Link href={`${base}/${prev.slug}`} className="text-sm font-semibold text-accent hover:underline">
                ← {prev.title}
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`${base}/${next.slug}`} className="text-sm font-semibold text-accent hover:underline">
                {next.title} →
              </Link>
            ) : <span />}
          </nav>
        </div>
      </main>
    </div>
  )
}
