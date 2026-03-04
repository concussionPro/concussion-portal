import { NextResponse } from 'next/server'

// Direct login disabled — access only via magic link after payment
export async function POST() {
  return NextResponse.json(
    { error: 'Direct login is disabled. Please use your magic link to log in.' },
    { status: 403 }
  )
}
