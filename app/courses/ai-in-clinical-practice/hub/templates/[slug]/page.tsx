import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { CourseSidebar } from '@/components/ai-course/CourseSidebar'
import { loadTemplates } from '@/lib/ai-course/content'
import { FillableTemplate } from '@/components/ai-course/FillableTemplate'

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
      <CourseSidebar />
      <main className="md:pl-72">
        <div className="max-w-6xl mx-auto px-6 pt-[120px] pb-20 print:pt-0 print:px-0">
          <div className="print:hidden">
            <AdminPreviewBadge access={access} />
            <Link
              href="/courses/ai-in-clinical-practice/hub"
              className="text-xs text-accent hover:underline mb-4 inline-block"
            >
              ← Back to Hub
            </Link>

            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {template.specialty}
              </span>
              {template.useCase && (
                <span className="text-[10px] text-muted-foreground">{template.useCase}</span>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                Fillable · {template.fields.length} fields
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{template.title}</h1>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Fill in the form on the left — the document on the right updates live. Copy or print/save-as-PDF when ready. Retain the compliance attestation footer on issued documents.
            </p>
          </div>

          <FillableTemplate
            title={template.title}
            body={template.body}
            fields={template.fields}
          />
        </div>
      </main>
    </div>
  )
}
