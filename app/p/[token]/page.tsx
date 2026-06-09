import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { ProspectLanding, AccessWall } from '@/components/prospect/ProspectLanding'
import { getClinicBySlug, recordPortalView } from '@/lib/prospect/repo'
import { accessKeyMatches } from '@/lib/prospect/access-key'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { token } = await params
  const { k } = await searchParams
  const clinic = await getClinicBySlug(token)
  // Don't leak clinic name/city to visitors without the access key — the
  // slug alone is guessable, metadata must stay generic behind the wall.
  if (!clinic || !accessKeyMatches(k, clinic)) {
    return {
      title: 'Concussion Hub Program',
      description: 'Private proposal portal.',
      robots: 'noindex, nofollow',
    }
  }
  return {
    title: `Concussion Hub Program — ${clinic.shortName}`,
    description:
      clinic.city && !/unknown/i.test(clinic.city)
        ? `Working preview portal for ${clinic.name}, ${clinic.city} ${clinic.state}.`
        : `Working preview portal for ${clinic.name}.`,
    robots: 'noindex, nofollow',
  }
}

export default async function ProspectPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { k } = await searchParams

  const clinic = await getClinicBySlug(token)
  if (!clinic) notFound()

  // Stored access_key (random for new prospects); legacy slug-derived value
  // only when the stored key is missing — see lib/prospect/access-key.ts.
  if (!accessKeyMatches(k, clinic)) {
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
