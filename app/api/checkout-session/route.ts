import { NextRequest, NextResponse } from 'next/server'
import { retrieveCheckoutSession, COURSE_ACCESS_MAP } from '@/lib/stripe'
import { findUserByEmail } from '@/lib/users'
import { createJWTSession } from '@/lib/jwt-session'

// Rate limit: max 20 requests per session ID per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  // Prune expired entries to prevent unbounded growth
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap) {
      if (now > v.resetAt) rateLimitMap.delete(k)
    }
  }
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }
  if (entry.count >= 20) return false
  entry.count++
  return true
}

/**
 * GET /api/checkout-session?session_id=cs_xxx
 *
 * Returns checkout session details for the success page.
 * Rate limited. Only returns within 1 hour of session creation.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id')

    if (!sessionId || !sessionId.startsWith('cs_')) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      )
    }

    // Rate limit by session ID
    if (!checkRateLimit(sessionId)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      )
    }

    const session = await retrieveCheckoutSession(sessionId)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 400 }
      )
    }

    // BNPL (Afterpay/Klarna) redirects with payment_status='unpaid' — still valid
    if (session.payment_status !== 'paid' && session.payment_status !== 'unpaid') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Only allow retrieval within 4 hours of session creation (accommodates Afterpay/Klarna delays)
    const createdAt = (session.created || 0) * 1000
    if (Date.now() - createdAt > 4 * 60 * 60 * 1000) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 410 }
      )
    }

    const customerEmail = session.customer_details?.email || ''
    const customerName = session.customer_details?.name || ''
    const courseType = session.metadata?.courseType || 'online-only'

    // Redact email — show first name and masked email so user can confirm identity
    // without exposing the full address to unauthenticated requests
    const maskedEmail = customerEmail
      ? customerEmail.slice(0, 3) + '***@' + customerEmail.split('@')[1]
      : ''

    // Auto-login + JWT refresh after purchase — resolved BEFORE building the
    // response so the client knows whether a logged-in session was minted.
    // - Retries user lookup if webhook hasn't created/upgraded the user yet (#11)
    // - Always sets fresh JWT so access level reflects the purchase (#13)
    let sessionToken: string | null = null
    if (customerEmail) {
      try {
        let user = await findUserByEmail(customerEmail)
        // Webhook may still be processing — retry up to 3 times with 1.5s delay
        if (!user) {
          for (let attempt = 0; attempt < 3 && !user; attempt++) {
            await new Promise(r => setTimeout(r, 1500))
            user = await findUserByEmail(customerEmail)
          }
        }
        if (user) {
          const accessLevel = user.accessLevel as 'preview' | 'online-only' | 'full-course'
          sessionToken = createJWTSession(user.id, user.email, user.name || customerName, accessLevel, true)
        }
      } catch (err) {
        // Best effort — user can still use magic link
        console.error('Auto-login on success page failed:', err)
      }
    }

    const response = NextResponse.json({
      success: true,
      // Whether a logged-in session cookie was minted on this response. When
      // false (webhook race — user row not created yet), the success page must
      // NOT link into gated course content; the magic-link email is the path in.
      loggedIn: !!sessionToken,
      session: {
        customerName,
        customerEmail: maskedEmail,
        courseType,
        location: session.metadata?.location || '',
        amountPaid: (session.amount_total || 0) / 100,
        currency: (session.currency || 'aud').toUpperCase(),
      },
    })

    if (sessionToken) {
      response.cookies.set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Error retrieving checkout session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve session' },
      { status: 500 }
    )
  }
}
