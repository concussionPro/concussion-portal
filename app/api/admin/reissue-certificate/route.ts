/**
 * POST /api/admin/reissue-certificate
 *
 * Clears the certificate audit-log entry for a given user + course-type
 * so the user can re-trigger certificate generation with their CURRENT
 * name + email. Used when a user changed their name AFTER the cert was
 * first issued (e.g. account originally created under the boss's name,
 * since corrected).
 *
 * Body: { email: string, courseType?: 'scat-mastery' | 'online-course' | 'crm'
 *         | 'recognition-referral' (default 'online-course') }
 * Auth: admin.
 *
 * The values MUST be the same strings /api/certificate uses, because the audit
 * key is built by interpolating them: `certificate_email_${courseType}_${id}`.
 * Until 2026-08-06 this route took 'online' / 'full' and so wrote
 * `certificate_email_online_…`, which matches nothing — measured on production
 * that day, all 8 real online-course keys are `certificate_email_online-course_…`.
 * The DELETE silently removed 0 rows, reported success, and the user's retry hit
 * "Certificate already emailed" with no corrected email ever sent. 'crm' and
 * 'recognition-referral' were rejected outright despite being emailable types;
 * 'full'/'full-course' is gone because that certificate is issued by hand at the
 * workshop and has no audit key to clear.
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
  // Legacy aliases accepted so an old admin bookmark/script still works, but
  // they are normalised to the strings /api/certificate actually keys on.
  const ALIASES: Record<string, string> = { online: 'online-course', full: 'full-course' }
  const requested = body.courseType || 'online-course'
  const courseType = ALIASES[requested] ?? requested
  if (!['scat-mastery', 'online-course', 'crm', 'recognition-referral'].includes(courseType)) {
    return NextResponse.json(
      {
        error:
          courseType === 'full-course'
            ? 'Full-course certificates are issued by hand at the workshop — there is no audit key to clear.'
            : 'Invalid courseType. Use scat-mastery | online-course | crm | recognition-referral.',
      },
      { status: 400 },
    )
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
    auditKey,
    // Don't promise a re-send that cannot happen. No key removed means either
    // no certificate email was ever sent for this type, or the type is wrong —
    // either way the user's retry will NOT produce a fresh email.
    nextStep: rowCount === 1
      ? 'User logs in + re-triggers certificate download. Fresh email sends with their CURRENT name.'
      : `No audit key matched ${auditKey} — nothing was cleared. Check the courseType is the one they were emailed (scat-mastery | online-course | crm | recognition-referral); a retry will otherwise still say "Certificate already emailed".`,
  })
}
