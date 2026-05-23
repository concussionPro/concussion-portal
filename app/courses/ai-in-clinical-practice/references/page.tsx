import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { CourseSidebar } from '@/components/ai-course/CourseSidebar'
import { AI_REFERENCES, AI_REF_CATEGORIES } from '@/lib/ai-course/references'
import { ExternalLink, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Reference Repository — AI in Clinical Practice',
  robots: 'noindex, nofollow',
}

export default async function ReferencesPage() {
  const access = await requireAiCourseAccess()

  const grouped = AI_REF_CATEGORIES.map((cat) => ({
    category: cat,
    refs: AI_REFERENCES.filter((r) => r.category === cat),
  }))
  const foundational = AI_REFERENCES.filter((r) => r.isFoundational)

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <CourseSidebar />
      <main className="md:pl-72">
        <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
          <AdminPreviewBadge access={access} />

          {/* Hero */}
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-2">
            Reference Repository
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Sourced. Verifiable. AHPRA-aligned.
          </h1>
          <p className="text-base text-muted-foreground mb-2 leading-relaxed">
            Every regulatory claim, every privacy principle, every TGA boundary cited in this course has an upstream source. {AI_REFERENCES.length} references across {AI_REF_CATEGORIES.length} categories. Refreshed monthly via the content-refresh cron.
          </p>
          <p className="text-xs text-muted-foreground mb-10">
            Foundational references are starred — these are the documents to read first if you want to verify the course&rsquo;s regulatory frame independently.
          </p>

          {/* Foundational shortcut */}
          <section className="mb-12">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-amber-700 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              Foundational ({foundational.length})
            </h2>
            <div className="grid gap-3">
              {foundational.map((r) => (
                <ReferenceCard key={r.id} reference={r} foundational />
              ))}
            </div>
          </section>

          {/* All references grouped by category */}
          {grouped.map((g) => (
            <section key={g.category} className="mb-10">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-base font-bold text-foreground">{g.category}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {g.refs.length} {g.refs.length === 1 ? 'reference' : 'references'}
                </span>
              </div>
              <div className="grid gap-2.5">
                {g.refs.map((r) => (
                  <ReferenceCard key={r.id} reference={r} />
                ))}
              </div>
            </section>
          ))}

          {/* Methodology footer */}
          <section className="mt-12 rounded-xl bg-slate-50 border border-slate-200 p-5 text-xs text-slate-700">
            <p className="font-semibold mb-2">Methodology + maintenance</p>
            <p className="mb-2 leading-relaxed">
              Citation format: APA-7. Government and regulator URLs are .gov.au where available; journal sources cite the DOI. Where a primary source URL returns 403 to automated fetch (some AHPRA endpoints block scrapers), the canonical landing page is cited and verified by hand on each content-refresh cycle.
            </p>
            <p className="leading-relaxed">
              The monthly content-refresh cron (<code className="bg-white px-1.5 py-0.5 rounded text-[10px]">/api/cron/ai-course-content-refresh</code>) watches each regulator URL and emails a diff digest when any change is detected. Last full audit: 2026-05.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}

function ReferenceCard({
  reference,
  foundational,
}: {
  reference: typeof AI_REFERENCES[0]
  foundational?: boolean
}) {
  return (
    <div className={`rounded-lg border p-4 ${foundational ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
        {foundational && <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />}
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{reference.category}</span>
        <span className="text-[10px] text-slate-400">·</span>
        <span className="text-[10px] text-slate-500 tabular-nums">{reference.year}</span>
      </div>
      <p className="text-sm font-bold text-foreground leading-snug mb-1">
        {reference.title}
      </p>
      <p className="text-xs text-muted-foreground mb-2 leading-snug">
        {reference.authors} · <em>{reference.source}</em>
      </p>
      <p className="text-xs text-foreground/75 leading-relaxed mb-2.5">
        <span className="font-semibold text-foreground">Why it matters: </span>
        {reference.relevance}
      </p>
      {reference.url && (
        <a
          href={reference.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
        >
          Open source
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}
