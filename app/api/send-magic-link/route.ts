// API endpoint to send magic link login emails
// Security: Generic response prevents email enumeration
// Security: Rate limiting prevents brute force and email spam
import { NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/users'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { sendMagicLinkEmail } from '@/lib/email'
import { logAuthFailure, logCriticalError, measurePerformance } from '@/lib/monitoring'

// In-memory rate limiting (resets on cold start, but sufficient for Vercel serverless)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const EMAIL_RATE_LIMIT = 3 // max attempts per email per window
const IP_RATE_LIMIT = 10 // max attempts per IP per window
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (entry.count >= limit) {
    return false
  }
  
  entry.count++
  return true
}

export async function POST(request: Request) {
  try {
    // Get IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    
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

    const normalizedEmail = email.toLowerCase().trim()

    // Rate limit by IP
    if (!checkRateLimit(`ip:${ip}`, IP_RATE_LIMIT)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    // Rate limit by email
    if (!checkRateLimit(`email:${normalizedEmail}`, EMAIL_RATE_LIMIT)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    // Check if user exists (with performance monitoring)
    const user = await measurePerformance('findUserByEmail', () => findUserByEmail(normalizedEmail))

    if (!user) {
      // Log failed login attempts for monitoring (server-side only)
      await logAuthFailure({
        endpoint: '/api/send-magic-link',
        email: normalizedEmail,
        reason: 'User not found',
      })

      // SECURITY: Return same success response to prevent email enumeration
      // Attacker cannot distinguish between existing and non-existing accounts
      return NextResponse.json({ success: true })
    }

    // Generate magic link token
    const token = createMagicToken(user.id, user.email, user.name, user.accessLevel)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

    // Send magic link email (with performance monitoring)
    const emailSent = await measurePerformance('sendMagicLinkEmail', () =>
      sendMagicLinkEmail(user.email, token, baseUrl)
    )

    if (emailSent) {
      return NextResponse.json({ success: true })
    } else {
      // In development mode, if email fails, return the magic link directly
      const isDevelopment = process.env.NODE_ENV === 'development'

      if (isDevelopment) {
        const magicLink = `${baseUrl}/auth/verify?email=${encodeURIComponent(user.email)}&token=${token}`
        console.log('\u26a0\ufe0f  Email service not configured - returning magic link directly')
        console.log('\ud83d\udd17 Magic Link:', magicLink)
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
