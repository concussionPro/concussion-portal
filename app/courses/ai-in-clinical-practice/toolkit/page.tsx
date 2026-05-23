import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { CourseSidebar } from '@/components/ai-course/CourseSidebar'
import { TOOLKIT_ITEMS, TOOLKIT_CATEGORIES, type ToolkitCategory } from '@/lib/ai-course/toolkit'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Clinical Toolkit — AI in Clinical Practice',
  robots: 'noindex, nofollow',
}

export default async function ToolkitPage() {
  const access = await requireAiCourseAccess()

  const grouped: Array<{ category: ToolkitCategory; items: typeof TOOLKIT_ITEMS }> = TOOLKIT_CATEGORIES.map((cat) => ({
    category: cat,
    items: TOOLKIT_ITEMS.filter((i) => i.category === cat),
  }))

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <CourseSidebar />
      <main className="md:pl-72">
        <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
          <AdminPreviewBadge access={access} />

          {/* Hero */}
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-2">
            Clinical Toolkit
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Templates, scripts, decision trees.
          </h1>
          <p className="text-base text-muted-foreground mb-2 leading-relaxed">
            {TOOLKIT_ITEMS.length} clinician-grade artefacts across {TOOLKIT_CATEGORIES.length} categories. Copy + adapt to your practice — designed to survive an AHPRA notification or indemnity claim.
          </p>
          <p className="text-xs text-muted-foreground mb-10">
            Each artefact links back to the module that teaches the source material. Refreshed monthly with the regulator content-refresh cron.
          </p>

          {/* Category jump nav */}
          <div className="flex flex-wrap gap-2 mb-10">
            {TOOLKIT_CATEGORIES.map((cat) => (
              <a
                key={cat}
                href={`#${slugify(cat)}`}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
              >
                {cat}
              </a>
            ))}
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
                          <h3 className="text-base font-bold text-foreground leading-tight mb-1">{item.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.oneLiner}</p>
                        </div>
                      </div>
                      <div className="px-5 py-4 bg-slate-50/50">
                        <ul className="space-y-2">
                          {item.contents.map((c, i) => (
                            <li key={i} className="text-xs text-foreground/85 leading-relaxed flex items-baseline gap-2">
                              <span className="text-accent shrink-0">·</span>
                              <span dangerouslySetInnerHTML={{ __html: c.replace(/"([^"]+)"/g, '<span class="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-slate-200">$1</span>') }} />
                            </li>
                          ))}
                        </ul>
                        {item.taughtIn && (
                          <Link
                            href={`/courses/ai-in-clinical-practice/${item.taughtIn}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline mt-4"
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
              Each artefact is designed to be adapted, not used verbatim. Replace placeholder names with your clinic / your vendor / your indemnity insurer before going live. Run the consent and disclosure scripts past your indemnity insurer once before formal adoption — Avant, MIPS, MIGA, and Guild will all review at no cost to members.
            </p>
            <p className="leading-relaxed">
              Update cadence: vendor lists and tier classifications refresh monthly via the content-refresh cron. Regulatory frameworks update on regulator publication (AHPRA, OAIC, TGA).
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
