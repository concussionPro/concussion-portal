import { NextResponse } from 'next/server'
import { getPreviewContent, previewCourseFromParam } from '@/lib/preview-content'

/**
 * Public (no auth) API route — the locked-trial preview.
 * Module 1: first 3 sections unlocked (myths intro, learning objectives,
 * introduction with "Is This a Concussion?" clinical scenario).
 * The scenario ends with an upgrade CTA → /pricing.
 * Modules 2-8: first section only.
 *
 * The shape and the unlock rules now live in lib/preview-content.ts, which the
 * /preview PAGE also uses during SERVER rendering. Both read the same builder,
 * so the crawlable HTML and this JSON can never disagree about what's unlocked.
 *
 * ?course=crm serves the EP course (data/ep-modules) through the IDENTICAL
 * locked-trial structure — same architecture, different course data.
 */
export async function GET(request: Request) {
  const course = previewCourseFromParam(new URL(request.url).searchParams.get('course'))
  return NextResponse.json(getPreviewContent(course))
}
