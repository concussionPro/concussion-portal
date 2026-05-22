/**
 * Server-component gate used by every AI course page. Wraps content + a
 * small admin-preview banner so anyone hitting the page can see who's
 * allowed (and the gate is obvious during the preview phase).
 */

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionToken } from '@/lib/jwt-session'
import { isUserEnrolled } from '@/lib/ai-course/access'

export interface GateResult {
  ok: boolean
  reason: string
  email?: string
}

/**
 * Admin-only during preview. The enrolled-user path is dormant until
 * AI_COURSE_PUBLIC=true is set. The user wants every part of the
 * AI-course surface behind the admin key (no public verify URL, no
 * public certificate PDF, no enrolled-user path until launch).
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

  // Demo-key path — partner-pitch access without sharing the main admin key.
  // Set HEIDI_DEMO_KEY in Vercel env and share via x-demo-key header or
  // ?demo= query string. Course pages only — does not unlock /api/admin/*.
  const demoKey = process.env.HEIDI_DEMO_KEY
  const demoHeader = headerList.get('x-demo-key')
  const demoCookie = cookieStore.get('demo_key')?.value
  if (demoKey && ((demoHeader && demoHeader === demoKey) || (demoCookie && demoCookie === demoKey))) {
    return { ok: true, reason: 'demo-key' }
  }

  // Preview mode (default): admin or demo-key only. No enrolled-user path active.
  if (process.env.AI_COURSE_PUBLIC !== 'true') {
    return { ok: false, reason: 'admin-required' }
  }

  // Post-launch mode: enrolled users pass.
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return { ok: false, reason: 'no-session' }
  const session = verifySessionToken(sessionCookie)
  if (!session) return { ok: false, reason: 'invalid-session' }
  const enrolled = await isUserEnrolled(session.email)
  if (enrolled) return { ok: true, reason: 'enrolled', email: session.email }
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
  return (
    <div className="mb-6 flex items-center gap-2">
      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        ADMIN PREVIEW · NOT PUBLIC
      </span>
      <span className="text-[10px] text-muted-foreground">Access: {access.reason}</span>
    </div>
  )
}
