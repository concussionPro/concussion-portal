import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/users'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * POST /api/admin/generate-login-link
 * Body: { email: string, redirect?: string, ttlDays?: number }
 *
 * Returns a one-click magic-link URL for a known user, with an
 * optional post-login redirect target. Default TTL is 365 days so
 * admin-emailed links don't expire on the recipient.
 *
 * Use case: admin emails a user a single link that auto-logs them in
 * and drops them on a specific destination page (e.g. /upgrade,
 * /dashboard, /courses/xyz). No "request magic link" step for the
 * recipient.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { email?: string; redirect?: string; ttlDays?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const email = body.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 })
  }
  const redirect = body.redirect?.trim()
  if (redirect && !/^\/[A-Za-z0-9\-_/?&=.%]*$/.test(redirect)) {
    return NextResponse.json({ error: 'invalid redirect path' }, { status: 400 })
  }
  const ttlDays = typeof body.ttlDays === 'number' && body.ttlDays > 0 ? Math.min(body.ttlDays, 3650) : 365

  const user = await findUserByEmail(email)
  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  const ttlMs = ttlDays * 24 * 60 * 60 * 1000
  const token = createMagicToken(user.id, user.email, user.name, user.accessLevel, ttlMs)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const params = new URLSearchParams({ token })
  if (redirect) params.set('redirect', redirect)
  const url = `${baseUrl}/auth/verify?${params.toString()}`

  return NextResponse.json({
    success: true,
    url,
    expiresInDays: ttlDays,
    user: { email: user.email, name: user.name, accessLevel: user.accessLevel },
  })
}
