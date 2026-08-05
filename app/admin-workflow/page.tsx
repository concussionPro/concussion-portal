import { redirect } from 'next/navigation'
import { Lock, ArrowRight } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { SessionProvider } from '@/contexts/SessionContext'
import { AdminCourseDoc } from '@/components/toolkit/AdminCourseDoc'
import { resolveToolkitPageAccess } from '@/lib/toolkit-access'
import { CONFIG } from '@/lib/config'

/**
 * /admin-workflow — the front-desk / admin micro-course, DELIVERED (2026-07-08).
 *
 * Hub Pack clinics get real full access: their front-desk staff redeem the team
 * key → full-course → this page renders the actual 8-module micro-course (the
 * SAME AdminCourseDoc the prospect portal previews, minus previewMode).
 * Previously a mailto dead-end that delivered a headline Hub Pack deliverable
 * to nobody.
 *
 * SERVER component — entitlement resolves before render so the 8 modules (and
 * their knowledge-check answers) only ever travel in the RSC payload of an
 * entitled request, never in a public static chunk.
 */
export default async function AdminWorkflowPage() {
  const access = await resolveToolkitPageAccess()

  if (access === 'unauthenticated') {
    redirect('/login?redirect=%2Fadmin-workflow')
  }

  if (access === 'locked') {
    return (
      <SessionProvider>
        <div className="flex min-h-screen dashboard-bg">
          <Sidebar />
          <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
            <div className="max-w-2xl mx-auto">
              <div className="glass-premium rounded-2xl p-8 sm:p-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-700 mb-2">
                  Hub Pack — clinic-level content
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
                  Front-Desk Micro-Course
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-lg mx-auto">
                  Non-clinical training for your reception &amp; admin team — recognition, phone triage,
                  red flags, intake, documentation and concussion-priority booking. Included with course
                  enrolment.
                </p>
                <a
                  href={CONFIG.SHOP_URL}
                  className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors shadow-md"
                >
                  Unlock with Concussion Clinical Mastery
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </main>
        </div>
      </SessionProvider>
    )
  }

  // Entitled — only now does the paid content enter the response.
  const { ADMIN_COURSE_MODULES } = await import('@/data/hub-program-content')

  return (
    <SessionProvider>
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
    </SessionProvider>
  )
}
