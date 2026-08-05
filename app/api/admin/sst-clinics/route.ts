import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { listSstClinics } from '@/lib/sst-trainer/clinic-registry'
import { CONFIG } from '@/lib/config'

/**
 * GET /api/admin/sst-clinics            → directory (NO keys)
 * GET /api/admin/sst-clinics?code=ABC123 → ONE clinic, WITH its viewKey + hub link
 *
 * Admin listing of self-serve-provisioned SST Trainer clinics (Postgres
 * `sst_clinics` mirror of the KV clinic registry). Guarded by isAdminRequest
 * like every /api/admin/* route.
 *
 * The bulk response used to carry every clinic's `viewKey` and a fully
 * assembled `hubLink` — each of those URLs reads that clinic's Clinical Hub,
 * with patient-level data, and needs no further auth. One response therefore
 * handed over a key to every clinic's records at once, and anything that
 * touched it (a log line, a proxy cache, an admin browser's network tab, a
 * screenshot) leaked the lot. Keys are now retrieved ONE CLINIC AT A TIME by
 * code, which is all the "re-send a lost key" workflow ever needed.
 *
 * `patientLink` stays in the directory: it carries no key and is the public
 * onboarding URL the clinic hands to patients.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.APP_URL
    const requestedCode = request.nextUrl.searchParams.get('code')?.trim()
    const clinics = await listSstClinics()

    if (requestedCode) {
      const clinic = clinics.find((c) => c.code.toUpperCase() === requestedCode.toUpperCase())
      if (!clinic) {
        return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        clinic: {
          code: clinic.code,
          clinicName: clinic.clinicName,
          contactName: clinic.contactName,
          email: clinic.email,
          createdAt: clinic.createdAt,
          viewKey: clinic.viewKey,
          hubLink: `${baseUrl}/clinical-hub?clinic=${encodeURIComponent(clinic.code)}&k=${encodeURIComponent(clinic.viewKey)}`,
          patientLink: `${baseUrl}/sst-trainer?clinic=${encodeURIComponent(clinic.code)}`,
        },
      })
    }

    // Directory — deliberately key-free.
    const directory = clinics.map((c) => ({
      code: c.code,
      clinicName: c.clinicName,
      contactName: c.contactName,
      email: c.email,
      createdAt: c.createdAt,
      patientLink: `${baseUrl}/sst-trainer?clinic=${encodeURIComponent(c.code)}`,
    }))

    return NextResponse.json({ success: true, clinics: directory, totalClinics: directory.length })
  } catch (error) {
    console.error('Admin sst-clinics API error:', error)
    return NextResponse.json({ error: 'Failed to load SST clinics' }, { status: 500 })
  }
}
