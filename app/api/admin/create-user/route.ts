import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserById } from '@/lib/users'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { sendMagicLinkEmail } from '@/lib/email'

function isAdminAuthorized(request: NextRequest): boolean {
  // Check admin API key header
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey && adminKey === process.env.ADMIN_API_KEY) return true
  // Check authorization bearer token
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === process.env.ADMIN_API_KEY) return true
  return false
}

export async function POST(request: NextRequest) {
  // Require admin authentication
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, name, amount } = await request.json()

    if (!email || !name || !amount) {
      return NextResponse.json(
        { error: 'Email, name, and amount are required' },
        { status: 400 }
      )
    }

    const accessLevel = amount >= 1000 ? 'full-course' : 'online-only'

    const userId = await createUser({
      email,
      name,
      accessLevel: accessLevel as 'online-only' | 'full-course' | 'preview',
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
  } catch (error: any) {
    console.error('Admin create user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}
