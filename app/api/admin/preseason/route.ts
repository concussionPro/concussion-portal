import { NextRequest, NextResponse } from 'next/server'
import { get as getBlob, list as listBlobs } from '@vercel/blob'
import crypto from 'crypto'

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

function isAdminAuthorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY
  if (!expected) return false
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey && timingSafeCompare(adminKey, expected)) return true
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (bearer && timingSafeCompare(bearer, expected)) return true
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
  clinicName?: string
  submittedAt: string
  athleteName?: string
  symptomCount?: number
  symptomSeverity?: number
  cognitiveScore?: number
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
    let clinics: ClinicRegistration[] = []
    let baselines: BaselineSubmission[] = []

    // Helper: try exact pathname first, then list+filter for old suffixed blobs
    async function readPrivateBlob(pathname: string): Promise<string | null> {
      let blob = await getBlob(pathname, { access: 'private' })
      if (!blob) {
        const prefix = pathname.replace('.json', '')
        const { blobs } = await listBlobs({ prefix })
        const sorted = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        if (sorted.length > 0) {
          blob = await getBlob(sorted[0].url, { access: 'private' })
        }
      }
      if (blob && blob.statusCode === 200 && blob.stream) {
        return new Response(blob.stream).text()
      }
      return null
    }

    // Load clinics data
    try {
      const text = await readPrivateBlob('preseason-clinics.json')
      if (text) clinics = JSON.parse(text)
    } catch (err) {
      console.warn('Failed to load preseason clinics:', err)
    }

    // Load baselines data
    try {
      const text = await readPrivateBlob('preseason-baselines.json')
      if (text) baselines = JSON.parse(text)
    } catch (err) {
      console.warn('Failed to load preseason baselines:', err)
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
