import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-squarespace-signature')
    const body = await request.text()

    if (process.env.SQUARESPACE_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.SQUARESPACE_WEBHOOK_SECRET)
        .update(body)
        .digest('base64')

      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const data = JSON.parse(body)

    if (data.type === 'order.create' && data.data.fulfillmentStatus === 'FULFILLED') {
      const order = data.data
      const customerEmail = order.customerEmail
      const orderTotal = order.grandTotal?.value || 0

      const hasCourseProduct = orderTotal >= 1000

      if (hasCourseProduct && customerEmail) {
        console.log('✅ Course enrollment:', customerEmail)
        // TODO: Create user account and send welcome email
        return NextResponse.json({ success: true, email: customerEmail })
      }
    }

    return NextResponse.json({ success: true, message: 'Event processed' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
