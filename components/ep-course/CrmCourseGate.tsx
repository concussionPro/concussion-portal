/**
 * Server-component gate for CRM (Concussion Rehab Mastery / EP course) pages.
 *
 * WATERTIGHT PER STREAM: mirrors the AI-course gate's admin + demo-key paths,
 * but a paying user passes on CRM OWNERSHIP (course_purchases slug 'crm') — NOT
 * the AI-course flag the EP pages used to key off (2026-07-19 bug fix). The
 * module content API (app/api/ep-course/modules/[id]) uses the same check, so
 * the page gate and the content API can never disagree.
 */
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionToken } from '@/lib/jwt-session'
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/admin-session'
import { userOwnsCrm } from '@/lib/crm-course'
import { DEMO_KEY } from '@/lib/demo-key'
import type { GateResult } from '@/components/ai-course/CourseGate'

export async function checkCrmServerAccess(): Promise<GateResult> {
  const cookieStore = await cookies()
  const headerList = await headers()

  const adminSession = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  if (adminSession && verifyAdminSessionToken(adminSession)) {
    return { ok: true, reason: 'admin-cookie' }
  }
  const adminKey = headerList.get('x-admin-key')
  if (adminKey && process.env.ADMIN_API_KEY && adminKey === process.env.ADMIN_API_KEY) {
    return { ok: true, reason: 'admin-header' }
  }

  // Demo-key path — ESSA reviewer / partner access (via /demo/essa), same
  // shared DEMO_KEY the module API honours.
  const demoHeader = headerList.get('x-demo-key')
  const demoCookie = cookieStore.get('demo_key')?.value
  if ((demoHeader && demoHeader === DEMO_KEY) || (demoCookie && demoCookie === DEMO_KEY)) {
    return { ok: true, reason: 'demo-key' }
  }

  // Paying CRM owners always pass — course_purchases slug 'crm'.
  const sessionCookie = cookieStore.get('session')?.value
  const session = sessionCookie ? verifySessionToken(sessionCookie) : null
  if (session) {
    const owns = await userOwnsCrm(session.email)
    if (owns) return { ok: true, reason: 'enrolled', email: session.email }
  }

  if (!sessionCookie) return { ok: false, reason: 'no-session' }
  if (!session) return { ok: false, reason: 'invalid-session' }
  return { ok: false, reason: 'not-enrolled', email: session.email }
}

export async function requireCrmCourseAccess(redirectTo?: string): Promise<GateResult> {
  const result = await checkCrmServerAccess()
  if (!result.ok) {
    redirect(redirectTo || '/concussion-rehab-mastery')
  }
  return result
}
