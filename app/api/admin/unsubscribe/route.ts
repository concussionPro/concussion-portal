import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { unsubscribeUser } from '@/lib/users'
import { isAdminRequest } from '@/lib/require-admin'
import { recordAdminAction } from '@/lib/admin-audit'

function timingSafeCompare(a: string, b: string): boolean {
  const aHash = crypto.createHmac('sha256', 'compare').update(a).digest()
  const bHash = crypto.createHmac('sha256', 'compare').update(b).digest()
  return crypto.timingSafeEqual(aHash, bHash)
}

function isAuthorized(request: NextRequest): boolean {
  // Admin cookie / x-admin-key / Bearer ADMIN_API_KEY — the usual admin paths
  if (isAdminRequest(request)) return true
  // Also accept CRON_SECRET via Bearer token for scheduled cleanups
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (bearer && timingSafeCompare(bearer, cronSecret)) return true
  }
  return false
}

/**
 * POST /api/admin/unsubscribe
 *
 * Admin endpoint to manually unsubscribe a user from nurture emails.
 * Auth: x-admin-key header OR Bearer <CRON_SECRET>
 *
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = (body.email as string)?.trim()?.toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const success = await unsubscribeUser(email)
  if (success) {
    console.log(`Admin unsubscribed: ${email.slice(0, 3)}***`)
    await recordAdminAction(request, { route: '/api/admin/unsubscribe', target: email })
    return NextResponse.json({ success: true, message: `${email} unsubscribed` })
  } else {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
