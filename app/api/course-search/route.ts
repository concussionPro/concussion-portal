import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { rateLimit } from '@/lib/rate-limit'
import { userOwnsCrm } from '@/lib/crm-course'
import { corporaFor, searchCourses } from '@/lib/course-search'

/**
 * GET /api/course-search?q=bess
 *
 * ENTITLEMENT-SCOPED. The corpus is built from what this user actually owns —
 * a free-tier user searches only the free SCAT course, a CCM buyer adds the
 * flagship modules, a CRM buyer adds the EP modules. Search therefore can never
 * become a side channel that leaks paid prose past the paywall, and there is no
 * post-filtering step that could be forgotten.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('session')?.value
  const session = token ? verifySessionToken(token) : null
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const q = (request.nextUrl.searchParams.get('q') || '').slice(0, 100)
  if (q.trim().length < 2) return NextResponse.json({ success: true, query: q, results: [] })

  const rl = await rateLimit({ key: `search:${session.userId}`, limit: 60, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const ccm = session.accessLevel === 'online-only' || session.accessLevel === 'full-course'
    const crm = await userOwnsCrm(session.email)
    const results = searchCourses(corporaFor({ ccm, crm }), q)
    return NextResponse.json({ success: true, query: q, results, scope: { ccm, crm } })
  } catch (err) {
    console.error('[course-search] failed:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
