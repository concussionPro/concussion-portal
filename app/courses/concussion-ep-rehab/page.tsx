import { Metadata } from 'next'
import Link from 'next/link'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { EP_MODULES, epSlug, EP_COURSE, EP_TOTAL_POINTS } from '@/lib/ep-course/content'

export const metadata: Metadata = {
  title: 'Concussion Rehabilitation for Exercise Physiologists',
  robots: 'noindex, nofollow',
}

export default async function EpCourseLanding() {
  const access = await requireAiCourseAccess('/login')
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-3xl px-6 py-12">
        <AdminPreviewBadge access={access} />
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          {EP_TOTAL_POINTS} CPD hours · online · ESSA accreditation review copy
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{EP_COURSE.title}</h1>
        <p className="mt-2 text-lg text-slate-600">{EP_COURSE.subtitle}</p>
        <p className="mt-4 text-slate-700">
          A scope-specific course for Accredited Exercise Physiologists — the active-rehabilitation
          half of concussion care: sub-symptom-threshold aerobic exercise, the Buffalo protocol,
          phenotype-specific exercise rehab, and graded return to sport. Recognise and refer; do not
          diagnose or clear.
        </p>

        <ol className="mt-8 space-y-3">
          {EP_MODULES.map((m) => (
            <li key={m.id}>
              <Link
                href={`${EP_COURSE.basePath}/${epSlug(m.id)}`}
                className="block rounded-xl border border-slate-200 p-4 transition hover:border-teal-300 hover:bg-slate-50"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-semibold text-slate-900">
                    {m.id}. {m.title}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {m.duration} · {m.points} {m.points === 1 ? 'pt' : 'pts'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{m.subtitle}</p>
              </Link>
            </li>
          ))}
        </ol>

        <p className="mt-10 text-xs text-slate-400">
          Private review copy. Not listed publicly. In-person practical (6 hrs) is delivered through
          the existing multidisciplinary workshop — 14 CPD hours total.
        </p>
      </main>
    </div>
  )
}
