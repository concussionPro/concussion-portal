import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserById } from '@/lib/users'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { sendMagicLinkEmail } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'
import { isAdminRequest } from '@/lib/require-admin'

export async function POST(request: NextRequest) {
  // Require admin authentication
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, name, amount, location } = await request.json()

    if (!email || !name || !amount) {
      return NextResponse.json(
        { error: 'Email, name, and amount are required' },
        { status: 400 }
      )
    }

    const accessLevel = amount >= CONFIG.COURSE.PRICE_EARLY_BIRD ? 'full-course' : 'online-only'

    const userId = await createUser({
      email,
      name,
      accessLevel: accessLevel as 'online-only' | 'full-course' | 'preview',
      signupSource: 'admin',
      ...(location ? { workshopLocation: location } : {}),
    })

    const user = await findUserById(userId)
    if (!user) {
      throw new Error('User creation failed')
    }

    const token = createMagicToken(userId, email, name, accessLevel as 'online-only' | 'full-course' | 'preview')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const magicLink = `${baseUrl}/auth/verify?email=${encodeURIComponent(email)}&token=${token}`

    const emailSent = await sendMagicLinkEmail(email, token, baseUrl)

    console.log(`\u2705 User created via admin: ${email} (${accessLevel})`)

    return NextResponse.json({
      success: true,
      userId,
      accessLevel,
      emailSent,
      magicLink,
    })
  } catch (error) {
    console.error('Admin create user error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
