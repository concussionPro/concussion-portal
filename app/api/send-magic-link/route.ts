// API endpoint to send magic link login emails
import { NextResponse } from 'next/server'
import { sendMagicLinkEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json()

    // Validate required fields
    if (!email || !token) {
      return NextResponse.json(
        { error: 'Missing required fields: email, token' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Send magic link email
    const success = await sendMagicLinkEmail(email, token)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Magic link send error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
