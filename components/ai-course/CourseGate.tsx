/**
 * Server-component gate used by every AI course page. Wraps content + a
 * small admin-preview banner so anyone hitting the page can see who's
 * allowed (and the gate is obvious during the preview phase).
 */

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionToken } from '@/lib/jwt-session'
import { isUserEnrolled } from '@/lib/ai-course/access'
import { DEMO_KEY } from '@/lib/demo-key'

export interface GateResult {
  ok: boolean
  reason: string
  email?: string
}

/**
 * Mirrors lib/ai-course/access.ts (checkAiCourseAccess):
 *   - Admin always passes
 *   - Demo-key holders pass
 *   - ENROLLED users (users.ai_course_enrolled=true) ALWAYS pass —
 *     regardless of AI_COURSE_PUBLIC. They paid; the visibility flag
 *     must never lock them out.
 *   - AI_COURSE_PUBLIC only gates public/preview visibility for
 *     everyone else (no public path while it's unset).
 */
export async function checkServerAccess(): Promise<GateResult> {
  const cookieStore = await cookies()
  const headerList = await headers()

  // Admin always allowed
  const adminSession = cookieStore.get('admin_session')?.value
  if (adminSession) return { ok: true, reason: 'admin-cookie' }
  const adminKey = headerList.get('x-admin-key')
  if (adminKey && process.env.ADMIN_API_KEY && adminKey === process.env.ADMIN_API_KEY) {
    return { ok: true, reason: 'admin-header' }
  }

  // Demo-key path — partner-pitch / ESSA-reviewer access without sharing the
  // main admin key. Uses the shared DEMO_KEY constant (lib/demo-key) so it
  // honours the same committed fallback the /demo/* reviewer links and the
  // gated module API use — otherwise the Toolkit / References / Admin-Docs /
  // Documents pages would 302 to /login whenever HEIDI_DEMO_KEY is unset,
  // while the module pages (which use DEMO_KEY) stayed open. Course pages
  // only — does not unlock /api/admin/*.
  const demoHeader = headerList.get('x-demo-key')
  const demoCookie = cookieStore.get('demo_key')?.value
  if ((demoHeader && demoHeader === DEMO_KEY) || (demoCookie && demoCookie === DEMO_KEY)) {
    return { ok: true, reason: 'demo-key' }
  }

  // Enrolled (purchased) users ALWAYS pass — AI_COURSE_PUBLIC only gates
  // public/preview visibility, never paid access (mirrors checkAiCourseAccess
  // in lib/ai-course/access.ts).
  const sessionCookie = cookieStore.get('session')?.value
  const session = sessionCookie ? verifySessionToken(sessionCookie) : null
  if (session) {
    const enrolled = await isUserEnrolled(session.email)
    if (enrolled) return { ok: true, reason: 'enrolled', email: session.email }
  }

  // Preview mode (flag unset): admin / demo-key / enrolled only — no public path.
  if (process.env.AI_COURSE_PUBLIC !== 'true') {
    return { ok: false, reason: 'admin-required' }
  }

  // Flag is on but the visitor isn't enrolled — the course is paid, not free.
  if (!sessionCookie) return { ok: false, reason: 'no-session' }
  if (!session) return { ok: false, reason: 'invalid-session' }
  return { ok: false, reason: 'not-enrolled', email: session.email }
}

export async function requireAiCourseAccess(redirectTo?: string): Promise<GateResult> {
  const result = await checkServerAccess()
  if (!result.ok) {
    redirect(redirectTo || '/login?from=/courses/ai-in-clinical-practice')
  }
  return result
}

export function AdminPreviewBadge({ access }: { access: GateResult }) {
  if (!access.ok) return null
  // Demo-key viewers see the DemoWatermark globally — no need for a
  // separate badge. Admin viewers still see the preview marker.
  if (access.reason === 'demo-key') return null
  return (
    <div className="mb-6 flex items-center gap-2">
      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        ADMIN PREVIEW · NOT PUBLIC
      </span>
      <span className="text-[10px] text-muted-foreground">Access: {access.reason}</span>
    </div>
  )
}
