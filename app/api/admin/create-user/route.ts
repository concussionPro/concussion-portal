import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/users'
import { generateMagicLink } from '@/lib/magic-link-auth'
import { sendWelcomeEmail } from '@/lib/email-service'

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
    const user = createUser({
      email,
      name,
      accessLevel,
    })

    // Generate magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const magicLink = generateMagicLink(user.id, user.email, baseUrl)

    // Send welcome email
    const emailSent = await sendWelcomeEmail({
      email: user.email,
      name: user.name,
      magicLink,
      accessLevel: user.accessLevel,
    })

    console.log(`✅ User created via admin: ${user.email} (${accessLevel})`)
    console.log(`📧 Email ${emailSent ? 'sent' : 'queued'}`)

    return NextResponse.json({
      success: true,
      userId: user.id,
      accessLevel: user.accessLevel,
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
