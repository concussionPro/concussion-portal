/**
 * Per-slug course entitlements for short courses (vagus-nerve, future drops).
 *
 * Why this exists: historically every short-course surface gated on the AI
 * course's enrolment flag (users.ai_course_enrolled), so an AI-course buyer
 * implicitly got every short course and a vagus-only buyer would have got
 * nothing. This module gates per course slug while PRESERVING the legacy
 * grant — nobody who has access today loses it.
 *
 * checkCourseAccess(email, slug) returns true if ANY of:
 *   (a) legacy AI-course enrolment (users.ai_course_enrolled=true) —
 *       preserves existing customers who bought before per-slug gating;
 *   (b) a course_purchases row exists for that email + slug (written by the
 *       Stripe webhook's handleShortCoursePurchase for every short course).
 *
 * Canonical slugs match lib/ai-course/provider-catalogue.ts course ids and
 * the courseSlug the Stripe webhook records into course_purchases
 * (e.g. 'vagus-nerve', 'ai-in-clinical-practice').
 */

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/admin-session'
import { verifySessionToken } from '@/lib/jwt-session'
import { isUserEnrolled } from '@/lib/ai-course/access'
import { userOwnsCourse } from '@/lib/course-purchases'
import { DEMO_KEY } from '@/lib/demo-key'

/**
 * Pure entitlement check (no request context). True if the user holds the
 * legacy AI-course enrolment OR owns this specific course slug.
 */
export async function checkCourseAccess(email: string, slug: string): Promise<boolean> {
  if (!email || !slug) return false
  // (a) Legacy grant — ai_course_enrolled has historically unlocked every
  // short course. Kept so no existing customer loses access.
  if (await isUserEnrolled(email)) return true
  // (b) Per-slug purchase row (Stripe webhook writes these for all short courses).
  return userOwnsCourse(email, slug)
}

// ── API-route gate (NextRequest) ────────────────────────────────────────────

export type CourseAccessResult =
  | { ok: true; reason: 'admin' | 'demo-key' | 'entitled'; email?: string }
  | { ok: false; reason: 'unauthenticated' | 'not-entitled' }

/**
 * Access gate for short-course API routes. Mirrors checkAiCourseAccess
 * (admin → demo-key → entitled session user) but consults per-slug
 * entitlements via checkCourseAccess.
 */
export async function checkCourseApiAccess(
  request: NextRequest,
  slug: string
): Promise<CourseAccessResult> {
  if (isAdminRequest(request)) {
    return { ok: true, reason: 'admin' }
  }

  const supplied =
    request.headers.get('x-demo-key') ||
    new URL(request.url).searchParams.get('demo') ||
    request.cookies.get('demo_key')?.value
  if (supplied && supplied === DEMO_KEY) {
    return { ok: true, reason: 'demo-key' }
  }

  const cookie = request.cookies.get('session')?.value
  const session = cookie ? verifySessionToken(cookie) : null
  if (!session) return { ok: false, reason: 'unauthenticated' }

  if (await checkCourseAccess(session.email, slug)) {
    return { ok: true, reason: 'entitled', email: session.email }
  }
  return { ok: false, reason: 'not-entitled' }
}

// ── Server-component gate (cookies()/headers()) ─────────────────────────────

/**
 * Structurally compatible with CourseGate's GateResult so the shared
 * AdminPreviewBadge component keeps working unchanged.
 */
export interface CourseGateResult {
  ok: boolean
  reason: string
  email?: string
}

export async function checkCourseServerAccess(slug: string): Promise<CourseGateResult> {
  const cookieStore = await cookies()
  const headerList = await headers()

  // Admin — cookie must actually VERIFY (HMAC-signed admin_session), never
  // "any non-empty cookie". Header key path kept for scripts.
  const adminSession = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  if (adminSession && verifyAdminSessionToken(adminSession)) {
    return { ok: true, reason: 'admin-cookie' }
  }
  const adminKey = headerList.get('x-admin-key')
  if (adminKey && process.env.ADMIN_API_KEY && adminKey === process.env.ADMIN_API_KEY) {
    return { ok: true, reason: 'admin-header' }
  }

  // Demo-key (partner-pitch / reviewer links) — same behaviour as CourseGate.
  const demoHeader = headerList.get('x-demo-key')
  const demoCookie = cookieStore.get('demo_key')?.value
  if ((demoHeader && demoHeader === DEMO_KEY) || (demoCookie && demoCookie === DEMO_KEY)) {
    return { ok: true, reason: 'demo-key' }
  }

  const sessionCookie = cookieStore.get('session')?.value
  const session = sessionCookie ? verifySessionToken(sessionCookie) : null
  if (!session) return { ok: false, reason: 'no-session' }

  if (await checkCourseAccess(session.email, slug)) {
    return { ok: true, reason: 'entitled', email: session.email }
  }
  return { ok: false, reason: 'not-entitled', email: session.email }
}

export async function requireCourseAccess(
  slug: string,
  redirectTo?: string
): Promise<CourseGateResult> {
  const result = await checkCourseServerAccess(slug)
  if (!result.ok) {
    redirect(redirectTo || `/login?from=/courses/${slug}`)
  }
  return result
}
