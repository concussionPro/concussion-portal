/**
 * Certificate issuance + verification for the AI in Clinical Practice course.
 *
 * On quiz pass, a certificate is issued to the user. The certificate ID
 * (URL-safe random) is stored in users.ai_course_certificate_id and acts as
 * the public verification handle: /api/ai-course/certificate/verify/:id.
 *
 * COMPLETION EVIDENCE DOES NOT EXPIRE (owner decision 2026-08-06) — same rule
 * as lib/course-certificates.ts, which carries the full reasoning. A
 * certificate records that a person completed a course on a date; that never
 * stops being true, and the verify URL is printed on the document an auditor
 * may follow years later. `ai_course_certificate_expires_at` is retired: still
 * written by rows that predate this change, never read.
 *
 * NOTE (unchanged, pre-existing): this store has NO revocation concept, unlike
 * course_certificates. The AI primer is bundled, not separately sold, so there
 * is no refund path to revoke — if it ever becomes a paid SKU it needs the
 * revoked_at treatment before it goes on sale.
 */

import crypto from 'crypto'
import { sql } from '@/lib/db'

export interface CertificateRecord {
  certificateId: string
  email: string
  name: string
  issuedAt: string
  isValid: boolean
}

function makeCertificateId(): string {
  // 16 bytes → 22-char URL-safe ID. Collision risk: negligible at our scale.
  return crypto.randomBytes(16).toString('base64url')
}

/**
 * Issue (or re-issue) the certificate for a user. Returns the record.
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

  await sql`
    UPDATE users
    SET
      ai_course_certificate_id = ${certificateId},
      ai_course_certificate_issued_at = ${issuedAt.toISOString()},
      -- Retired column: clear it on re-issue so nothing can resurrect it as a
      -- validity signal.
      ai_course_certificate_expires_at = NULL
    WHERE LOWER(email) = LOWER(${email})
  `

  return {
    certificateId,
    email: user.email,
    name: user.name,
    issuedAt: issuedAt.toISOString(),
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
    SELECT email, name, ai_course_certificate_id, ai_course_certificate_issued_at
    FROM users
    WHERE ai_course_certificate_id = ${certificateId}
    LIMIT 1
  `
  if (rows.length === 0) return null
  const r = rows[0]
  return {
    certificateId,
    email: r.email,
    name: r.name,
    issuedAt: new Date(r.ai_course_certificate_issued_at).toISOString(),
    isValid: true,
  }
}

/**
 * Get the certificate currently held by a user (if any).
 */
export async function getUserCertificate(email: string): Promise<CertificateRecord | null> {
  const { rows } = await sql`
    SELECT email, name, ai_course_certificate_id, ai_course_certificate_issued_at
    FROM users
    WHERE LOWER(email) = LOWER(${email}) AND ai_course_certificate_id IS NOT NULL
    LIMIT 1
  `
  if (rows.length === 0) return null
  const r = rows[0]
  if (!r.ai_course_certificate_id) return null
  return {
    certificateId: r.ai_course_certificate_id,
    email: r.email,
    name: r.name,
    issuedAt: new Date(r.ai_course_certificate_issued_at).toISOString(),
    isValid: true,
  }
}
