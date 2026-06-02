import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ToolkitSidebar } from '../_sidebar'
import { ADMIN_COURSE_MODULES } from '@/data/hub-program-content'
import { AdminCourseDoc } from '@/components/toolkit/AdminCourseDoc'

const ACCESS_KEY = 'ah2026'

export const metadata: Metadata = {
  title: 'Front-Desk Micro-Course — Advanced Health Hub Preview',
  description: '8-module reception micro-course preview.',
  robots: 'noindex, nofollow',
}

export default async function ProspectAdminCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>
}) {
  const { k } = await searchParams
  if (k !== ACCESS_KEY) {
    return (
      <div className="min-h-screen dashboard-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-premium rounded-2xl p-8 text-center">
          <h1 className="text-xl font-bold text-foreground mb-3">Private proposal portal</h1>
          <p className="text-sm text-muted-foreground">Access requires the link from Zac&rsquo;s introductory email.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen dashboard-bg">
      <ToolkitSidebar active="admin" />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <Link
            href={`/proposals/advanced-health-buderim/toolkit?k=${ACCESS_KEY}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to toolkit
          </Link>

          {/*
            Admin course content is VIEW-ONLY for prospect portals.
            - The 8 modules render in full so prospects see the depth.
            - The DownloadButton is omitted (no ZIP for prospects).
            - The bulk-download API also blocks `kit=admin` for any
              request carrying a prospect access key (defence in depth).
          */}
          <AdminCourseDoc modules={ADMIN_COURSE_MODULES} />
        </div>
      </main>
    </div>
  )
}
