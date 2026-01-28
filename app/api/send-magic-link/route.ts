// API endpoint to send magic link login emails
import { NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/users'
import { generateMagicLinkJWT } from '@/lib/magic-link-jwt'
import { sendWelcomeEmail } from '@/lib/email-service'
import { logAuthFailure, logCriticalError, measurePerformance } from '@/lib/monitoring'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Check if user exists (with performance monitoring)
    const user = await measurePerformance('findUserByEmail', () => findUserByEmail(email))

    if (!user) {
      // Log failed login attempts for monitoring
      await logAuthFailure({
        endpoint: '/api/send-magic-link',
        email,
        reason: 'User not found',
      })

      return NextResponse.json(
        { error: 'No account found with this email. Please enroll first.' },
        { status: 404 }
      )
    }

    // Generate magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const magicLink = generateMagicLinkJWT(user.id, user.email, user.name, user.accessLevel, baseUrl)

    // Send welcome email with magic link (with performance monitoring)
    const emailSent = await measurePerformance('sendWelcomeEmail', () =>
      sendWelcomeEmail({
        email: user.email,
        name: user.name,
        magicLink,
        accessLevel: user.accessLevel,
      })
    )

    if (emailSent) {
      return NextResponse.json({ success: true })
    } else {
      // In development mode, if email fails, return the magic link directly
      const isDevelopment = process.env.NODE_ENV === 'development'

      if (isDevelopment) {
        console.log('⚠️  Email service not configured - returning magic link directly')
        console.log('🔗 Magic Link:', magicLink)
        return NextResponse.json({
          success: true,
          devMode: true,
          magicLink,
          message: 'Email service not configured. Use /dev-login for direct access.'
        })
      }

      // Log email send failures in production
      await logCriticalError(new Error('Failed to send magic link email'), {
        endpoint: '/api/send-magic-link',
        userId: user.id,
        email: user.email,
      })

      return NextResponse.json(
        { error: 'Failed to send email. Please contact support.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Magic link send error:', error)

    // Log critical errors
    if (error instanceof Error) {
      await logCriticalError(error, {
        endpoint: '/api/send-magic-link',
      })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
