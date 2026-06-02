import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProspectLanding, AccessWall } from '@/components/prospect/ProspectLanding'
import { getClinicBySlug } from '@/lib/prospect/repo'

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
      ? `Working preview portal for ${clinic.name}, ${clinic.city} ${clinic.state}.`
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

  return <ProspectLanding clinic={clinic} />
}
