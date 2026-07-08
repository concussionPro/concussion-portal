'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider } from '@/contexts/SessionContext'
import { AdminCourseDoc } from '@/components/toolkit/AdminCourseDoc'
import { ADMIN_COURSE_MODULES } from '@/data/hub-program-content'

/**
 * /admin-workflow — the front-desk / admin micro-course, DELIVERED (2026-07-08).
 *
 * Hub Pack clinics get real full access: their front-desk staff redeem the team
 * key → full-course → this page renders the actual 8-module micro-course (the
 * SAME AdminCourseDoc the prospect portal previews, minus previewMode). Behind
 * ProtectedRoute so it's paid-only. Previously a mailto dead-end that delivered
 * a headline Hub Pack deliverable to nobody.
 */
export default function AdminWorkflowPage() {
  return (
    <SessionProvider>
      <ProtectedRoute>
        <Shell />
      </ProtectedRoute>
    </SessionProvider>
  )
}

function Shell() {
  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">
              Hub Pack — clinic-level content
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Front-Desk Micro-Course
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Non-clinical training for your reception &amp; admin team — recognition, phone triage,
              red flags, intake, documentation and concussion-priority booking.
            </p>
          </div>
          <AdminCourseDoc modules={ADMIN_COURSE_MODULES} />
        </div>
      </main>
    </div>
  )
}
