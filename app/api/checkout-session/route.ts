import { NextRequest, NextResponse } from 'next/server'
import { retrieveCheckoutSession } from '@/lib/stripe'

// Rate limit: max 5 requests per session ID per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }
  if (entry.count >= 5) return false
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

    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Only allow retrieval within 1 hour of session creation
    const createdAt = (session.created || 0) * 1000
    if (Date.now() - createdAt > 60 * 60 * 1000) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 410 }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        customerName: session.customer_details?.name || '',
        courseType: session.metadata?.courseType || 'online-only',
        location: session.metadata?.location || '',
        amountPaid: (session.amount_total || 0) / 100,
      },
    })
  } catch (error) {
    console.error('Error retrieving checkout session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve session' },
      { status: 500 }
    )
  }
}
