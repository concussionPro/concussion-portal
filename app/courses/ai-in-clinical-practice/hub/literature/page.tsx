import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { LiteratureSearchClient } from './LiteratureSearchClient'

export const metadata: Metadata = {
  title: 'Literature Search — AI Practice Hub',
  robots: 'noindex, nofollow',
}

export default async function LiteratureSearchPage() {
  const access = await requireAiCourseAccess()

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />
        <Link
          href="/courses/ai-in-clinical-practice/hub"
          className="text-xs text-accent hover:underline mb-4 inline-block"
        >
          Back to Hub
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-3">Literature search</h1>
        <p className="text-muted-foreground mb-6">
          Search peer-reviewed publications across PubMed and Semantic Scholar. Results
          are citation-ready (Vancouver style) and link back to the source record.
        </p>

        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm mb-8">
          <p className="font-semibold mb-1">Tier B/C tool — clinical query only.</p>
          <p className="text-xs leading-relaxed">
            Do not enter patient names, dates of birth, MRN, or any identifying detail.
            Compose queries as clinical questions (PICO style) using de-identified
            terminology. Results are sourced from public databases; verify currency
            before relying on any single study for clinical decision-making.
          </p>
        </div>

        <LiteratureSearchClient />
      </div>
    </div>
  )
}
