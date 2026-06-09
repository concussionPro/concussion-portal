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

  // Admin auth via x-admin-key / Bearer header or admin_session cookie
  // only. No ?adminKey= query-param path — keys in URLs leak via browser
  // history, server logs and Referer headers.
  if (!isAdminRequest(request)) {
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

  const rawTo = url.searchParams.get('to') || '/courses'
  // Only allow same-origin relative paths under /courses so this can't
  // be abused as an open-redirect.
  const safeTo = rawTo.startsWith('/courses') ? rawTo : '/courses'
  const response = NextResponse.redirect(new URL(safeTo, request.url))
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
