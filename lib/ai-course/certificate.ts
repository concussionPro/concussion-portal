/**
 * Certificate issuance + verification for the AI in Clinical Practice course.
 *
 * On quiz pass, a certificate is issued to the user. The certificate ID
 * (URL-safe random) is stored in users.ai_course_certificate_id and acts as
 * the public verification handle: /api/ai-course/certificate/verify/:id.
 *
 * Validity: 12 months. Renewal via re-attempting the (refreshed) quiz —
 * gated by Hub subscription in the future, free during preview.
 */

import crypto from 'crypto'
import { sql } from '@/lib/db'

const CERT_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000 // 12 months

export interface CertificateRecord {
  certificateId: string
  email: string
  name: string
  issuedAt: string
  expiresAt: string
  isValid: boolean
}

function makeCertificateId(): string {
  // 16 bytes → 22-char URL-safe ID. Collision risk: negligible at our scale.
  return crypto.randomBytes(16).toString('base64url')
}

/**
 * Issue (or re-issue) the certificate for a user. Always stamps a fresh
 * 12-month validity window. Returns the certificate record.
 */
export async function issueCertificate(email: string): Promise<CertificateRecord> {
  const { rows } = await sql`
    SELECT email, name FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1
  `
  if (rows.length === 0) {
    throw new Error(`User not found: ${email}`)
  }
  const user = rows[0]

  const certificateId = makeCertificateId()
  const issuedAt = new Date()
  const expiresAt = new Date(issuedAt.getTime() + CERT_VALIDITY_MS)

  await sql`
    UPDATE users
    SET
      ai_course_certificate_id = ${certificateId},
      ai_course_certificate_issued_at = ${issuedAt.toISOString()},
      ai_course_certificate_expires_at = ${expiresAt.toISOString()}
    WHERE LOWER(email) = LOWER(${email})
  `

  return {
    certificateId,
    email: user.email,
    name: user.name,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isValid: true,
  }
}

/**
 * Public verification — given a certificate ID, return whether it exists,
 * who it was issued to, when it was issued, and whether it's still valid.
 */
export async function verifyCertificate(
  certificateId: string
): Promise<CertificateRecord | null> {
  const { rows } = await sql`
    SELECT email, name, ai_course_certificate_id, ai_course_certificate_issued_at, ai_course_certificate_expires_at
    FROM users
    WHERE ai_course_certificate_id = ${certificateId}
    LIMIT 1
  `
  if (rows.length === 0) return null
  const r = rows[0]
  const expiresAt = new Date(r.ai_course_certificate_expires_at)
  return {
    certificateId,
    email: r.email,
    name: r.name,
    issuedAt: new Date(r.ai_course_certificate_issued_at).toISOString(),
    expiresAt: expiresAt.toISOString(),
    isValid: Date.now() < expiresAt.getTime(),
  }
}

/**
 * Get the certificate currently held by a user (if any).
 */
export async function getUserCertificate(email: string): Promise<CertificateRecord | null> {
  const { rows } = await sql`
    SELECT email, name, ai_course_certificate_id, ai_course_certificate_issued_at, ai_course_certificate_expires_at
    FROM users
    WHERE LOWER(email) = LOWER(${email}) AND ai_course_certificate_id IS NOT NULL
    LIMIT 1
  `
  if (rows.length === 0) return null
  const r = rows[0]
  if (!r.ai_course_certificate_id) return null
  const expiresAt = new Date(r.ai_course_certificate_expires_at)
  return {
    certificateId: r.ai_course_certificate_id,
    email: r.email,
    name: r.name,
    issuedAt: new Date(r.ai_course_certificate_issued_at).toISOString(),
    expiresAt: expiresAt.toISOString(),
    isValid: Date.now() < expiresAt.getTime(),
  }
}
