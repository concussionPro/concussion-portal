// API endpoint to send magic link login emails
// Security: Generic response prevents email enumeration
// Security: Rate limiting prevents brute force and email spam
import { NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/users'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { sendMagicLinkEmail } from '@/lib/resend-client'
import { logAuthFailure, logCriticalError, measurePerformance } from '@/lib/monitoring'
import { getClientIp } from '@/lib/get-client-ip'
import { rateLimit } from '@/lib/rate-limit'
import { isSafeRelativePath } from '@/lib/safe-redirect'
import { CONFIG } from '@/lib/config'

const EMAIL_RATE_LIMIT = 3 // max attempts per email per window
const IP_RATE_LIMIT = 10 // max attempts per IP per window
const RATE_LIMIT_WINDOW = 15 * 60 // 15 minutes

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { email, redirect } = body as { email?: string; redirect?: string }

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

    // The person who trips this limit is almost always a customer whose email
    // never arrived — they pressed "Send login link" a few times. "Try again in
    // a few minutes" understated a window that is up to 15 MINUTES long and
    // named no other way in, so the only remaining move was to email the
    // founder. State the REAL wait (the limiter already computes it) and name
    // the support address in the same breath. The limit itself is unchanged.
    const throttled = (resetInSec: number) => {
      const mins = Math.max(1, Math.ceil(resetInSec / 60))
      return NextResponse.json(
        {
          error:
            `Too many login links requested. Please try again in ${mins} minute${mins === 1 ? '' : 's'}. ` +
            `If the email still isn't arriving, check your spam folder or email ${CONFIG.CONTACT_EMAIL} and we'll get you in.`,
        },
        { status: 429 }
      )
    }

    // Rate limit by IP (shared across instances via Vercel KV)
    const ipLimit = await rateLimit({ key: `magic:ip:${ip}`, limit: IP_RATE_LIMIT, windowSec: RATE_LIMIT_WINDOW })
    if (!ipLimit.ok) return throttled(ipLimit.resetIn)

    // Rate limit by email
    const emailLimit = await rateLimit({ key: `magic:email:${normalizedEmail}`, limit: EMAIL_RATE_LIMIT, windowSec: RATE_LIMIT_WINDOW })
    if (!emailLimit.ok) return throttled(emailLimit.resetIn)

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

    // Carry the caller's post-login destination into the emailed link. Only
    // same-origin relative paths survive; /api/auth/verify still applies the
    // entitlement allowlist before honouring it.
    const safeRedirect = isSafeRelativePath(redirect) ? redirect : null

    // Send magic link email (with performance monitoring)
    const emailSent = await measurePerformance('sendMagicLinkEmail', () =>
      sendMagicLinkEmail(user.email, token, baseUrl, safeRedirect)
    )

    if (emailSent) {
      return NextResponse.json({ success: true })
    } else {
      // In development mode, if email fails, return the magic link directly
      const isDevelopment = process.env.NODE_ENV === 'development'

      if (isDevelopment) {
        const magicLink = `${baseUrl}/auth/verify?email=${encodeURIComponent(user.email)}&token=${token}${safeRedirect ? `&redirect=${encodeURIComponent(safeRedirect)}` : ''}`
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
