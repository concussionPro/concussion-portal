/**
 * Access gate for the "AI in Clinical Practice" course.
 *
 * Until the course is publicly launched, access is restricted to admin users
 * (httpOnly admin_session cookie OR x-admin-key header) OR users with an
 * explicit `aiCourseEnrolled` flag set via /api/admin/ai-course/enroll.
 *
 * Once Zac flips the launch switch (env var AI_COURSE_PUBLIC=true), the gate
 * relaxes to "any authenticated user." The course's purchase flow can be
 * wired in later; for now access is invitation-only via admin.
 */

import { NextRequest } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { verifySessionToken } from '@/lib/jwt-session'
import { sql } from '@/lib/db'

export type AccessResult =
  | { ok: true; reason: 'admin' | 'enrolled' | 'public-launch'; userId?: string; email?: string }
  | { ok: false; reason: 'not-admin-not-enrolled' | 'unauthenticated' }

/**
 * Server-side access check for AI course routes and APIs. Admin always
 * passes. Enrolled users pass when their users.ai_course_enrolled flag is
 * true. Public launch flag (env) bypasses both.
 */
export async function checkAiCourseAccess(request: NextRequest): Promise<AccessResult> {
  // Public-launch override — set AI_COURSE_PUBLIC=true to flip the gate off
  if (process.env.AI_COURSE_PUBLIC === 'true') {
    const session = readSessionEmail(request)
    return { ok: true, reason: 'public-launch', email: session?.email, userId: session?.userId }
  }

  // Admin always allowed
  if (isAdminRequest(request)) {
    return { ok: true, reason: 'admin' }
  }

  // Enrolled-user check
  const session = readSessionEmail(request)
  if (!session) {
    return { ok: false, reason: 'unauthenticated' }
  }

  const enrolled = await isUserEnrolled(session.email)
  if (enrolled) {
    return { ok: true, reason: 'enrolled', email: session.email, userId: session.userId }
  }

  return { ok: false, reason: 'not-admin-not-enrolled' }
}

function readSessionEmail(request: NextRequest): { email: string; userId: string } | null {
  const cookie = request.cookies.get('session')?.value
  if (!cookie) return null
  const session = verifySessionToken(cookie)
  if (!session) return null
  return { email: session.email, userId: session.userId }
}

/**
 * Returns true if the user has been enrolled in the AI course. The flag
 * lives on the users table as `ai_course_enrolled` (boolean). The column is
 * lazily created via ensureAiCourseColumns().
 */
export async function isUserEnrolled(email: string): Promise<boolean> {
  await ensureAiCourseColumns()
  const { rows } = await sql`
    SELECT ai_course_enrolled FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1
  `
  return rows[0]?.ai_course_enrolled === true
}

/**
 * Enrol a user. Idempotent — re-running has no effect.
 */
export async function enrolUser(email: string): Promise<{ ok: boolean; reason?: string }> {
  await ensureAiCourseColumns()
  const { rowCount } = await sql`
    UPDATE users SET ai_course_enrolled = true WHERE LOWER(email) = LOWER(${email})
  `
  if ((rowCount ?? 0) === 0) {
    return { ok: false, reason: 'user not found' }
  }
  return { ok: true }
}

/**
 * Withdraw enrolment.
 */
export async function unenrolUser(email: string): Promise<{ ok: boolean; reason?: string }> {
  await ensureAiCourseColumns()
  const { rowCount } = await sql`
    UPDATE users SET ai_course_enrolled = false WHERE LOWER(email) = LOWER(${email})
  `
  if ((rowCount ?? 0) === 0) {
    return { ok: false, reason: 'user not found' }
  }
  return { ok: true }
}

let columnsEnsured = false
async function ensureAiCourseColumns() {
  if (columnsEnsured) return
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_course_enrolled BOOLEAN DEFAULT false`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_course_progress JSONB DEFAULT '{}'::jsonb`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_course_certificate_id TEXT`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_course_certificate_issued_at TIMESTAMPTZ`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_course_certificate_expires_at TIMESTAMPTZ`
  columnsEnsured = true
}
