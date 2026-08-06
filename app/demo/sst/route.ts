/**
 * GET /demo/sst — legacy one-link entry point for the SST Trainer app.
 *
 * /sst-trainer is now PUBLIC (clinic-code gate lives IN the app flow), so this
 * route is just a clean redirect that PRESERVES the query string —
 *   /demo/sst?clinic=CODE  →  /sst-trainer?clinic=CODE
 * — so QR cards / links printed against the old URL keep working, code intact.
 *
 * It still sets the demo_key cookie (same mechanics as /demo/heidi; key from
 * DEMO_KEY in lib/demo-key.ts). The SST app itself no longer needs it, but the
 * cookie is harmless and keeps /platform/* demo access working for anyone who
 * entered through this link during the review period.
 */
import { NextRequest, NextResponse } from 'next/server'
import { DEMO_KEY } from '@/lib/demo-key'
import { isPrefetchRequest } from '@/lib/prefetch-guard'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // A prefetch must never GRANT anything. Scrolling a public page into
  // view prefetches this link, and this route hands out access.
  // See lib/prefetch-guard.ts.
  if (isPrefetchRequest(request)) {
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  }

  // Land on /sst-trainer, NOT /platform/app: the global Permissions-Policy
  // blocks camera on /platform/app (camera=()), while /sst-trainer has the
  // camera=(self) + bluetooth=(self) carve-out AND the PWA manifest/service
  // worker — camera-PPG and install-to-home-screen only work there. Verified
  // against production headers 2026-07-02.
  const dest = new URL('/sst-trainer', request.url)
  dest.search = request.nextUrl.search // preserve ?clinic=CODE etc.
  const res = NextResponse.redirect(dest)
  res.cookies.set('demo_key', DEMO_KEY, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90, // 90 days
  })
  return res
}
