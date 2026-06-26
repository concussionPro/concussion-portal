import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { ProspectLanding } from '@/components/prospect/ProspectLanding'
import { TotumLanding } from '@/components/prospect/TotumLanding'
import { getClinicBySlug, recordPortalView } from '@/lib/prospect/repo'
import { accessKeyMatches } from '@/lib/prospect/access-key'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string; utm_source?: string; utm_campaign?: string; utm_term?: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { token } = await params
  const { k } = await searchParams
  // Bespoke hand-built prospect page — not a DB-driven clinic row.
  if (token === 'totum-life-science') {
    return {
      title: 'Concussion Hub Program — Totum Life Science',
      description: 'Private proposal portal.',
      robots: 'noindex, nofollow',
    }
  }
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
  const { utm_source, utm_campaign, utm_term } = await searchParams

  // Bespoke hand-built prospect page — checked BEFORE the DB lookup so it
  // renders regardless of whether a clinic row exists. Canada-specific pitch.
  if (token === 'totum-life-science') {
    return <TotumLanding />
  }

  const clinic = await getClinicBySlug(token)
  if (!clinic) notFound()

  // Clean per-clinic URL (Zac 2026-06-11): cold emails link to /p/<slug> with
  // NO access key — a clean path is what passes spam filters (the ?k= random
  // key + UTM params are the sandbox-detonation profile). So the portal renders
  // for any valid clinic slug; this is non-sensitive marketing content (free
  // tools + course pitch), and the slug is the clinic's own name. The key is
  // still honoured when present (legacy links) but no longer required.

  // Engagement signal — fire-and-forget. Failures don't block the render.
  const h = await headers()
  const userAgent = h.get('user-agent') ?? undefined
  const forwarded = h.get('x-forwarded-for') ?? undefined
  const viewerIp = forwarded?.split(',')[0]?.trim()
  // UTM attribution (Zac 2026-06-16): cold emails link to a CLEAN /p/<slug>
  // with NO query string — query params are the Defender/Gmail sandbox-
  // detonation profile, so we never put utm_* in the email. But the slug
  // arrival itself IS the attribution: reaching a prospect portal means the
  // cold-outreach email. So default the source/campaign SERVER-SIDE when the
  // request carries no UTM — full attribution feeds portal analytics with zero
  // spam-triggering query string. Explicit utm_* (legacy/other channels) win.
  recordPortalView({
    clinicId: clinic.id,
    viewerIp,
    userAgent,
    section: 'landing',
    utmSource: utm_source ?? 'cold_outreach',
    utmCampaign: utm_campaign ?? 'prospect_portal_email',
    utmTerm: utm_term ?? clinic.slug,
  }).catch((err) => console.error('[Portal view tracking failed]', err))

  return <ProspectLanding clinic={clinic} />
}
