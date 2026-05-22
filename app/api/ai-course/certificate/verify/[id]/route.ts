import { NextRequest, NextResponse } from 'next/server'
import { verifyCertificate } from '@/lib/ai-course/certificate'
import { checkAiCourseAccess } from '@/lib/ai-course/access'

/**
 * GET /api/ai-course/certificate/verify/:id
 *
 * Admin-gated during preview. Once AI_COURSE_PUBLIC is set this becomes
 * public so third parties can verify a certificate ID. Until then the
 * verifier is locked down with the rest of the course surface.
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const access = await checkAiCourseAccess(request)
  if (!access.ok) {
    return NextResponse.json({ error: 'Admin key required during preview.' }, { status: 401 })
  }

  const { id } = await params

  // Basic format check — defends against pointless DB hits
  if (!id || id.length < 8 || !/^[A-Za-z0-9_-]+$/.test(id)) {
    return NextResponse.json({ valid: false, reason: 'invalid-format' }, { status: 400 })
  }

  const cert = await verifyCertificate(id)
  if (!cert) {
    return NextResponse.json({ valid: false, reason: 'not-found' }, { status: 404 })
  }

  // Redact email — only show domain for verification context
  const emailDomain = cert.email.includes('@') ? cert.email.split('@')[1] : 'unknown'

  return NextResponse.json({
    valid: cert.isValid,
    certificateId: cert.certificateId,
    name: cert.name,
    emailDomain,
    issuedAt: cert.issuedAt,
    expiresAt: cert.expiresAt,
    courseName: 'AI in Clinical Practice',
    issuer: 'Concussion Education Australia',
  })
}
