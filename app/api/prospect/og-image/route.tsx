/**
 * GET /api/prospect/og-image?slug=<slug>
 *
 * Returns a real screenshot of the prospect's live dashboard page (not a
 * synthetic mock). Uses Microlink's screenshot API to render `/p/<slug>?k=<key>`
 * in a headless browser at desktop viewport and stream the PNG back.
 *
 * Cached at the Vercel CDN for 24h (cache-control: public, max-age=86400).
 * Gmail's image proxy caches by URL — mergeTemplate appends ?v=<deploy-sha>
 * so the URL bumps once per deploy and clears stale entries.
 */
import { NextRequest } from 'next/server'
import { getClinicBySlug } from '@/lib/prospect/repo'

export const runtime = 'edge'

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.concussion-education-australia.com'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')
  if (!slug) {
    return new Response('slug required', { status: 400 })
  }

  let portalUrl: string
  try {
    const clinic = await getClinicBySlug(slug)
    if (!clinic) {
      return new Response(`clinic not found: ${slug}`, { status: 404 })
    }
    portalUrl = `${APP_URL}/p/${clinic.slug}?k=${clinic.accessKey}`
  } catch (err) {
    return new Response(`db error: ${err instanceof Error ? err.message : String(err)}`, { status: 500 })
  }

  // Microlink screenshot API — free tier, no auth, ~2-4s per screenshot.
  // Returns 302 → CDN-cached image. Fetch and stream the bytes back.
  //
  // Lightweight config: 1200x630 viewport (matches the embedded display
  // size of 548x288, ~2x retina cap), deviceScaleFactor 1 (no retina
  // inflation), JPEG instead of PNG (3-5x smaller for screenshots),
  // quality 80 (visually indistinguishable for thumbnails). Target: <200KB.
  const microlinkUrl = new URL('https://api.microlink.io/')
  microlinkUrl.searchParams.set('url', portalUrl)
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
