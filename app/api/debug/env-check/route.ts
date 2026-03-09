import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function GET(request: NextRequest) {
  // Require admin API key (timing-safe)
  const adminKey = request.headers.get('x-admin-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  if (!process.env.ADMIN_API_KEY || !adminKey || !timingSafeCompare(adminKey, process.env.ADMIN_API_KEY)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const envCheck = {
    MAGIC_LINK_SECRET: process.env.MAGIC_LINK_SECRET ? 'SET' : 'MISSING',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'MISSING',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'MISSING',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'MISSING',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'MISSING',
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? 'SET' : 'MISSING',
    CRON_SECRET: process.env.CRON_SECRET ? 'SET' : 'MISSING',
    ADMIN_API_KEY: process.env.ADMIN_API_KEY ? 'SET' : 'MISSING',
  }

  return NextResponse.json(envCheck)
}
