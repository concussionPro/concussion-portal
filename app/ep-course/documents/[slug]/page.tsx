import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { EpDocumentRenderer } from '@/components/ep-course/EpDocumentRenderer'
import { PrintDocumentButton } from '@/components/ep-course/PrintDocumentButton'
import { getEpDocument, EP_DOCUMENTS } from '@/data/ep-documents'

interface PageParams {
  params: Promise<{ slug: string }>
}

// Pre-render the known document slugs; everything else 404s.
export function generateStaticParams() {
  return EP_DOCUMENTS.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params
  const doc = getEpDocument(slug)
  return {
    title: doc ? `${doc.title} — Concussion Rehab for EPs` : 'Document',
    robots: 'noindex, nofollow',
  }
}

export default async function EpDocumentPage({ params }: PageParams) {
  // Paid deliverable — gated to enrolled / demo / admin via the shared course gate.
  const access = await requireAiCourseAccess('/login')
  const { slug } = await params
  const doc = getEpDocument(slug)
  if (!doc) notFound()

  const backHref = doc.category === 'admin' ? '/ep-course/admin-docs' : '/ep-course/toolkit'
  const backLabel = doc.category === 'admin' ? '← Admin Documents' : '← Clinical Toolkit'

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <div className="mx-auto max-w-3xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
        <div className="print:hidden">
          <AdminPreviewBadge access={access} />
          <div className="flex items-center justify-between gap-4">
            <Link href={backHref} className="text-sm font-semibold text-teal-700 hover:underline">
              {backLabel}
            </Link>
            <PrintDocumentButton />
          </div>
          <p className="mt-3 mb-6 text-xs leading-relaxed text-slate-500">
            View, fill in on screen or print. Use <strong>Print / Save as PDF</strong> to produce a clean clinic copy —
            the page chrome is removed automatically from the printed sheet.
          </p>
        </div>

        <EpDocumentRenderer doc={doc} />
      </div>
    </div>
  )
}
