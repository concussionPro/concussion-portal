import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { VagusCourseSidebar } from '@/components/ai-course/VagusCourseSidebar'
import {
  VAGUS_TOOLKIT_ITEMS,
  VAGUS_TOOLKIT_CATEGORIES,
  type VagusToolkitCategory,
} from '@/lib/vagus-course/toolkit'
import { ArrowRight, BookMarked } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Clinical Toolkit — The Vagus Nerve in Clinical Practice',
  robots: 'noindex, nofollow',
}

export default async function VagusToolkitPage() {
  const access = await requireAiCourseAccess()

  const grouped: Array<{ category: VagusToolkitCategory; items: typeof VAGUS_TOOLKIT_ITEMS }> =
    VAGUS_TOOLKIT_CATEGORIES.map((cat) => ({
      category: cat,
      items: VAGUS_TOOLKIT_ITEMS.filter((i) => i.category === cat),
    }))

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <VagusCourseSidebar />
      <main className="md:pl-72">
        <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
          <AdminPreviewBadge access={access} />

          {/* Hero */}
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-2">
            Clinical Toolkit
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Forms, handouts, referral letters, protocols.
          </h1>
          <p className="text-base text-muted-foreground mb-2 leading-relaxed">
            {VAGUS_TOOLKIT_ITEMS.length} clinician-grade artefacts across {VAGUS_TOOLKIT_CATEGORIES.length} categories. Copy + adapt — designed for direct use in AHPRA-regulated practice.
          </p>
          <p className="text-xs text-muted-foreground mb-10">
            Each artefact links to the module that teaches the source material and cites primary sources. Refreshed when underlying guidelines update.
          </p>

          {/* Category jump nav */}
          <div className="flex flex-wrap gap-2 mb-10">
            {VAGUS_TOOLKIT_CATEGORIES.map((cat) => {
              const count = VAGUS_TOOLKIT_ITEMS.filter((i) => i.category === cat).length
              return (
                <a
                  key={cat}
                  href={`#${slugify(cat)}`}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                >
                  {cat}
                  <span className="ml-1.5 text-slate-500">({count})</span>
                </a>
              )
            })}
          </div>

          {/* Categories */}
          {grouped.map((g) => (
            <section key={g.category} id={slugify(g.category)} className="mb-12 scroll-mt-[140px]">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">{g.category}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {g.items.length} {g.items.length === 1 ? 'artefact' : 'artefacts'}
                </span>
              </div>
              <div className="space-y-4">
                {g.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-foreground leading-tight mb-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.oneLiner}</p>
                        </div>
                      </div>
                      <div className="px-5 py-4 bg-slate-50/40 space-y-4">
                        {item.sections.map((section, sIdx) => (
                          <div key={sIdx}>
                            {section.heading && (
                              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600 mb-2">
                                {section.heading}
                              </p>
                            )}
                            <ul className="space-y-1.5">
                              {section.body.map((line, lIdx) => {
                                if (line === '') {
                                  return <li key={lIdx} className="h-1.5" />
                                }
                                const isHeadingLine = line.startsWith('Stage ') || line.startsWith('Week ') || line.startsWith('Day ') || line.startsWith('Days ') || line.startsWith('STOP TEST')
                                return (
                                  <li
                                    key={lIdx}
                                    className={`text-[13px] leading-relaxed flex items-baseline gap-2 ${
                                      isHeadingLine ? 'font-semibold text-foreground mt-2' : 'text-foreground/85'
                                    }`}
                                  >
                                    {!isHeadingLine && <span className="text-accent shrink-0 text-xs">·</span>}
                                    <span>{line}</span>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        ))}

                        {/* Sources */}
                        {item.sources && item.sources.length > 0 && (
                          <div className="pt-3 border-t border-slate-200">
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1.5 flex items-center gap-1.5">
                              <BookMarked className="w-3 h-3" />
                              Evidence sources
                            </p>
                            <ul className="space-y-0.5">
                              {item.sources.map((s, i) => (
                                <li key={i} className="text-[11px] text-muted-foreground italic leading-relaxed">
                                  · {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Module backlink */}
                        {item.taughtIn && (
                          <Link
                            href={`/courses/vagus-nerve/${item.taughtIn}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline pt-1"
                          >
                            Taught in the module
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          {/* Methodology footer */}
          <section className="mt-12 rounded-xl bg-slate-50 border border-slate-200 p-5 text-xs text-slate-700">
            <p className="font-semibold mb-2">How to use this toolkit</p>
            <p className="leading-relaxed mb-2">
              Each artefact is designed to be adapted to your clinic, not used verbatim. Replace placeholder names with your clinic name, your registration details, and your local referral pathways. For patient-facing handouts, consider running one revision past a colleague who works with the same patient population.
            </p>
            <p className="leading-relaxed mb-2">
              Referral templates should be reviewed against your local hospital&apos;s preferred referral format on first use. The structure is correct; the specific subject-line conventions vary by health service.
            </p>
            <p className="leading-relaxed">
              Update cadence: contents are refreshed when underlying clinical guidelines (HRS, ESC, CSANZ, NIH POTS consensus) publish updates. Last reviewed against the catalogue listed in each artefact&apos;s evidence-sources block.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
