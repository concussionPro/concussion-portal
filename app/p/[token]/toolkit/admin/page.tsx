import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ToolkitSidebar } from '../_sidebar'
import { ProspectTracker } from '@/components/prospect/ProspectTracker'
import { TalkToZacFooter } from '@/components/prospect/TalkToZacFooter'
import { ADMIN_COURSE_MODULES } from '@/data/hub-program-content'
import { AdminCourseDoc } from '@/components/toolkit/AdminCourseDoc'
import { headers } from 'next/headers'
import { getClinicBySlug, recordPortalView } from '@/lib/prospect/repo'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const clinic = await getClinicBySlug(token)
  return {
    title: clinic ? `Front-Desk Micro-Course — ${clinic.shortName}` : 'Front-Desk Micro-Course',
    description: '8-module reception micro-course preview.',
    robots: 'noindex, nofollow',
  }
}

export default async function ProspectAdminCoursePage({ params, searchParams }: PageProps) {
  const { token } = await params
  await searchParams
  const clinic = await getClinicBySlug(token)
  if (!clinic) notFound()
  // Keyless per-clinic URL (Zac 2026-06-11): cold emails link to /p/<slug>
  // with NO access key. This is non-sensitive marketing content, so any valid
  // clinic slug renders. The key is honoured when present (legacy links) but
  // no longer required.

  // Engagement signal — fire-and-forget. Failures don't block the render.
  const h = await headers()
  const userAgent = h.get('user-agent') ?? undefined
  const forwarded = h.get('x-forwarded-for') ?? undefined
  const viewerIp = forwarded?.split(',')[0]?.trim()
  recordPortalView({
    clinicId: clinic.id,
    viewerIp,
    userAgent,
    section: 'toolkit-admin',
    utmSource: 'cold_outreach',
    utmCampaign: 'prospect_portal_email',
    utmTerm: clinic.slug,
  }).catch((err) => console.error('[Portal view tracking failed]', err))

  const accessKey = clinic.accessKey
  const baseHref = `/p/${clinic.slug}`

  return (
    <div className="flex min-h-screen dashboard-bg">
      <ProspectTracker token={clinic.slug} accessKey={clinic.accessKey} />
      <ToolkitSidebar clinic={clinic} active="admin" />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <Link
            href={`${baseHref}/toolkit?k=${accessKey}`}
            data-track-cta="toolkit-back-to-launcher"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to toolkit
          </Link>

          <div data-track-section="toolkit-admin">
            {/*
              Admin course preview — STRUCTURE ONLY for prospects:
                - 8 modules visible with title, duration, learning outcomes
                - Module body content + knowledge check questions HIDDEN
                - Completion certificate HIDDEN
                - No download (API blocks kit=admin for prospect tokens)
              Full access activates per staff member with the Hub Program.
            */}
            <AdminCourseDoc
              modules={ADMIN_COURSE_MODULES}
              previewMode
              unlockHref={`${baseHref}?k=${accessKey}#pricing`}
            />
          </div>
          <div className="h-20" />
        </div>
      </main>
      <TalkToZacFooter clinicShortName={clinic.shortName} context="admin-workflow" />
    </div>
  )
}
