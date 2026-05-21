import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { loadPrompts } from '@/lib/ai-course/content'
import { MarkdownContent } from '@/components/ai-course/MarkdownContent'

interface PageParams {
  params: Promise<{ category: string }>
}

export const metadata: Metadata = { robots: 'noindex, nofollow' }

export default async function PromptCategoryPage({ params }: PageParams) {
  const access = await requireAiCourseAccess()
  const { category } = await params
  const all = await loadPrompts()
  const prompts = all.filter((p) => p.category === category)
  if (prompts.length === 0) notFound()

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />
        <Link
          href="/courses/ai-in-clinical-practice/hub"
          className="text-xs text-accent hover:underline mb-4 inline-block"
        >
          ← Back to Hub
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2 capitalize">
          {category.replace(/-/g, ' ')}
        </h1>
        <p className="text-muted-foreground mb-10">{prompts.length} prompts</p>

        <div className="space-y-10">
          {prompts.map((p, i) => (
            <div key={i} className="card rounded-xl p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h2 className="text-lg font-bold text-foreground flex-1">{p.title}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {p.specialty}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  p.riskTier === 'low' ? 'bg-emerald-50 text-emerald-700' :
                  p.riskTier === 'medium' ? 'bg-amber-50 text-amber-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {p.riskTier} risk
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  Tier {p.toolTier}
                </span>
              </div>
              <MarkdownContent source={p.body} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
