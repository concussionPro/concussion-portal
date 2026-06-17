import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { EpCourseSidebar } from '@/components/ep-course/EpCourseSidebar'
import { EP_MODULES } from '@/lib/ep-course/modules'
import { EP_COURSE } from '@/lib/ep-course/content'

export const metadata: Metadata = {
  title: 'Concussion Rehabilitation for Exercise Physiologists',
  robots: 'noindex, nofollow',
}

export default async function EpCourseLanding() {
  const access = await requireAiCourseAccess('/login')
  const totalMin = EP_MODULES.reduce((s, m) => s + m.durationMin, 0)

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <EpCourseSidebar />
      <main className="md:pl-72">
        <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-20">
          <AdminPreviewBadge access={access} />

          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            ESSA accreditation review copy · {(totalMin / 60).toFixed(0)} online + 6 workshop = 14 CPD hours
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{EP_COURSE.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{EP_COURSE.subtitle}</p>
          <p className="mt-5 text-slate-700 leading-relaxed">
            A scope-specific course for Accredited Exercise Physiologists — the active-rehabilitation half of
            concussion care. The evidence moved from rest to active recovery, and the AEP is the profession best
            placed to deliver it: sub-symptom-threshold aerobic exercise, the Buffalo protocol, phenotype-specific
            exercise rehab, and graded return to sport. You recognise and refer — you do not diagnose or clear.
          </p>

          <ol className="mt-10 space-y-3">
            {EP_MODULES.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/courses/concussion-ep-rehab/${m.slug}`}
                  className="group flex gap-4 rounded-xl border border-slate-200 p-5 transition-colors hover:border-accent/40 hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 group-hover:bg-accent group-hover:text-white">
                    {m.number}
                  </span>
                  <span>
                    <span className="flex items-baseline justify-between gap-4">
                      <span className="font-semibold text-foreground">{m.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{m.durationMin}m</span>
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">{m.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          <p className="mt-10 text-xs text-slate-400">
            Private review copy — not listed publicly, noindex. The 6-hour in-person practical is delivered through
            the existing multidisciplinary workshop.
          </p>
        </div>
      </main>
    </div>
  )
}
