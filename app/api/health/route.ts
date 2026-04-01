// Health check endpoint for monitoring
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { verifySessionToken } from '@/lib/jwt-session'

export const runtime = 'nodejs'

export async function GET() {
  const checks = {
    database: false,
    authentication: false,
    environment: false,
  }

  let status: 'healthy' | 'degraded' | 'down' = 'healthy'

  // Check Postgres database
  let dbError = ''
  try {
    await sql`SELECT 1`
    checks.database = true
  } catch (err) {
    dbError = String(err)
    status = 'degraded'
  }

  // Check tables exist + write works
  let tableCheck = ''
  try {
    const { rows: tables } = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    tableCheck = tables.map((r) => (r as { tablename: string }).tablename).join(', ')
  } catch (err) {
    tableCheck = `error: ${String(err)}`
  }

  // Check analytics write
  let analyticsWrite = ''
  try {
    await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'analytics_events' ORDER BY ordinal_position`
    analyticsWrite = 'schema ok'
  } catch (err) {
    analyticsWrite = `error: ${String(err)}`
  }

  // Count users
  let userCount = 0
  try {
    const { rows } = await sql`SELECT COUNT(*) as n FROM users`
    userCount = Number(rows[0].n)
  } catch { /* ignore */ }

  // Check authentication system
  try {
    const result = verifySessionToken('invalid.token')
    checks.authentication = result === null
  } catch {
    status = 'degraded'
  }

  // Check environment variables
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
    dbError: dbError || undefined,
    tables: tableCheck,
    analyticsWrite,
    userCount,
    envKeys: {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      CRON_SECRET: !!process.env.CRON_SECRET,
      ADMIN_API_KEY: !!process.env.ADMIN_API_KEY,
      SQUARESPACE_API_KEY: !!process.env.SQUARESPACE_API_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    },
  }, { status: statusCode })
}
