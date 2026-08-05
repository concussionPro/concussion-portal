/**
 * POST /api/admin/reissue-certificate
 *
 * Clears the certificate audit-log entry for a given user + course-type
 * so the user can re-trigger certificate generation with their CURRENT
 * name + email. Used when a user changed their name AFTER the cert was
 * first issued (e.g. account originally created under the boss's name,
 * since corrected).
 *
 * Body: { email: string, courseType?: 'scat-mastery' | 'online' | 'full' (default 'online') }
 * Auth: admin.
 *
 * Next step for the user: log in, visit the certificate page, and
 * re-trigger the certificate download. The audit log no longer blocks
 * it, so a fresh email is sent with the corrected name on it.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'
import { recordAdminAction } from '@/lib/admin-audit'
import { findUserByEmail } from '@/lib/users'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { email?: string; courseType?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = (body.email || '').trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 })
  }
  const courseType = body.courseType || 'online'
  if (!['scat-mastery', 'online', 'full'].includes(courseType)) {
    return NextResponse.json({ error: 'Invalid courseType' }, { status: 400 })
  }

  const user = await findUserByEmail(email)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const auditKey = `certificate_email_${courseType}_${user.id}`
  const { rowCount } = await sql`
    DELETE FROM email_audit_log
    WHERE audit_key = ${auditKey}
  `

  // Refund-adjacent: clearing this audit key lets the holder re-trigger
  // issuance, and a re-issue CLEARS any revocation on the certificate
  // (lib/course-certificates.ts). That must be reconstructable.
  await recordAdminAction(req, {
    route: '/api/admin/reissue-certificate',
    target: user.email,
    detail: { courseType, auditKeyRemoved: rowCount === 1 },
  })

  return NextResponse.json({
    success: true,
    email: user.email,
    name: user.name,
    courseType,
    auditKeyRemoved: rowCount === 1,
    nextStep: 'User logs in + re-triggers certificate download. Fresh email sends with their CURRENT name.',
  })
}
