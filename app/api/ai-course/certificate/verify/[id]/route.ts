import { NextRequest, NextResponse } from 'next/server'
import { verifyCertificate } from '@/lib/ai-course/certificate'

/**
 * GET /api/ai-course/certificate/verify/:id
 *
 * PUBLIC — the high-entropy certificate ID is the bearer token. Third
 * parties (employers, insurers, AHPRA auditors) verify without an account.
 * Only the holder's name and email domain are exposed.
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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
    // No expiresAt: completion evidence does not expire (lib/ai-course/certificate.ts).
    expires: null,
    courseName: 'AI in Clinical Practice',
    issuer: 'Concussion Education Australia',
  })
}
