import { Metadata } from 'next'
import Link from 'next/link'
import { AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { requireCrmCourseAccess } from '@/components/ep-course/CrmCourseGate'
import { EpCourseNavigation } from '@/components/ep-course/EpCourseNavigation'
import { EpReferenceSearch } from '@/components/ep-course/EpReferenceSearch'
import { getEpModulesMeta } from '@/data/ep-module-meta'
import { getEpReferences, epCitationTotal } from '@/lib/ep-references'

export const metadata: Metadata = {
  title: 'Reference Repository — Concussion Rehab for EPs',
  robots: 'noindex, nofollow',
}

/**
 * CRM Reference Repository — searchable and module-filterable, matching what a
 * CCM buyer gets at /references.
 *
 * SERVER-gated (requireCrmCourseAccess) and the citations are passed to the
 * client component as props, so the dataset only ever ships in the RSC payload
 * of an entitled request. It is derived from the modules' own
 * `clinicalReferences` strings — there is no second citation list to drift.
 */
export default async function EpReferencesPage() {
  const access = await requireCrmCourseAccess()
  const references = getEpReferences()
  const citationTotal = epCitationTotal()
  const moduleTitles = getEpModulesMeta().map((m) => ({ id: m.id, title: m.title }))

  return (
    <div className="flex min-h-screen bg-slate-50">
      <EpCourseNavigation />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <AdminPreviewBadge access={access} />
          <Link href="/ep-course/dashboard" className="text-sm font-semibold text-teal-700 hover:underline">
            ← Course
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Reference Repository</h1>
          <p className="mt-2 text-slate-600">
            The {citationTotal}-citation evidence base behind the course — searchable, and filterable by the module
            that cites it. The literature an Accredited Exercise Physiologist can cite for concussion exercise
            rehabilitation.
          </p>
          {citationTotal > references.length && (
            <p className="mt-1 text-xs text-slate-400">
              {references.length} distinct citations: a citation used by more than one module is listed once and
              tagged with every module that cites it.
            </p>
          )}

          <EpReferenceSearch references={references} moduleTitles={moduleTitles} />
        </div>
      </main>
    </div>
  )
}
