import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { loadTemplates } from '@/lib/ai-course/content'
import { MarkdownContent } from '@/components/ai-course/MarkdownContent'

interface PageParams {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = { robots: 'noindex, nofollow' }

export default async function TemplatePage({ params }: PageParams) {
  const access = await requireAiCourseAccess()
  const { slug } = await params
  const all = await loadTemplates()
  const template = all.find((t) => t.slug === slug)
  if (!template) notFound()

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

        <div className="mb-2 flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {template.specialty}
          </span>
          {template.useCase && (
            <span className="text-[10px] text-muted-foreground">{template.useCase}</span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-8">{template.title}</h1>

        <div className="card rounded-xl p-6">
          <MarkdownContent source={template.body} />
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Copy this template into your preferred editor (Word, Google Docs, your PMS). Fill in the bracketed placeholders. Always retain the compliance attestation footer on issued documents.
        </p>
      </div>
    </div>
  )
}
