import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'
import { getClinic, normaliseClinicCode } from '@/lib/sst-trainer/clinic-registry'

/**
 * GET /api/sst/validate-code?code=X
 *
 * Public clinic-code validation for the SST Trainer onboarding gate — the app
 * shell is public but the graded test is unreachable without a registered
 * clinic code, and this is where onboarding checks it.
 *
 * CONTRACT (consumed by the onboarding workstream — do not change):
 *   200 { valid: boolean, clinicName?: string }
 *
 * Rate-limited per IP so the 6-char code space can't be enumerated. Wrong /
 * unknown codes are still HTTP 200 with { valid: false } — the app treats it
 * as a form-validation result, not an error.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = await rateLimit({ key: `sst-validate:${ip}`, limit: 30, windowSec: 60 })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const code = normaliseClinicCode(request.nextUrl.searchParams.get('code'))
  if (!code) {
    return NextResponse.json({ valid: false })
  }

  const clinic = await getClinic(code) // fails closed (null) on KV errors
  if (!clinic) {
    return NextResponse.json({ valid: false })
  }
  return NextResponse.json({ valid: true, clinicName: clinic.clinicName })
}
