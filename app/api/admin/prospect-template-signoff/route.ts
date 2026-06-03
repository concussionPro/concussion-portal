/**
 * POST /api/admin/prospect-template-signoff
 *
 * Marks an email template as approved for production sends.
 *
 * Body: { slug: 'initial' | 'followup' | 'final', signedOffBy?: string, notes?: string }
 *
 * Without a signed-off row, prospect-send (production mode) + prospect-process-scheduled
 * both refuse to fire. Test-mode sends bypass this gate.
 *
 * Auth: admin header / cookie.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { slug?: string; signedOffBy?: string; notes?: string; revoke?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const slug = body.slug
  if (!slug || !['initial', 'followup', 'final'].includes(slug)) {
    return NextResponse.json({ error: 'slug required: initial | followup | final' }, { status: 400 })
  }

  if (body.revoke) {
    await sql`
      UPDATE email_template_signoff
      SET signed_off_at = NULL, signed_off_by = NULL, notes = ${body.notes ?? null}
      WHERE slug = ${slug}
    `
    return NextResponse.json({ ok: true, slug, revoked: true })
  }

  const signedOffBy = body.signedOffBy ?? 'Zac Lewis'
  const notes = body.notes ?? null

  await sql`
    INSERT INTO email_template_signoff (slug, signed_off_at, signed_off_by, notes)
    VALUES (${slug}, NOW(), ${signedOffBy}, ${notes})
    ON CONFLICT (slug) DO UPDATE
      SET signed_off_at = NOW(),
          signed_off_by = ${signedOffBy},
          notes = ${notes}
  `

  const { rows } = await sql<{ slug: string; signed_off_at: string; signed_off_by: string | null; notes: string | null }>`
    SELECT slug, signed_off_at, signed_off_by, notes FROM email_template_signoff WHERE slug = ${slug}
  `

  return NextResponse.json({ ok: true, slug, signoff: rows[0] })
}
