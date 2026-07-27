/**
 * GET /demo/clinic — the CLINICIAN WORKSPACE demo (owner 2026-07-27: the tool
 * lives in the Clinical Testing tab of the portal dash — THAT is the demo, not
 * the standalone keyed hub). Sets the demo cookie and lands on
 * /clinical-testing, which renders the DEMO00 clinic: code card, patient link,
 * Gensolve connection (demo state), invites (demo), embedded trainer, and the
 * live hub one click away.
 */
import { NextRequest, NextResponse } from 'next/server'
import { DEMO_KEY } from '@/lib/demo-key'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const dest = new URL('/clinical-testing', request.url)
  const res = NextResponse.redirect(dest)
  res.cookies.set('demo_key', DEMO_KEY, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  })
  return res
}
