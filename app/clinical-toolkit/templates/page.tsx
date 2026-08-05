import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Lock, ArrowLeft, ArrowRight } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { SessionProvider } from '@/contexts/SessionContext'
import { ClinicalToolkitDoc } from '@/components/toolkit/ClinicalToolkitDoc'
import { DownloadButton } from '@/components/toolkit/DownloadButton'
import { resolveToolkitPageAccess } from '@/lib/toolkit-access'
import { CONFIG } from '@/lib/config'
import { DISCHARGE_TEMPLATE_COUNT } from '@/data/hub-program-content'

/**
 * SERVER component — entitlement resolves before render so the paid
 * discharge templates only ever travel in the RSC payload of an entitled
 * request (the previous 'use client' page compiled the full template set
 * into a public static chunk and gated by render only). ClinicalToolkitDoc
 * stays a client leaf and receives the data as props.
 */
export default async function ClinicalTemplatesPage() {
  const access = await resolveToolkitPageAccess()

  if (access === 'unauthenticated') {
    redirect('/login?redirect=%2Fclinical-toolkit%2Ftemplates')
  }

  if (access === 'locked') {
    return (
      <SessionProvider>
        <div className="flex min-h-screen dashboard-bg">
          <Sidebar />
          <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
            <div className="max-w-2xl mx-auto">
              <Link
                href="/clinical-toolkit"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Clinical Toolkit
              </Link>
              <div className="glass-premium rounded-2xl p-8 sm:p-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-700 mb-2">
                  Paid course content
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
                  Interactive Fillable Templates
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-lg mx-auto">
                  {DISCHARGE_TEMPLATE_COUNT} AHPRA-aligned discharge templates — GP handover, school RTP authorisation, parent symptom plan, sports club RTP certificate, WorkCover report, NDIS allied-health report, ACC884 client summary and medicolegal record. Fillable on screen, sign-off block built in, exports to a clean PDF on your clinic letterhead.
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
  const { DISCHARGE_TEMPLATES, DOCUMENTATION_PRINCIPLES } = await import('@/data/hub-program-content')

  return (
    <SessionProvider>
      <div className="flex min-h-screen dashboard-bg print:bg-white print:min-h-0">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 print:ml-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 print:py-0 print:px-8 print:max-w-none">
            <div className="print:hidden flex items-center justify-between gap-3 mb-4">
              <Link
                href="/clinical-toolkit"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Clinical Toolkit
              </Link>
              <DownloadButton kit="clinical" label="Download Clinical Toolkit (ZIP)" />
            </div>
            <ClinicalToolkitDoc templates={DISCHARGE_TEMPLATES} principles={DOCUMENTATION_PRINCIPLES} />
          </div>
        </main>
      </div>
    </SessionProvider>
  )
}
