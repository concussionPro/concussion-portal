import { NextRequest, NextResponse } from 'next/server'
import { CLINIC_DEMO_KEY } from '@/lib/demo-key'

/**
 * /demo/clinic — the supplier-prospect demo entry (the /acc CTA).
 *
 * Sets the scoped clinic_demo cookie and lands the visitor in the REAL
 * portal at the Clinical Testing tab (owner 2026-07-27: "the tool lives in
 * clinical testing tab of the portal dash — that should be the demo… let
 * them browse and use the tools with everything else locked out but
 * viewable"). The cookie mints a synthetic PREVIEW session portal-wide
 * (see /api/auth/session): tools usable in demo mode, CCM/CRM visible but
 * locked, Module 1 trial + free courses open. No email, no login.
 *
 * NEVER the reviewer DEMO_KEY — that cookie opens paid course content and
 * is not for prospects.
 */
export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/clinical-testing', req.url))
  res.cookies.set('clinic_demo', CLINIC_DEMO_KEY, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 90 * 24 * 60 * 60,
    path: '/',
  })
  return res
}
