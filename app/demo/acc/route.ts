/**
 * GET /demo/acc — clean, shareable demo link for ACC Concussion Services
 * pitches: renders the ACC884 Client Summary Report from the DEMO00 fixture
 * episode (lib/sst-trainer/reports/load.ts). Mirrors /demo/essa's pattern but
 * needs NO cookie — DEMO00 is the keyless public demo clinic (verifyViewKey
 * passes it by design), so a bare redirect is the whole route.
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const dest = new URL(
    '/api/sst/report?code=DEMO00&patient=Demo%20Patient&skin=acc884&first=Alex&last=Demo&claim=AB12345&clinician=Reviewing%20Clinician',
    request.url,
  )
  return NextResponse.redirect(dest)
}
