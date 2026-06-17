import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { EP_MODULES, findEpModule, epSlug, EP_COURSE } from '@/lib/ep-course/content'
import { EpModuleView } from '@/components/ep-course/EpModuleView'
import Link from 'next/link'

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
  const m = findEpModule(module)
  if (!m) notFound()

  const idx = EP_MODULES.findIndex((x) => x.id === m.id)
  const prev = idx > 0 ? EP_MODULES[idx - 1] : null
  const next = idx < EP_MODULES.length - 1 ? EP_MODULES[idx + 1] : null

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-3xl px-6 py-12">
        <AdminPreviewBadge access={access} />
        <Link href={EP_COURSE.basePath} className="text-sm font-semibold text-teal-700 hover:underline">
          ← {EP_COURSE.title}
        </Link>
        <div className="mt-6">
          <EpModuleView
            module={m}
            prevHref={prev ? `${EP_COURSE.basePath}/${epSlug(prev.id)}` : null}
            nextHref={next ? `${EP_COURSE.basePath}/${epSlug(next.id)}` : null}
          />
        </div>
      </main>
    </div>
  )
}
