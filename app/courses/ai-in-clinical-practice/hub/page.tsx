import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { CourseSidebar } from '@/components/ai-course/CourseSidebar'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { TOOLS } from '@/lib/ai-course/tools-matrix'
import { loadPrompts, loadTemplates } from '@/lib/ai-course/content'
import { Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Practice Hub — AI in Clinical Practice',
  robots: 'noindex, nofollow',
}

export default async function HubPage() {
  const access = await requireAiCourseAccess()
  const prompts = await loadPrompts()
  const templates = await loadTemplates()

  // Group prompts by category for navigation
  const categories = Array.from(new Set(prompts.map((p) => p.category))).sort()

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <CourseSidebar />
      <main className="md:pl-72">
      <div className="max-w-5xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />
        <Link
          href="/courses/ai-in-clinical-practice"
          className="text-xs text-accent hover:underline mb-4 inline-block"
        >
          ← Back to course
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-3">AI Practice Hub</h1>
        <p className="text-muted-foreground mb-8">
          Prompt library, document templates, tool comparison matrix, and live literature search. Refreshed monthly — the change feed lives in your inbox via the automated digest.
        </p>

        {/* Literature search — surfaced as a primary feature */}
        <Link
          href="/courses/ai-in-clinical-practice/hub/literature"
          className="mb-12 group flex items-start gap-4 rounded-2xl border-2 border-accent/20 bg-gradient-to-br from-accent/[0.04] to-white p-5 hover:border-accent/40 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-accent mb-1">New · live search</p>
            <p className="text-base font-bold text-foreground leading-tight mb-1">Literature search</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              PubMed + Semantic Scholar federated search. Vancouver citation export. 8 one-click clinical questions to start.
            </p>
          </div>
          <div className="text-sm font-bold text-accent group-hover:underline shrink-0 self-center">
            Search →
          </div>
        </Link>

        {/* Prompt library overview */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Prompt library</h2>
            <span className="text-xs text-muted-foreground">{prompts.length} prompts in {categories.length} categories</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const inCat = prompts.filter((p) => p.category === cat)
              return (
                <Link
                  key={cat}
                  href={`/courses/ai-in-clinical-practice/hub/prompts/${cat}`}
                  className="card rounded-xl p-4 hover:border-accent/40 transition-colors"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">
                    {cat.replace(/-/g, ' ')}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{inCat.length} prompts</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    {inCat.slice(0, 2).map((p) => p.title).join(' · ')}
                    {inCat.length > 2 && ' · …'}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Document templates */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Document templates</h2>
            <span className="text-xs text-muted-foreground">{templates.length} templates</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {templates.map((t) => (
              <Link
                key={t.slug}
                href={`/courses/ai-in-clinical-practice/hub/templates/${t.slug}`}
                className="card rounded-xl p-4 hover:border-accent/40 transition-colors"
              >
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.specialty} · {t.useCase}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Tool comparison matrix */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Tool comparison matrix</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Last verified: 2026-05-22. Refreshed quarterly. Always confirm current vendor terms before relying on any tier classification.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-3 py-2 text-xs font-semibold">Tool</th>
                  <th className="px-3 py-2 text-xs font-semibold">Tier</th>
                  <th className="px-3 py-2 text-xs font-semibold">AU Residency</th>
                  <th className="px-3 py-2 text-xs font-semibold">From (AUD)</th>
                  <th className="px-3 py-2 text-xs font-semibold">Primary use</th>
                </tr>
              </thead>
              <tbody>
                {TOOLS.map((t) => (
                  <tr key={t.name} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
                          {t.name}
                        </a>
                        {t.ceaRecommended && (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                            CEA recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.notes}</p>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        t.tier === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        t.tier === 'B' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {t.tier}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {t.auResidency === true ? '✓' : t.auResidency === 'configurable' ? 'Configurable' : '✗'}
                    </td>
                    <td className="px-3 py-2 text-xs">{t.pricingFromAUD !== null ? `$${t.pricingFromAUD}` : '—'}</td>
                    <td className="px-3 py-2 text-xs">{t.primaryUse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      </main>
    </div>
  )
}
