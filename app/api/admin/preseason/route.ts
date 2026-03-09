import { NextRequest, NextResponse } from 'next/server'
import { list as listBlobs } from '@vercel/blob'

function isAdminAuthorized(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey && adminKey === process.env.ADMIN_API_KEY) return true
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === process.env.ADMIN_API_KEY) return true
  return false
}

interface ClinicRegistration {
  clinicName: string
  contactName: string
  email: string
  code: string
  createdAt: string
}

interface BaselineSubmission {
  clinicCode: string
  submittedAt: string
  athleteName?: string
}

/**
 * GET /api/admin/preseason
 * Returns preseason clinic registrations and baseline submission data.
 * Reads from Blob storage (preseason-clinics.json, preseason-baselines.json).
 */
export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { blobs } = await listBlobs()

    let clinics: ClinicRegistration[] = []
    let baselines: BaselineSubmission[] = []

    // Load clinics data
    const clinicBlobs = blobs
      .filter(b => b.pathname === 'preseason-clinics.json')
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    if (clinicBlobs.length > 0) {
      try {
        const res = await fetch(`${clinicBlobs[0].url}?t=${Date.now()}`, { cache: 'no-store' })
        clinics = await res.json()
      } catch (err) {
        console.warn('Failed to load preseason clinics:', err)
      }
    }

    // Load baselines data
    const baselineBlobs = blobs
      .filter(b => b.pathname === 'preseason-baselines.json')
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    if (baselineBlobs.length > 0) {
      try {
        const res = await fetch(`${baselineBlobs[0].url}?t=${Date.now()}`, { cache: 'no-store' })
        baselines = await res.json()
      } catch (err) {
        console.warn('Failed to load preseason baselines:', err)
      }
    }

    return NextResponse.json({
      success: true,
      clinics,
      totalClinics: clinics.length,
      baselines,
      totalBaselines: baselines.length,
    })
  } catch (error) {
    console.error('Admin preseason API error:', error)
    return NextResponse.json(
      { error: 'Failed to load preseason data' },
      { status: 500 }
    )
  }
}
