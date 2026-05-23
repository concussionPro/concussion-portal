/**
 * Generic per-course certificate store. Designed for short courses
 * (vagus-nerve and future). Distinct from the AI course's certificate
 * pipeline, which lives in user columns and predates this table.
 *
 * One row per (email, course_slug). Issuing re-issues — fresh ID and
 * fresh 12-month validity. Lazy CREATE TABLE on first call.
 */

import crypto from 'crypto'
import { sql } from './db'

const CERT_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000 // 12 months

export interface CourseCertificateRecord {
  certificateId: string
  email: string
  name: string | null
  courseSlug: string
  courseTitle: string
  cpdHours: number
  issuedAt: string
  expiresAt: string
  isValid: boolean
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
      expires_at TIMESTAMPTZ NOT NULL,
      UNIQUE (email, course_slug)
    )
  `
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
}): Promise<CourseCertificateRecord> {
  await ensureTable()
  const email = args.email.trim().toLowerCase()
  const certificateId = makeCertificateId()
  const issuedAt = new Date()
  const expiresAt = new Date(issuedAt.getTime() + CERT_VALIDITY_MS)

  await sql`
    INSERT INTO course_certificates
      (certificate_id, email, name, course_slug, course_title, cpd_hours, issued_at, expires_at)
    VALUES
      (${certificateId}, ${email}, ${args.name ?? null}, ${args.courseSlug}, ${args.courseTitle}, ${args.cpdHours}, ${issuedAt.toISOString()}, ${expiresAt.toISOString()})
    ON CONFLICT (email, course_slug) DO UPDATE
      SET certificate_id = EXCLUDED.certificate_id,
          name = EXCLUDED.name,
          course_title = EXCLUDED.course_title,
          cpd_hours = EXCLUDED.cpd_hours,
          issued_at = EXCLUDED.issued_at,
          expires_at = EXCLUDED.expires_at
  `

  return {
    certificateId,
    email,
    name: args.name ?? null,
    courseSlug: args.courseSlug,
    courseTitle: args.courseTitle,
    cpdHours: args.cpdHours,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isValid: true,
  }
}

export async function getCourseCertificate(
  email: string,
  courseSlug: string
): Promise<CourseCertificateRecord | null> {
  await ensureTable()
  const { rows } = await sql<{
    certificate_id: string
    email: string
    name: string | null
    course_slug: string
    course_title: string
    cpd_hours: string
    issued_at: string
    expires_at: string
  }>`
    SELECT certificate_id, email, name, course_slug, course_title, cpd_hours::text AS cpd_hours, issued_at, expires_at
    FROM course_certificates
    WHERE LOWER(email) = LOWER(${email}) AND course_slug = ${courseSlug}
    LIMIT 1
  `
  if (rows.length === 0) return null
  const r = rows[0]
  const expires = new Date(r.expires_at)
  return {
    certificateId: r.certificate_id,
    email: r.email,
    name: r.name,
    courseSlug: r.course_slug,
    courseTitle: r.course_title,
    cpdHours: parseFloat(r.cpd_hours),
    issuedAt: new Date(r.issued_at).toISOString(),
    expiresAt: expires.toISOString(),
    isValid: Date.now() < expires.getTime(),
  }
}

export async function verifyCourseCertificate(
  certificateId: string
): Promise<CourseCertificateRecord | null> {
  await ensureTable()
  const { rows } = await sql<{
    certificate_id: string
    email: string
    name: string | null
    course_slug: string
    course_title: string
    cpd_hours: string
    issued_at: string
    expires_at: string
  }>`
    SELECT certificate_id, email, name, course_slug, course_title, cpd_hours::text AS cpd_hours, issued_at, expires_at
    FROM course_certificates
    WHERE certificate_id = ${certificateId}
    LIMIT 1
  `
  if (rows.length === 0) return null
  const r = rows[0]
  const expires = new Date(r.expires_at)
  return {
    certificateId: r.certificate_id,
    email: r.email,
    name: r.name,
    courseSlug: r.course_slug,
    courseTitle: r.course_title,
    cpdHours: parseFloat(r.cpd_hours),
    issuedAt: new Date(r.issued_at).toISOString(),
    expiresAt: expires.toISOString(),
    isValid: Date.now() < expires.getTime(),
  }
}
