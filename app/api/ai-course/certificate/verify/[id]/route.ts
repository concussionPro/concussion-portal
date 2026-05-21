import { NextRequest, NextResponse } from 'next/server'
import { verifyCertificate } from '@/lib/ai-course/certificate'

/**
 * GET /api/ai-course/certificate/verify/:id
 *
 * Public endpoint. Given a certificate ID, returns the holder's name,
 * issue date, expiry, and validity status. No PII beyond first/last name
 * is exposed (the email stored is hashed/redacted in response).
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
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
