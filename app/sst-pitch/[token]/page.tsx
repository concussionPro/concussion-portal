import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { SstProspectLanding } from '@/components/prospect/SstProspectLanding'
import { getClinicBySlug, recordPortalView } from '@/lib/prospect/repo'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string; utm_source?: string; utm_campaign?: string; utm_term?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  // SST outreach has not begun — keep the portal generic + noindex behind the wall.
  return {
    title: 'SST Trainer — clinician preview',
    description: 'Private preview portal.',
    robots: 'noindex, nofollow',
  }
}

export default async function SstProspectPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { utm_source, utm_campaign, utm_term } = await searchParams

  const clinic = await getClinicBySlug(token)
  if (!clinic) notFound()

  // Engagement signal — fire-and-forget, tagged as the SST lane so SST portal
  // views never mix into the course engine's funnel numbers.
  const h = await headers()
  const userAgent = h.get('user-agent') ?? undefined
  const forwarded = h.get('x-forwarded-for') ?? undefined
  const viewerIp = forwarded?.split(',')[0]?.trim()
  recordPortalView({
    clinicId: clinic.id,
    viewerIp,
    userAgent,
    section: 'sst-landing',
    utmSource: utm_source ?? 'sst_outreach',
    utmCampaign: utm_campaign ?? 'sst_prospect_portal',
    utmTerm: utm_term ?? clinic.slug,
  }).catch((err) => console.error('[SST portal view tracking failed]', err))

  return <SstProspectLanding clinic={clinic} />
}
