import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { ADMIN_COOKIE_NAME, adminCookieOptions, createAdminSessionToken } from '@/lib/admin-session'

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    // Still do a comparison to equalize timing before returning false
    crypto.timingSafeEqual(bufA, bufA)
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}

export async function POST(request: NextRequest) {
  const envKey = process.env.ADMIN_API_KEY
  if (!envKey) {
    return NextResponse.json({ error: 'Admin API not configured' }, { status: 503 })
  }

  let body: { key?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const submitted = typeof body?.key === 'string' ? body.key : ''
  if (!submitted || !timingSafeStringEqual(submitted, envKey)) {
    return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 })
  }

  const token = createAdminSessionToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE_NAME, token, adminCookieOptions())
  return res
}
