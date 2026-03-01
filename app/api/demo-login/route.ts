import { NextResponse } from 'next/server'

// Demo login disabled in production — access only via magic link after payment
export async function GET() {
  return NextResponse.json(
    { error: 'Demo login is disabled. Please enroll at concussion-education-australia.com to access the course.' },
    { status: 403 }
  )
}

export async function POST() {
  return NextResponse.json(
    { error: 'Demo login is disabled. Please enroll at concussion-education-australia.com to access the course.' },
    { status: 403 }
  )
}
