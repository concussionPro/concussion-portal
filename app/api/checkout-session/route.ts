import { NextRequest, NextResponse } from 'next/server'
import { retrieveCheckoutSession } from '@/lib/stripe'

/**
 * GET /api/checkout-session?session_id=cs_xxx
 *
 * Returns checkout session details for the success page.
 * Only returns non-sensitive info (name, email, course type, amount).
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

    const session = await retrieveCheckoutSession(sessionId)

    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        customerName: session.customer_details?.name || '',
        customerEmail: session.customer_details?.email || session.customer_email || '',
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
