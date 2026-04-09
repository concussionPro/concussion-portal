// Health check endpoint for monitoring
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'

export const runtime = 'nodejs'

function isAdmin(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key')
  const expected = process.env.ADMIN_API_KEY
  if (!expected || !adminKey) return false
  try {
    return crypto.timingSafeEqual(
      crypto.createHmac('sha256', 'compare').update(adminKey).digest(),
      crypto.createHmac('sha256', 'compare').update(expected).digest()
    )
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  // Public: minimal health check
  if (!isAdmin(request)) {
    try {
      await sql`SELECT 1`
      return NextResponse.json({ status: 'healthy' })
    } catch {
      return NextResponse.json({ status: 'down' }, { status: 503 })
    }
  }

  // Admin: full diagnostics
  const checks = {
    database: false,
    authentication: false,
    environment: false,
  }

  let status: 'healthy' | 'degraded' | 'down' = 'healthy'

  try {
    await sql`SELECT 1`
    checks.database = true
  } catch {
    status = 'degraded'
  }

  let userCount = 0
  try {
    const { rows } = await sql`SELECT COUNT(*)::int as n FROM users`
    userCount = Number(rows[0].n)
  } catch { /* ignore */ }

  checks.environment = !!(
    process.env.MAGIC_LINK_SECRET &&
    process.env.RESEND_API_KEY
  )

  if (!checks.environment) {
    status = 'degraded'
  }

  const healthyCount = Object.values(checks).filter(Boolean).length
  if (healthyCount < 2) {
    status = 'down'
  }

  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 503 : 500

  return NextResponse.json({
    status,
    checks,
    userCount,
  }, { status: statusCode })
}
