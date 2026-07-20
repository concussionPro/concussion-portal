import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { EpProspectLanding } from '@/components/prospect/EpProspectLanding'
import { getClinicBySlug, recordPortalView } from '@/lib/prospect/repo'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string; utm_source?: string; utm_campaign?: string; utm_term?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  // EP/ESSA outreach is hard-blocked until ESSA approval — keep generic + noindex.
  return {
    title: 'Concussion Rehab Mastery — clinician preview',
    description: 'Private preview portal.',
    robots: 'noindex, nofollow',
  }
}

export default async function EpProspectPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { utm_source, utm_campaign, utm_term } = await searchParams

  const clinic = await getClinicBySlug(token)
  if (!clinic) notFound()

  // Engagement signal — tagged as the EP lane so EP portal views never mix into
  // the CCM course engine's funnel numbers.
  const h = await headers()
  const userAgent = h.get('user-agent') ?? undefined
  const forwarded = h.get('x-forwarded-for') ?? undefined
  const viewerIp = forwarded?.split(',')[0]?.trim()
  recordPortalView({
    clinicId: clinic.id,
    viewerIp,
    userAgent,
    section: 'ep-landing',
    utmSource: utm_source ?? 'ep_outreach',
    utmCampaign: utm_campaign ?? 'ep_prospect_portal',
    utmTerm: utm_term ?? clinic.slug,
  }).catch((err) => console.error('[EP portal view tracking failed]', err))

  return <EpProspectLanding clinic={clinic} />
}
