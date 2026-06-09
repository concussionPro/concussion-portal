/**
 * Access gate for the "AI in Clinical Practice" course.
 *
 * Access is granted to admin users (httpOnly admin_session cookie OR
 * x-admin-key header), demo-key holders, and ENROLLED users — i.e. anyone
 * with users.ai_course_enrolled=true, set via purchase webhook or
 * /api/admin/ai-course/enroll.
 *
 * The AI_COURSE_PUBLIC env flag only gates public/preview VISIBILITY
 * surfaces (e.g. CourseGate) — it must never block a paying enrolled user
 * from the course they bought. The course auto-launches on launchAt
 * (2026-06-17, see provider-catalogue.ts) and the checkout flow enrols
 * buyers immediately, so enrolment ⇒ access, unconditionally.
 */

import { NextRequest } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { verifySessionToken } from '@/lib/jwt-session'
import { sql } from '@/lib/db'

export type AccessResult =
  | { ok: true; reason: 'admin' | 'enrolled' | 'public-launch' | 'demo-key'; userId?: string; email?: string }
  | { ok: false; reason: 'not-admin-not-enrolled' | 'unauthenticated' }

/**
 * Server-side access check for AI course routes and APIs.
 *
 *   - Admin always passes
 *   - Demo-key holders pass (scoped partner demos)
 *   - Enrolled users (users.ai_course_enrolled=true) ALWAYS pass —
 *     regardless of AI_COURSE_PUBLIC. They paid; the visibility flag
 *     must never lock them out.
 *   - Everyone else is rejected (the course is paid, not free)
 */
export async function checkAiCourseAccess(request: NextRequest): Promise<AccessResult> {
  // Admin always allowed — uses httpOnly admin_session cookie OR
  // x-admin-key header (see lib/require-admin.ts).
  if (isAdminRequest(request)) {
    return { ok: true, reason: 'admin' }
  }

  // Demo-key path — a scoped, course-only key for sharing with partners
  // (e.g. Heidi pitch). Setting HEIDI_DEMO_KEY=<random> in Vercel env
  // grants AI course access to anyone supplying that exact key via the
  // x-demo-key header OR the ?demo= query string. NOT a full admin key —
  // does not unlock /api/admin/* routes elsewhere in the portal.
  const demoKey = process.env.HEIDI_DEMO_KEY
  if (demoKey) {
    const supplied = request.headers.get('x-demo-key') || new URL(request.url).searchParams.get('demo')
    if (supplied && supplied === demoKey) {
      return { ok: true, reason: 'demo-key' }
    }
  }

  // Enrolled (purchased) users always pass — AI_COURSE_PUBLIC only gates
  // public/preview visibility surfaces, never paid access.
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
