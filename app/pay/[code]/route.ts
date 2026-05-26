import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

/**
 * GET /pay/[code]
 *
 * Lightweight short-link resolver for Stripe checkout URLs (which are
 * ~700 chars). Admin creates a row in pay_links via
 * /api/admin/generate-upgrade-link → recipient gets a short
 * portal.concussion-education-australia.com/pay/Ab3xK9Lm link → this
 * route 302s to the long Stripe URL.
 *
 * Stripe checkout sessions expire after ~24 hours of inactivity; if
 * the redirect happens past that, Stripe shows its own expired-link
 * page. No tracking, no auth, deliberately simple.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  if (!code || !/^[A-Za-z0-9]{4,32}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }
  try {
    const { rows } = await sql<{ url: string }>`
      SELECT url FROM pay_links WHERE code = ${code} LIMIT 1
    `
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Link not found or expired' }, { status: 404 })
    }
    return NextResponse.redirect(rows[0].url, 302)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Lookup failed' }, { status: 500 })
  }
}
