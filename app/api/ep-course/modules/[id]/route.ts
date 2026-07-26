/**
 * GET /api/ep-course/modules/[id]
 *
 * Serves an EP-course module to the flagship learning-suite UI (the EP course
 * renders through app/ep-course/modules/[id], a duplicate of the flagship page
 * pointed at this endpoint). PRIVATE demo for ESSA accreditation review — gated
 * to admin OR the demo_key cookie (Steve, via /demo/essa). Authorised viewers
 * get the full module (accessLevel='full-course'); everyone else gets a 403 so
 * the page shows the locked screen. Response shape matches /api/modules/[id]
 * so useEpModuleData parses it identically.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getEpModuleById } from '@/data/ep-modules'
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/admin-session'
import { verifySessionToken } from '@/lib/jwt-session'
import { userOwnsCrm } from '@/lib/crm-course'
import { DEMO_KEY } from '@/lib/demo-key'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const moduleId = parseInt(id, 10)
  if (Number.isNaN(moduleId)) {
    return NextResponse.json({ error: 'Invalid module id' }, { status: 400 })
  }

  // ── Auth: admin (cookie/header) OR demo_key cookie OR CRM purchaser ──
  // WATERTIGHT PER STREAM: EP content unlocks on CRM ownership
  // (course_purchases slug 'crm'), NOT the AI-course flag it used to key off —
  // that leaked EP access to AI-course buyers and gave CRM buyers nothing
  // (2026-07-19 bug fix). CCM stays on users.access_level; AI on
  // ai_course_enrolled; CRM on course_purchases. Three streams, three gates.
  const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  const isAdmin = !!adminCookie && !!verifyAdminSessionToken(adminCookie)
  const adminHeader = request.headers.get('x-admin-key')
  const isAdminHeader = !!adminHeader && !!process.env.ADMIN_API_KEY && adminHeader === process.env.ADMIN_API_KEY
  const demoCookie = request.cookies.get('demo_key')?.value
  const isDemo = demoCookie === DEMO_KEY
  let authorized = isAdmin || isAdminHeader || isDemo
  if (!authorized) {
    const sessionCookie = request.cookies.get('session')?.value
    const session = sessionCookie ? verifySessionToken(sessionCookie) : null
    if (session) authorized = await userOwnsCrm(session.email)
  }

  // Named `epModule`, not `module` — `module` is a reserved binding in a
  // Next.js module scope (@next/next/no-assign-module-variable).
  const epModule = getEpModuleById(moduleId)

  if (!authorized) {
    return NextResponse.json(
      {
        // CRM is LIVE — a non-owner gets the enrolment prompt, not the stale
        // "private ESSA review copy" copy from the pre-approval era.
        error: 'This module requires Concussion Rehab Mastery enrolment',
        upgrade: true,
        message: 'Enrol in Concussion Rehab Mastery to unlock the full course.',
        allSectionTitles: epModule?.sections.map((s) => s.title) ?? [],
      },
      { status: 403 },
    )
  }

  if (!epModule) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    module: epModule,
    accessLevel: 'full-course',
  })
}
