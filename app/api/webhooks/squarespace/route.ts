import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createUser, findUserByEmail } from '@/lib/users'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { sendMagicLinkEmail } from '@/lib/resend-client'

export async function POST(request: NextRequest) {
  try {
    // Verify Squarespace webhook signature
    const signature = request.headers.get('x-squarespace-signature')
    const body = await request.text()

    if (!process.env.SQUARESPACE_WEBHOOK_SECRET) {
      console.error('SQUARESPACE_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.SQUARESPACE_WEBHOOK_SECRET)
      .update(body)
      .digest('base64')

    if (
      !signature ||
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(body)

    // Handle order.create event
    if (data.type === 'order.create') {
      const order = data.data
      const customerEmail = order.customerEmail
      const customerName = `${order.billingAddress?.firstName || ''} ${order.billingAddress?.lastName || ''}`.trim() || 'Student'
      const orderTotal = parseFloat(order.grandTotal?.value || 0)
      const orderId = order.id

      console.log(`New order: $${orderTotal} from ${customerEmail}`)

      // Determine access level based on price
      let accessLevel: 'online-only' | 'full-course' = 'online-only'

      if (orderTotal >= 1000) {
        accessLevel = 'full-course'
      } else if (orderTotal >= 400) {
        accessLevel = 'online-only'
      } else {
        console.log('Order total too low - not a course purchase')
        return NextResponse.json({ success: true, message: 'Not a course product' })
      }

      if (!customerEmail) {
        console.error('No customer email in order')
        return NextResponse.json({ error: 'No customer email' }, { status: 400 })
      }

      // Check if user already exists (upgrade scenario)
      const existingUser = await findUserByEmail(customerEmail)

      if (existingUser) {
        console.log(`Existing user: ${customerEmail}`)

        // FIX: Use createUser() to properly persist the upgrade (it handles save internally)
        if (
          (existingUser.accessLevel === 'preview' || existingUser.accessLevel === 'online-only') &&
          accessLevel === 'full-course'
        ) {
          console.log(`Upgrading ${customerEmail} to full course`)
          await createUser({
            email: customerEmail,
            name: customerName,
            accessLevel: 'full-course',
            squarespaceOrderId: orderId,
          })
        }

        const finalAccess = accessLevel === 'full-course' ? 'full-course' : existingUser.accessLevel

        // FIX: Use createMagicToken (not createJWTSession) for magic link emails
        const token = createMagicToken(existingUser.id, existingUser.email, existingUser.name, finalAccess)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
        await sendMagicLinkEmail(existingUser.email, token, baseUrl)

        return NextResponse.json({ success: true })
      }

      // Create new user
      console.log(`Creating new user: ${customerEmail} (${accessLevel})`)

      const userId = await createUser({
        email: customerEmail,
        name: customerName,
        accessLevel,
        squarespaceOrderId: orderId,
        signupSource: 'purchase',
      })

      // FIX: Use createMagicToken for magic link emails
      const token = createMagicToken(userId, customerEmail, customerName, accessLevel)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
      const emailSent = await sendMagicLinkEmail(customerEmail, token, baseUrl)

      console.log(`User created: ${userId}`)
      console.log(`Welcome email ${emailSent ? 'sent' : 'queued'}`)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true, message: 'Event processed' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhooks/squarespace',
    timestamp: new Date().toISOString(),
  })
}
