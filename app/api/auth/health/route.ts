import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    magicLinkSecret: !!process.env.MAGIC_LINK_SECRET,
    sessionSecret: !!process.env.SESSION_SECRET || !!process.env.MAGIC_LINK_SECRET,
    nodeEnv: process.env.NODE_ENV,
  }

  return NextResponse.json({
    status: 'ok',
    checks,
    message: checks.magicLinkSecret && checks.sessionSecret
      ? 'All authentication secrets configured'
      : 'Missing required secrets',
  })
}
