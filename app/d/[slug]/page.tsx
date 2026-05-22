import { redirect, notFound } from 'next/navigation'
import { lookupSlug, resolveKeyForSlug } from '@/lib/ai-course/demo-slugs'

interface PageParams {
  params: Promise<{ slug: string }>
}

/**
 * Short-URL demo access. `/d/<slug>` resolves the slug to the partner's
 * configured demo key, redirects to the NDA page with the key + a
 * pre-filled organisation suggestion. Lets you share a clean URL like
 * portal.cea.com/d/heidi without exposing the underlying secret to chat
 * history.
 *
 * If the slug is unknown or no env key is configured, 404s — better than
 * returning a half-broken NDA page.
 */
export default async function ShortDemoLink({ params }: PageParams) {
  const { slug } = await params
  const meta = lookupSlug(slug)
  if (!meta) notFound()

  const key = resolveKeyForSlug(slug)
  if (!key) notFound()

  const qs = new URLSearchParams({
    key,
    org: meta.suggestedOrg,
    ...(meta.suggestedDisplayName ? { name: meta.suggestedDisplayName } : {}),
  })
  redirect(`/courses/demo-access?${qs.toString()}`)
}
