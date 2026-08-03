import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /trainer — the clean alumni link (owner, 2026-08-03): routes a signed-in
 * user straight to their unlocked Clinical Testing dash; a signed-out user
 * goes via magic-link login and lands in the same place. Exists because a raw
 * /clinical-testing link sends session-less visitors to the DEMO door — wrong
 * destination for an email telling alumni their own tools are live.
 */
export function GET(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get('session')?.value)
  const dest = hasSession
    ? new URL('/clinical-testing', req.url)
    : new URL('/login?redirect=%2Fclinical-testing', req.url)
  return NextResponse.redirect(dest, 307)
}
