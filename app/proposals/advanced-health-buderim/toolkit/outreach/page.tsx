import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ToolkitSidebar } from '../_sidebar'
import { OUTREACH_TEMPLATES, OUTREACH_TEMPLATE_COUNT } from '@/data/hub-program-content'
import { OutreachToolkitDoc } from '@/components/toolkit/OutreachToolkitDoc'

const ACCESS_KEY = 'ah2026'

export const metadata: Metadata = {
  title: 'Outreach Kit — Advanced Health Hub Preview',
  description: `${OUTREACH_TEMPLATE_COUNT} referral-building outreach templates for schools, clubs, GPs.`,
  robots: 'noindex, nofollow',
}

export default async function OutreachKitPage({
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
    <div className="flex min-h-screen dashboard-bg print:bg-white print:min-h-0">
      <ToolkitSidebar active="outreach" />
      <main className="flex-1 ml-0 md:ml-64 print:ml-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 print:py-0 print:px-8 print:max-w-none">
          <Link
            href={`/proposals/advanced-health-buderim/toolkit?k=${ACCESS_KEY}`}
            className="print:hidden inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to toolkit
          </Link>

          <OutreachToolkitDoc
            templates={OUTREACH_TEMPLATES}
            previewedSlugs={['generic-capability-one-pager']}
            previewSectionLimit={0}
            unlockHref={`/proposals/advanced-health-buderim?k=${ACCESS_KEY}#pricing`}
            defaultValues={{
              clinic_name: 'Advanced Health Pain & Injury Clinic',
              clinic_phone: '07 5456 2836',
              clinic_address: 'Buderim QLD',
              region: 'Sunshine Coast',
            }}
          />
        </div>
      </main>
    </div>
  )
}
