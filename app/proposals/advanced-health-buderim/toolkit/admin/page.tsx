import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Lock, ArrowRight } from 'lucide-react'
import { ToolkitSidebar } from '../_sidebar'

const ACCESS_KEY = 'ah2026'

export const metadata: Metadata = {
  title: 'Admin Workflow — Advanced Health Hub Preview',
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <Link
            href={`/proposals/advanced-health-buderim/toolkit?k=${ACCESS_KEY}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to toolkit
          </Link>

          <div className="glass-premium rounded-2xl p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-700 mb-2">
              Hub Program content
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
              Front-Desk Micro-Course
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-lg mx-auto">
              Eight modules of non-clinical training for reception &amp; administration staff — concussion recognition, phone triage, red flags, intake form additions, AI-safe documentation, the template library, concussion-priority booking, and a knowledge check with a digital completion certificate.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Activates for {`{clinic_name}`}&rsquo;s reception team once the Hub Program is in place.
            </p>
            <Link
              href={`/proposals/advanced-health-buderim?k=${ACCESS_KEY}#pricing`}
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors shadow-md"
            >
              See Hub Program pricing
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
