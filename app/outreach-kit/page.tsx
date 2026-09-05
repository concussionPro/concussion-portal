import { redirect } from 'next/navigation'
import { Lock, ArrowRight } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { SessionProvider } from '@/contexts/SessionContext'
import { OutreachToolkitDoc } from '@/components/toolkit/OutreachToolkitDoc'
import { DownloadButton } from '@/components/toolkit/DownloadButton'
import { resolveToolkitPageAccess } from '@/lib/toolkit-access'
import { CONFIG } from '@/lib/config'

/**
 * SERVER component — entitlement resolves before render so the six paid
 * outreach templates only ever travel in the RSC payload of an entitled
 * request (the previous 'use client' page compiled the full template set
 * into a public static chunk and gated by render only). OutreachToolkitDoc
 * stays a client leaf and receives the data as props.
 */
export default async function OutreachKitPage() {
  const access = await resolveToolkitPageAccess()

  if (access === 'unauthenticated') {
    redirect('/login?redirect=%2Foutreach-kit')
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
                  Paid course content
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
                  Outreach Kit
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-lg mx-auto">
                  Six referral-building outreach templates — School, Sports Club Coach, GP, AFL/Rugby/Football, Netball/Basketball/Cricket, plus a capability one-pager. Each with a follow-up schedule and AHPRA advertising compliance notes.
                </p>
                <div className="mx-auto mb-5 grid max-w-md grid-cols-2 gap-2 text-left">
                  {['School', 'Sports Club Coach', 'GP', 'AFL / Rugby / Football', 'Netball / Basketball / Cricket', 'Capability one-pager'].map((t) => (
                    <div key={t} className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-[11.5px] font-semibold text-slate-400">
                      {t}
                      <span className="mt-0.5 block text-[9px] font-normal">letter + follow-up schedule · AHPRA notes</span>
                    </div>
                  ))}
                </div>
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
  const { OUTREACH_TEMPLATES } = await import('@/data/hub-program-content')

  return (
    <SessionProvider>
      <div className="flex min-h-screen dashboard-bg print:bg-white print:min-h-0">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 print:ml-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 print:py-0 print:px-8 print:max-w-none">
            <div className="print:hidden flex items-center justify-end mb-4">
              <DownloadButton kit="outreach" label="Download Outreach Kit (ZIP)" />
            </div>
            <OutreachToolkitDoc templates={OUTREACH_TEMPLATES} />
          </div>
        </main>
      </div>
    </SessionProvider>
  )
}
