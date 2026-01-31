import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    MAGIC_LINK_SECRET: process.env.MAGIC_LINK_SECRET ? '✓ SET' : '❌ MISSING',
    SESSION_SECRET: process.env.SESSION_SECRET ? '✓ SET' : '❌ MISSING',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? '✓ SET' : '❌ MISSING',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? '✓ SET' : '❌ MISSING',
  }

  return NextResponse.json(envCheck)
}
