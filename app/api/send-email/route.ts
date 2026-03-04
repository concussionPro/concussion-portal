import { NextResponse } from 'next/server'

// Public email sending disabled — all emails now sent server-side via lib/resend-client.ts
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is disabled. Emails are sent server-side only.' },
    { status: 403 }
  )
}
