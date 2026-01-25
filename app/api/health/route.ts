// Health check endpoint for monitoring
import { NextResponse } from 'next/server'
import { head, list } from '@vercel/blob'
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
  } catch (error) {
    status = 'degraded'
    console.error('Blob storage check failed:', error)
  }

  // Check authentication system
  try {
    const testToken = 'invalid.token'
    const result = verifySessionToken(testToken)
    // Should return null for invalid token
    checks.authentication = result === null
  } catch (error) {
    status = 'degraded'
    console.error('Authentication check failed:', error)
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

  // If multiple systems are down, mark as down
  const healthyCount = Object.values(checks).filter(Boolean).length
  if (healthyCount < 2) {
    status = 'down'
  }

  const response = {
    status,
    checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }

  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 503 : 500

  return NextResponse.json(response, { status: statusCode })
}
