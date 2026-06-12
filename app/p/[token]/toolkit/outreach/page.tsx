import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ToolkitSidebar } from '../_sidebar'
import { ProspectTracker } from '@/components/prospect/ProspectTracker'
import { TalkToZacFooter } from '@/components/prospect/TalkToZacFooter'
import { OUTREACH_TEMPLATES } from '@/data/hub-program-content'
import { OutreachToolkitDoc } from '@/components/toolkit/OutreachToolkitDoc'
import { getClinicBySlug } from '@/lib/prospect/repo'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const clinic = await getClinicBySlug(token)
  return {
    title: clinic ? `Outreach Kit — ${clinic.shortName}` : 'Outreach Kit',
    description: 'Six referral-building outreach templates — pre-branded for the prospect clinic.',
    robots: 'noindex, nofollow',
  }
}

export default async function OutreachKitPage({ params, searchParams }: PageProps) {
  const { token } = await params
  await searchParams
  const clinic = await getClinicBySlug(token)
  if (!clinic) notFound()
  // Keyless per-clinic URL (Zac 2026-06-11): cold emails link to /p/<slug>
  // with NO access key. This is non-sensitive marketing content, so any valid
  // clinic slug renders. The key is honoured when present (legacy links) but
  // no longer required.

  const accessKey = clinic.accessKey
  const baseHref = `/p/${clinic.slug}`
  const cityKnown = clinic.city && !/unknown/i.test(clinic.city)
  const regionKnown = clinic.region && !/unknown/i.test(clinic.region)

  return (
    <div className="flex min-h-screen dashboard-bg print:bg-white print:min-h-0">
      <ProspectTracker token={clinic.slug} accessKey={clinic.accessKey} />
      <ToolkitSidebar clinic={clinic} active="outreach" />
      <main className="flex-1 ml-0 md:ml-64 print:ml-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 print:py-0 print:px-8 print:max-w-none">
          <Link
            href={`${baseHref}/toolkit?k=${accessKey}`}
            data-track-cta="toolkit-back-to-launcher"
            className="print:hidden inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to toolkit
          </Link>

          <div data-track-section="toolkit-outreach">
            {/* Same preview policy as clinical — 3 of 6 visible in full,
                3 locked. Print blocked. Download API blocked. */}
            <OutreachToolkitDoc
              templates={OUTREACH_TEMPLATES}
              previewedSlugs={[
                'generic-capability-one-pager',
                'gp-practice-referral-letter',
                'school-introduction-letter',
              ]}
              unlockHref={`${baseHref}?k=${accessKey}#pricing`}
              defaultValues={{
                clinic_name: clinic.name,
                clinic_short_name: clinic.shortName,
                ...(cityKnown ? { clinic_address: `${clinic.city} ${clinic.state}` } : {}),
                ...(regionKnown ? { region: clinic.region } : {}),
              }}
            />
          </div>
          <div className="h-20 print:hidden" />
        </div>
      </main>
      <TalkToZacFooter clinicShortName={clinic.shortName} context="outreach-kit" />
    </div>
  )
}
