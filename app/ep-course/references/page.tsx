import { Metadata } from 'next'
import Link from 'next/link'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { EpCourseNavigation } from '@/components/ep-course/EpCourseNavigation'
import { epModules } from '@/data/ep-modules'

export const metadata: Metadata = {
  title: 'Reference Repository — Concussion Rehab for EPs',
  robots: 'noindex, nofollow',
}

export default async function EpReferencesPage() {
  const access = await requireAiCourseAccess('/login')
  const total = epModules.reduce((s, m) => s + (m.clinicalReferences?.length ?? 0), 0)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <EpCourseNavigation />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <AdminPreviewBadge access={access} />
          <Link href="/ep-course/modules/1" className="text-sm font-semibold text-teal-700 hover:underline">
            ← Course
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Reference Repository</h1>
          <p className="mt-2 text-slate-600">
            {total} peer-reviewed references underpinning the course content, grouped by module — the evidence base
            an Accredited Exercise Physiologist can cite for concussion exercise rehabilitation.
          </p>

          <div className="mt-8 space-y-8">
            {epModules.map((m) => (
              <section key={m.id} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-3 flex items-baseline justify-between gap-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    Module {m.id} — {m.title}
                  </h2>
                  <span className="shrink-0 text-xs font-medium text-slate-400">
                    {m.clinicalReferences?.length ?? 0} refs
                  </span>
                </div>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
                  {(m.clinicalReferences ?? []).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
