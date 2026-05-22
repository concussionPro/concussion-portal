import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { lookupSlug, resolveKeyForSlug } from '@/lib/ai-course/demo-slugs'

/**
 * GET /api/admin/demo-preview?slug=<slug>
 *
 * Admin shortcut. Skips the NDA + form flow. Sets the demo_key and
 * demo_org cookies directly, then redirects to /courses so the admin
 * can see exactly what a partner sees — including the watermark and
 * analytics attribution — without round-tripping through the NDA page.
 *
 * Admin-gated. No partner can hit this endpoint without ADMIN_API_KEY
 * or an active admin session.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const adminKeyParam = url.searchParams.get('adminKey')
  const adminKeyEnv = process.env.ADMIN_API_KEY

  // Accept admin auth via x-admin-key header, admin_session cookie, OR
  // ?adminKey= query param. The query-param path is for one-shot URL
  // access (e.g. clicking a link in a chat). It's logged in browser
  // history, so don't share these URLs anywhere persistent.
  const queryAuthed = adminKeyParam && adminKeyEnv && adminKeyParam === adminKeyEnv
  if (!queryAuthed && !isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 401 })
  }

  const slug = url.searchParams.get('slug') || 'heidi'
  const meta = lookupSlug(slug)
  if (!meta) {
    return NextResponse.json({ error: `Unknown demo slug: ${slug}` }, { status: 404 })
  }
  const key = resolveKeyForSlug(slug)
  if (!key) {
    return NextResponse.json(
      { error: `Slug "${slug}" maps to env var ${meta.keyEnvVar} which is not set.` },
      { status: 503 }
    )
  }

  const response = NextResponse.redirect(new URL('/courses', request.url))
  // Same cookie settings as /api/ai-course/demo-access/accept — 7 day
  // TTL so the admin doesn't have to repeat this every session.
  response.cookies.set('demo_key', key, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  response.cookies.set('demo_org', `${meta.suggestedOrg} (Admin Preview)`, {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
