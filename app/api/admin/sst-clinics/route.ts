import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { listSstClinics } from '@/lib/sst-trainer/clinic-registry'
import { CONFIG } from '@/lib/config'

/**
 * GET /api/admin/sst-clinics
 *
 * Admin listing of self-serve-provisioned SST Trainer clinics (Postgres
 * `sst_clinics` mirror of the KV clinic registry). Includes each clinic's
 * private Clinical Hub link (code + viewKey) so Zac can re-send a lost key —
 * admin-only surface, guarded by isAdminRequest like every /api/admin/* route.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.APP_URL
    const clinics = (await listSstClinics()).map((c) => ({
      code: c.code,
      clinicName: c.clinicName,
      contactName: c.contactName,
      email: c.email,
      createdAt: c.createdAt,
      viewKey: c.viewKey,
      hubLink: `${baseUrl}/clinical-hub?clinic=${encodeURIComponent(c.code)}&k=${encodeURIComponent(c.viewKey)}`,
      patientLink: `${baseUrl}/sst-trainer?clinic=${encodeURIComponent(c.code)}`,
    }))

    return NextResponse.json({ success: true, clinics, totalClinics: clinics.length })
  } catch (error) {
    console.error('Admin sst-clinics API error:', error)
    return NextResponse.json({ error: 'Failed to load SST clinics' }, { status: 500 })
  }
}
