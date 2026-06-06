import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ToolkitSidebar } from '../_sidebar'
import { ProspectTracker } from '@/components/prospect/ProspectTracker'
import { AccessWall } from '@/components/prospect/ProspectLanding'
import { DISCHARGE_TEMPLATES, DOCUMENTATION_PRINCIPLES } from '@/data/hub-program-content'
import { ClinicalToolkitDoc } from '@/components/toolkit/ClinicalToolkitDoc'
import { getClinicBySlug } from '@/lib/prospect/repo'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const clinic = await getClinicBySlug(token)
  return {
    title: clinic ? `Clinical Toolkit — ${clinic.shortName}` : 'Clinical Toolkit',
    description: 'Six concussion discharge and handover templates — AHPRA-aligned, fillable, pre-branded for the prospect clinic.',
    robots: 'noindex, nofollow',
  }
}

export default async function ClinicalToolkitPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { k } = await searchParams
  const clinic = await getClinicBySlug(token)
  if (!clinic) notFound()
  if (k !== clinic.accessKey) return <AccessWall clinicName={clinic.name} />

  const accessKey = clinic.accessKey
  const baseHref = `/p/${clinic.slug}`
  const cityKnown = clinic.city && !/unknown/i.test(clinic.city)

  return (
    <div className="flex min-h-screen dashboard-bg print:bg-white print:min-h-0">
      <ProspectTracker token={clinic.slug} accessKey={clinic.accessKey} />
      <ToolkitSidebar clinic={clinic} active="clinical" />
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

          <div data-track-section="toolkit-clinical">
            {/* Preview policy:
                  - Show 3 of 6 templates IN FULL so prospects see the
                    branding land in real content (clinic.name flows into
                    every {clinic_name} field via FillableDoc defaultValues)
                  - Lock 3 templates as teaser cards — keeps the "unlock with
                    Hub Program" tension visible
                  - FillableDoc previewMode (auto-on because previewedSlugs
                    is an array) blocks print/PDF via the global @media print
                    CSS injected by PreviewPrintBlock
                  - Download API (`/api/toolkit/download`) rejects dynamic
                    per-clinic access keys (allow-list contains only 'ah2026')
            */}
            <ClinicalToolkitDoc
              templates={DISCHARGE_TEMPLATES}
              principles={DOCUMENTATION_PRINCIPLES}
              previewedSlugs={[
                'gp-handover-letter',
                'school-rtp-authorisation',
                'parent-symptom-management-plan',
              ]}
              unlockHref={`${baseHref}?k=${accessKey}#pricing`}
              defaultValues={{
                clinic_name: clinic.name,
                clinic_short_name: clinic.shortName,
                ...(cityKnown ? { clinic_address: `${clinic.city} ${clinic.state}` } : {}),
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
