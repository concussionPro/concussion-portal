import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'

/**
 * GET /api/admin/q4-mail-links — CSV of the Q4 warm list (the 90 the Resend
 * blast reached) with each person's signed /train link, for the Mac Mail
 * one-to-one round (owner 2026-08-18: 30/day, ready-to-train segment first).
 *
 * Columns: segment, email, first_name, train_url. Segment order matches the
 * send order: registered (interest register) first, then other. Suppressed
 * addresses are EXCLUDED here — fail closed — so a copy-paste from this file
 * can never mail a suppressed contact.
 */

export const dynamic = 'force-dynamic'

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

  const { rows } = await sql`
    SELECT split_part(l.audit_key, ':', 2) AS segment,
           split_part(l.audit_key, ':', 3) AS email,
           MIN(u.name) AS name
    FROM email_audit_log l
    LEFT JOIN users u ON LOWER(u.email) = LOWER(split_part(l.audit_key, ':', 3))
    WHERE l.audit_key LIKE 'q4-mel-nov7:%'
      AND NOT EXISTS (
        SELECT 1 FROM email_suppression s
        WHERE LOWER(s.email) = LOWER(split_part(l.audit_key, ':', 3))
      )
    GROUP BY 1, 2
    ORDER BY CASE split_part(l.audit_key, ':', 2) WHEN 'registered' THEN 0 ELSE 1 END,
             split_part(l.audit_key, ':', 3)
  `

  const lines = ['segment,email,first_name,train_url']
  for (const r of rows) {
    const email = String(r.email).toLowerCase()
    const first = String(r.name || '').split(' ')[0]
    const token = generateUnsubscribeToken(email)
    const url = `${baseUrl}/train?e=${encodeURIComponent(email)}&t=${token}`
    lines.push([r.segment, email, first, url].map(csvEscape).join(','))
  }

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="q4-mail-links.csv"',
    },
  })
}
