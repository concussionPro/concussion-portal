import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

/**
 * GET /s/[code]
 *
 * Generic short-URL resolver. Looks up the long URL in short_urls and
 * 302s to it. Used to wrap admin-generated magic-link URLs (which are
 * long JWT-baked verify URLs) into a portal-domain short URL the
 * admin can paste into a personal email.
 *
 * No auth — the destination URL itself carries any required auth
 * (e.g. magic token). Anyone with the short code can resolve it.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  if (!code || !/^[A-Za-z0-9_-]{4,32}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }
  try {
    const { rows } = await sql<{ url: string }>`
      SELECT url FROM short_urls WHERE code = ${code} LIMIT 1
    `
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }
    return NextResponse.redirect(rows[0].url, 302)
  } catch (err) {
    // NEVER echo the raw error: this route is unauthenticated by design, and
    // the only thing inside the try is a Postgres query. Returning err.message
    // served anonymous callers verbatim Postgres text — measured 2026-08-06,
    // a bogus POSTGRES_URL produced a 500 body containing the full
    // VercelPostgresError (and on a real connection failure that carries the
    // Neon endpoint). Log server-side, return a generic 500.
    console.error(`[s/${code}] short-link lookup failed:`, err)
    return NextResponse.json({ error: 'Link could not be resolved. Please try again.' }, { status: 500 })
  }
}
