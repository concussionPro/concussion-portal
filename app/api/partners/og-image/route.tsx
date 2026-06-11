/**
 * GET /api/partners/og-image?slug=<slug>
 *
 * Returns a real screenshot of an institution's live partner page
 * (`/partners/<slug>`) so the partnership email can lead with the same
 * "here's what it looks like for you" hook the clinic engine uses.
 *
 * Mirrors app/api/prospect/og-image/route.tsx exactly, but renders the
 * partner page instead of the clinic portal. Isolated — does not import
 * or touch the cold-clinic engine.
 *
 * Cached at the Vercel CDN for 24h.
 */
import { NextRequest } from 'next/server'
import { getPartnerBySlug } from '@/lib/partners/repo'

export const runtime = 'edge'

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.concussion-education-australia.com'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')
  if (!slug) {
    return new Response('slug required', { status: 400 })
  }

  let pageUrl: string
  try {
    const partner = await getPartnerBySlug(slug)
    if (!partner) {
      return new Response(`institution not found: ${slug}`, { status: 404 })
    }
    pageUrl = `${APP_URL}/partners/${partner.slug}`
  } catch (err) {
    return new Response(`db error: ${err instanceof Error ? err.message : String(err)}`, { status: 500 })
  }

  // Microlink screenshot API — free tier, no auth. 1200x630 viewport,
  // deviceScaleFactor 1, JPEG quality default. Returns 302 → CDN image;
  // fetch and stream the bytes back.
  const microlinkUrl = new URL('https://api.microlink.io/')
  microlinkUrl.searchParams.set('url', pageUrl)
  microlinkUrl.searchParams.set('screenshot', 'true')
  microlinkUrl.searchParams.set('embed', 'screenshot.url')
  microlinkUrl.searchParams.set('viewport.width', '1200')
  microlinkUrl.searchParams.set('viewport.height', '630')
  microlinkUrl.searchParams.set('viewport.deviceScaleFactor', '1')
  microlinkUrl.searchParams.set('waitForTimeout', '2000')
  microlinkUrl.searchParams.set('meta', 'false')
  microlinkUrl.searchParams.set('type', 'jpeg')

  try {
    const res = await fetch(microlinkUrl.toString(), { redirect: 'follow' })
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => '')
      return new Response(`microlink ${res.status}: ${detail.slice(0, 500)}`, { status: 502 })
    }
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    return new Response(res.body, {
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(`fetch failed: ${message}`, { status: 502 })
  }
}
