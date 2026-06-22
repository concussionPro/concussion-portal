/**
 * GET /demo/sst — clean one-link entry point for the SST Trainer app.
 *
 * A clinic opens ONE human-readable link —
 *   portal.concussion-education-australia.com/demo/sst
 * — which sets the demo_key cookie server-side (the key NEVER appears in the
 * URL) and drops them straight into the gated app at /platform/app. From there
 * they can install it to the home screen (PWA) and use it.
 *
 * Same cookie mechanics as /demo/heidi; the key comes from DEMO_KEY
 * (lib/demo-key.ts), which falls back to a committed constant so the link works
 * WITHOUT any Vercel env var during the pre-launch review period. The route
 * group stays gated + noindex (app/platform/layout.tsx) — this just hands the
 * visitor the access cookie. Zac flips the gate at launch.
 */
import { NextRequest, NextResponse } from 'next/server'
import { DEMO_KEY } from '@/lib/demo-key'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const dest = new URL('/platform/app', request.url)
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
