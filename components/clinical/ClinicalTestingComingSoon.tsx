'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { FlaskConical } from 'lucide-react'

/**
 * Pre-release holding page for /clinical-testing/* (owner directive
 * 2026-07-05): the suite is subscription-bound and unreleased — every
 * non-owner (paid included) landing here by URL gets this, never the tools.
 */
export function ClinicalTestingComingSoon() {
  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
        <div className="mx-auto max-w-xl">
          <div className="glass-premium rounded-2xl p-8 sm:p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-accent/20 bg-accent/10">
              <FlaskConical className="h-5 w-5 text-accent" />
            </div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
              Included with enrolment
            </p>
            <h1 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Clinical Testing suite
            </h1>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              Measured-threshold exercise rehab and club baseline testing are included with your CCM
              or CRM enrolment. You&rsquo;ll see them here once your enrolment is active.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
