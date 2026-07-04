'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider } from '@/contexts/SessionContext'
import { Building2, ArrowRight } from 'lucide-react'

/**
 * /admin-workflow — HUB PACK material only (owner directive 2026-07-04).
 *
 * The front-desk micro-course trains a clinic's reception / operations staff
 * (triage scripts, booking flows, documentation) — clinic-level content that
 * ships with the Hub Pack, not with an individual course purchase. Individual
 * paid users used to see the full modules here; now the page explains what it
 * is and routes clinic decision-makers to the Hub conversation. The nav link
 * is gone from the sidebar; this page remains for old bookmarks.
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
        <div className="max-w-2xl mx-auto">
          <div className="glass-premium rounded-2xl p-8 sm:p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-5 h-5 text-accent" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">
              Hub Pack — clinic-level content
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
              Front-Desk Micro-Course
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-lg mx-auto">
              Eight modules of non-clinical training for reception &amp; administration staff —
              concussion recognition, phone triage, red flags, intake forms, documentation, and
              concussion-priority booking. This trains your clinic&rsquo;s TEAM, so it ships with the
              clinic Hub Pack rather than an individual enrolment. Your own course content
              isn&rsquo;t affected — this module just isn&rsquo;t part of it.
            </p>
            <a
              href="mailto:zac@concussion-education-australia.com?subject=Hub%20Pack%20for%20our%20clinic"
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors shadow-md"
            >
              Talk to Zac about the Hub Pack for your clinic
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
