import type { Metadata } from 'next'
import { PreviewClient } from '@/components/course/PreviewClient'
import { getPreviewContent, previewCourseFromParam } from '@/lib/preview-content'

/**
 * /preview — the PUBLIC locked-trial. No signup, no login.
 *
 * SERVER COMPONENT (converted 2026-07-26). This page previously rendered an
 * empty shell and fetched its content from /api/preview-content in a browser
 * useEffect, so the server HTML carried module TITLES and not one line of the
 * ~10 unlocked clinical sections. The most citable public writing on the site
 * was invisible to Google and to AI retrievers — in a YMYL niche where exactly
 * that depth is what gets cited.
 *
 * Content is now built on the server (lib/preview-content.ts, shared with the
 * API route) and passed to the client accordion as props, so it ships in the
 * initial HTML. The accordion keeps collapsed panels MOUNTED (`hidden`) rather
 * than unmounting them, so every unlocked section is in the document.
 *
 * ?course=crm serves the EP stream through the identical structure.
 */
export const metadata: Metadata = {
  title: 'Course Preview — Read Module 1 Free | Concussion Education Australia',
  description:
    'Read the opening sections of the concussion course free — no signup. Concussion myths, learning objectives and the "Is This a Concussion?" clinical scenario, plus the first section of all 8 modules.',
  alternates: { canonical: '/preview' },
  robots: 'index, follow',
}

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>
}) {
  const sp = await searchParams
  const course = previewCourseFromParam(sp.course)
  const previewContent = getPreviewContent(course)

  return <PreviewClient previewContent={previewContent} isCrm={course === 'crm'} />
}
