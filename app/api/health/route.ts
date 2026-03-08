// Health check endpoint for monitoring
import { NextResponse } from 'next/server'
import { list } from '@vercel/blob'
import { verifySessionToken } from '@/lib/jwt-session'

export const runtime = 'nodejs'

export async function GET() {
  const checks = {
    blobStorage: false,
    authentication: false,
    environment: false,
  }

  let status: 'healthy' | 'degraded' | 'down' = 'healthy'

  // Check Blob storage
  try {
    await list({ limit: 1 })
    checks.blobStorage = true
  } catch {
    status = 'degraded'
  }

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
    process.env.BLOB_READ_WRITE_TOKEN &&
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

  return NextResponse.json({ status }, { status: statusCode })
}
