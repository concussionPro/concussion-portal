import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { ProspectLanding, AccessWall } from '@/components/prospect/ProspectLanding'
import { getClinicBySlug, recordPortalView } from '@/lib/prospect/repo'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const clinic = await getClinicBySlug(token)
  return {
    title: clinic ? `Concussion Hub Program — ${clinic.shortName}` : 'Concussion Hub Program',
    description: clinic
      ? (clinic.city && !/unknown/i.test(clinic.city)
          ? `Working preview portal for ${clinic.name}, ${clinic.city} ${clinic.state}.`
          : `Working preview portal for ${clinic.name}.`)
      : 'Private proposal portal.',
    robots: 'noindex, nofollow',
  }
}

export default async function ProspectPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { k } = await searchParams

  const clinic = await getClinicBySlug(token)
  if (!clinic) notFound()

  if (k !== clinic.accessKey) {
    return <AccessWall clinicName={clinic.name} />
  }

  // Engagement signal — fire-and-forget. Failures don't block the render.
  const h = await headers()
  const userAgent = h.get('user-agent') ?? undefined
  const forwarded = h.get('x-forwarded-for') ?? undefined
  const viewerIp = forwarded?.split(',')[0]?.trim()
  recordPortalView({
    clinicId: clinic.id,
    viewerIp,
    userAgent,
    section: 'landing',
  }).catch((err) => console.error('[Portal view tracking failed]', err))

  return <ProspectLanding clinic={clinic} />
}
