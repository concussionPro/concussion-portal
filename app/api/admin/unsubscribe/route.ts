import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { unsubscribeUser } from '@/lib/users'

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

function isAuthorized(request: NextRequest): boolean {
  // Accept ADMIN_API_KEY via x-admin-key header (same as admin emails page)
  const adminKey = process.env.ADMIN_API_KEY
  if (adminKey) {
    const xAdminKey = request.headers.get('x-admin-key')
    if (xAdminKey && timingSafeCompare(xAdminKey, adminKey)) return true
  }
  // Also accept CRON_SECRET via Bearer token
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

  const body = await request.json()
  const email = body.email?.trim()?.toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const success = await unsubscribeUser(email)
  if (success) {
    console.log(`Admin unsubscribed: ${email}`)
    return NextResponse.json({ success: true, message: `${email} unsubscribed` })
  } else {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
