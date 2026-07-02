import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { requireCourseAccess } from '@/lib/course-access'
import { VagusCourseSidebar } from '@/components/ai-course/VagusCourseSidebar'
import { VAGUS_REFERENCES, VAGUS_REF_CATEGORIES, type VagusResourceKind } from '@/lib/vagus-course/references'
import { ExternalLink, Star, Mic, Video, GraduationCap, FileText, ScrollText, Headphones, PlaySquare } from 'lucide-react'

const KIND_META: Record<VagusResourceKind, { label: string; icon: typeof Mic; color: string }> = {
  paper: { label: 'Paper', icon: FileText, color: 'bg-slate-100 text-slate-700 border-slate-200' },
  guideline: { label: 'Guideline', icon: ScrollText, color: 'bg-blue-50 text-blue-800 border-blue-200' },
  podcast: { label: 'Podcast', icon: Headphones, color: 'bg-purple-50 text-purple-800 border-purple-200' },
  video: { label: 'Video', icon: Video, color: 'bg-rose-50 text-rose-800 border-rose-200' },
  lecture: { label: 'Lecture', icon: GraduationCap, color: 'bg-amber-50 text-amber-800 border-amber-200' },
  webinar: { label: 'Webinar', icon: PlaySquare, color: 'bg-teal-50 text-teal-800 border-teal-200' },
  'conference-talk': { label: 'Conference talk', icon: Mic, color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
}

export const metadata: Metadata = {
  title: 'Reference Repository — Vagus Nerve',
  robots: 'noindex, nofollow',
}

export default async function VagusReferencesPage() {
  const access = await requireCourseAccess('vagus-nerve')

  const grouped = VAGUS_REF_CATEGORIES.map((cat) => ({
    category: cat,
    refs: VAGUS_REFERENCES.filter((r) => r.category === cat),
  }))
  const foundational = VAGUS_REFERENCES.filter((r) => r.isFoundational)

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <VagusCourseSidebar />
      <main className="md:pl-72">
        <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
          <AdminPreviewBadge access={access} />

          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-2">
            Reference Repository
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Sourced. Verifiable. Defensible.
          </h1>
          <p className="text-base text-muted-foreground mb-2 leading-relaxed">
            Every claim about vagal anatomy, HRV measurement, autonomic phenotypes, and intervention efficacy in this course has an upstream source. {VAGUS_REFERENCES.length} references across {VAGUS_REF_CATEGORIES.length} categories. Refreshed monthly via the content-refresh cron.
          </p>
          <p className="text-xs text-muted-foreground mb-10">
            Foundational references are starred — these are the documents to read first if you want to verify the course&rsquo;s evidence base independently.
          </p>

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

          <section className="mt-12 rounded-xl bg-slate-50 border border-slate-200 p-5 text-xs text-slate-700">
            <p className="font-semibold mb-2">Methodology + maintenance</p>
            <p className="mb-2 leading-relaxed">
              APA-7 format. Journal sources cite the DOI; foundational text from authoritative open-access platforms (StatPearls, OAIC, NHS, FDA).
            </p>
            <p className="leading-relaxed">
              Monthly content-refresh cron watches each publisher URL and emails a diff when a referenced paper, guideline, or position statement is updated. Last full audit: 2026-05.
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
  reference: typeof VAGUS_REFERENCES[0]
  foundational?: boolean
}) {
  const kind = reference.kind || 'paper'
  const kindMeta = KIND_META[kind]
  const KindIcon = kindMeta.icon
  const isMediaKind = kind === 'podcast' || kind === 'video' || kind === 'webinar' || kind === 'lecture' || kind === 'conference-talk'

  return (
    <div className={`rounded-lg border p-4 ${foundational ? 'border-amber-200 bg-amber-50/30' : isMediaKind ? 'border-slate-200 bg-gradient-to-br from-white to-slate-50/60' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
        {foundational && <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />}
        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border flex items-center gap-1 ${kindMeta.color}`}>
          <KindIcon className="w-2.5 h-2.5" />
          {kindMeta.label}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{reference.category}</span>
        <span className="text-[10px] text-slate-400">·</span>
        <span className="text-[10px] text-slate-500 tabular-nums">{reference.year}</span>
        {reference.duration && (
          <>
            <span className="text-[10px] text-slate-400">·</span>
            <span className="text-[10px] text-slate-500 tabular-nums">{reference.duration}</span>
          </>
        )}
      </div>
      <p className="text-sm font-bold text-foreground leading-snug mb-1">{reference.title}</p>
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
          {isMediaKind ? 'Open / watch / listen' : 'Open source'}
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}

void Link
