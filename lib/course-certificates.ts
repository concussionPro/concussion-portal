/**
 * Generic per-course certificate store — the table /verify/:id reads.
 * Every certificate the portal issues must land here or public verification
 * returns a FALSE NEGATIVE on a genuine AHPRA CPD document.
 *
 * One row per (email, course_slug). Re-issuing refreshes the score/date but
 * KEEPS THE EXISTING CERTIFICATE ID — a re-take used to mint a new id,
 * silently breaking every /verify link the holder had already shared with an
 * employer or auditor. Lazy CREATE TABLE on first call.
 *
 * COMPLETION EVIDENCE DOES NOT EXPIRE (owner decision 2026-08-06). A
 * certificate records that a person completed a course on a date, and that
 * never stops being true. Certificates used to carry a 12-month `expires_at`
 * and /verify flipped them to "✗ Expired — re-certification required" the day
 * after, while lib/certificate.ts prints no expiry on the PDF and its footer
 * tells the holder to retain it for at least 5 years for audit. An AHPRA
 * auditor following the printed /verify URL at 18 months therefore saw a red
 * cross on a genuine certificate. The ONLY thing that invalidates a
 * certificate now is REVOCATION (refund / chargeback) — see revokeCourseCertificates.
 *
 * Accreditation of the OFFERING (e.g. the ESSA period in
 * CONFIG.ESSA_ACCREDITATION) does have an expiry, but that is a property of
 * the offering at the time it was delivered, not of the holder's completion.
 * /verify surfaces it as context ("accreditation as at the date of issue"),
 * never as a reason to invalidate.
 */

import crypto from 'crypto'
import { sql } from './db'

export interface CourseCertificateRecord {
  certificateId: string
  email: string
  name: string | null
  courseSlug: string
  courseTitle: string
  cpdHours: number
  issuedAt: string
  /** false ONLY when revoked — the single thing /verify should trust. */
  isValid: boolean
  /** set when the entitlement behind this certificate was refunded or charged back */
  revokedAt: string | null
  /** why the certificate is not valid — null when it is */
  invalidReason: 'revoked' | null
}

async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS course_certificates (
      id SERIAL PRIMARY KEY,
      certificate_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT,
      course_slug TEXT NOT NULL,
      course_title TEXT NOT NULL,
      cpd_hours NUMERIC(5,2) NOT NULL,
      issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      UNIQUE (email, course_slug)
    )
  `
  // Retired column (see the file header): completion evidence does not expire.
  // Rows written before 2026-08-06 still carry a value; nothing reads it. The
  // NOT NULL has to come off before inserts can stop supplying it.
  await sql`ALTER TABLE course_certificates ALTER COLUMN expires_at DROP NOT NULL`
  // A refund or chargeback removes the entitlement but used to leave the
  // certificate permanently verifiable — so a charged-back buyer kept a CPD
  // document they could lodge with ESSA/OA, and /verify happily said "Valid".
  // Rows are marked, never deleted: an auditor who follows an old link must
  // get an honest "revoked", not "no certificate matches this ID".
  await sql`ALTER TABLE course_certificates ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ`
  await sql`ALTER TABLE course_certificates ADD COLUMN IF NOT EXISTS revoked_reason TEXT`
}

/** Shared row → record mapping, so getCourseCertificate and verify agree. */
interface CertRow {
  certificate_id: string
  email: string
  name: string | null
  course_slug: string
  course_title: string
  cpd_hours: string
  issued_at: string
  revoked_at?: string | Date | null
}

function toRecord(r: CertRow): CourseCertificateRecord {
  const revokedAt = r.revoked_at
    ? (r.revoked_at instanceof Date ? r.revoked_at.toISOString() : new Date(r.revoked_at).toISOString())
    : null
  // REVOCATION is the only invalidity. Age is not — see the file header.
  const invalidReason: CourseCertificateRecord['invalidReason'] = revokedAt ? 'revoked' : null
  return {
    certificateId: r.certificate_id,
    email: r.email,
    name: r.name,
    courseSlug: r.course_slug,
    courseTitle: r.course_title,
    cpdHours: parseFloat(r.cpd_hours),
    issuedAt: new Date(r.issued_at).toISOString(),
    isValid: invalidReason === null,
    revokedAt,
    invalidReason,
  }
}

function makeCertificateId(): string {
  return crypto.randomBytes(16).toString('base64url')
}

export async function issueCourseCertificate(args: {
  email: string
  name?: string | null
  courseSlug: string
  courseTitle: string
  cpdHours: number
  /**
   * Id to store when this is the FIRST issue for (email, course). Callers
   * that print a DETERMINISTIC id on the PDF (lib/certificate.ts) pass it so
   * the printed id and the verifiable id are the same string. Omit to mint a
   * random one. On re-issue the stored id always wins — see below.
   */
  certificateId?: string
}): Promise<CourseCertificateRecord> {
  await ensureTable()
  const email = args.email.trim().toLowerCase()
  const certificateId = args.certificateId || makeCertificateId()
  const issuedAt = new Date()

  // Re-issue (a re-take, a re-download) refreshes the record but NEVER the
  // id: certificate_id is deliberately absent from the DO UPDATE SET list, so
  // links the holder already shared keep resolving. RETURNING gives back
  // whichever id actually persisted.
  const { rows } = await sql<{ certificate_id: string; name: string | null }>`
    INSERT INTO course_certificates
      (certificate_id, email, name, course_slug, course_title, cpd_hours, issued_at)
    VALUES
      (${certificateId}, ${email}, ${args.name ?? null}, ${args.courseSlug}, ${args.courseTitle}, ${args.cpdHours}, ${issuedAt.toISOString()})
    ON CONFLICT (email, course_slug) DO UPDATE
      SET -- Never wipe a previously-captured holder name with NULL on
          -- re-issue — keep the best name we have.
          name = COALESCE(EXCLUDED.name, course_certificates.name),
          course_title = EXCLUDED.course_title,
          cpd_hours = EXCLUDED.cpd_hours,
          issued_at = EXCLUDED.issued_at,
          -- Clear the retired 12-month expiry on any row written before
          -- 2026-08-06, so nothing can resurrect it as a validity signal.
          expires_at = NULL,
          -- Re-issue CLEARS a revocation, and that is safe: every caller of
          -- this function has just re-checked the live entitlement (the
          -- certificate route reads access_level / CRM ownership from the DB,
          -- not the session JWT) and re-verified the quiz answers server-side.
          -- A refunded holder cannot reach this line; someone who re-buys can,
          -- and their certificate should work again.
          revoked_at = NULL,
          revoked_reason = NULL
    RETURNING certificate_id, name
  `

  return {
    certificateId: rows[0]?.certificate_id ?? certificateId,
    email,
    name: rows[0]?.name ?? args.name ?? null,
    courseSlug: args.courseSlug,
    courseTitle: args.courseTitle,
    cpdHours: args.cpdHours,
    issuedAt: issuedAt.toISOString(),
    isValid: true,
    revokedAt: null,
    invalidReason: null,
  }
}

/**
 * Mark a holder's certificates revoked after a refund or chargeback.
 *
 * `slugs` names exactly the certificates the refunded product paid for — this
 * is never a blanket wipe: a CCM refund must not touch a CRM certificate, and
 * a free SCAT/awareness certificate is not purchased at all, so it is never
 * passed here. Idempotent (a dispute following a refund keeps the first
 * revocation timestamp) and never throws — a failed revocation is logged for
 * the operator, it must not fail the webhook and trigger Stripe retries.
 *
 * Returns the certificate ids actually revoked, for the log line.
 */
export async function revokeCourseCertificates(
  email: string,
  slugs: string[],
  reason: string,
): Promise<string[]> {
  if (!email || slugs.length === 0) return []
  try {
    await ensureTable()
    // Array parameters go through as JSON — the tagged-template client only
    // accepts primitives, so `ANY(${slugs})` does not type-check (repo idiom:
    // jsonb_array_elements_text).
    const slugsJson = JSON.stringify(slugs)
    const { rows } = await sql<{ certificate_id: string }>`
      UPDATE course_certificates
      SET revoked_at = COALESCE(revoked_at, NOW()),
          revoked_reason = COALESCE(revoked_reason, ${reason.slice(0, 200)})
      WHERE LOWER(email) = LOWER(${email})
        AND course_slug = ANY(SELECT jsonb_array_elements_text(${slugsJson}::jsonb))
      RETURNING certificate_id
    `
    return rows.map((r) => r.certificate_id)
  } catch (err) {
    console.error('[course-certificates] revocation failed:', err)
    return []
  }
}

export async function getCourseCertificate(
  email: string,
  courseSlug: string
): Promise<CourseCertificateRecord | null> {
  await ensureTable()
  const { rows } = await sql<CertRow>`
    SELECT certificate_id, email, name, course_slug, course_title, cpd_hours::text AS cpd_hours, issued_at, revoked_at
    FROM course_certificates
    WHERE LOWER(email) = LOWER(${email}) AND course_slug = ${courseSlug}
    LIMIT 1
  `
  if (rows.length === 0) return null
  return toRecord(rows[0])
}

/**
 * PUBLIC verification (behind /verify/:id). Reports a REVOKED certificate as
 * invalid with an honest reason — never "Valid", and never "not found" (an
 * auditor following a shared link deserves the truth about the document they
 * were handed, not silence).
 */
export async function verifyCourseCertificate(
  certificateId: string
): Promise<CourseCertificateRecord | null> {
  await ensureTable()
  const { rows } = await sql<CertRow>`
    SELECT certificate_id, email, name, course_slug, course_title, cpd_hours::text AS cpd_hours, issued_at, revoked_at
    FROM course_certificates
    WHERE certificate_id = ${certificateId}
    LIMIT 1
  `
  if (rows.length === 0) return null
  return toRecord(rows[0])
}
