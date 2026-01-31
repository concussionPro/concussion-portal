import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserById } from '@/lib/users'
import { createJWTSession } from '@/lib/jwt-session'
import { sendMagicLinkEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, name, amount } = await request.json()

    // Validate inputs
    if (!email || !name || !amount) {
      return NextResponse.json(
        { error: 'Email, name, and amount are required' },
        { status: 400 }
      )
    }

    // Determine access level based on amount
    const accessLevel = amount >= 1000 ? 'full-course' : 'online-only'

    // Create user
    const userId = await createUser({
      email,
      name,
      accessLevel: accessLevel as 'online-only' | 'full-course' | 'preview',
    })

    // Get the created user
    const user = await findUserById(userId)
    if (!user) {
      throw new Error('User creation failed')
    }

    // Generate magic link token
    const token = createJWTSession(userId, email, name, accessLevel as 'online-only' | 'full-course', true)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const magicLink = `${baseUrl}/auth/verify?email=${encodeURIComponent(email)}&token=${token}`

    // Send magic link email
    const emailSent = await sendMagicLinkEmail(email, token, baseUrl)

    console.log(`✅ User created via admin: ${email} (${accessLevel})`)
    console.log(`📧 Email ${emailSent ? 'sent' : 'queued'}`)

    return NextResponse.json({
      success: true,
      userId,
      accessLevel,
      emailSent,
      magicLink, // Include link in response for testing
    })
  } catch (error: any) {
    console.error('Admin create user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}
