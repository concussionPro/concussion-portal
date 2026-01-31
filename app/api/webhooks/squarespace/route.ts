import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createUser, findUserByEmail, findUserById } from '@/lib/users'
import { createJWTSession } from '@/lib/jwt-session'
import { sendMagicLinkEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Verify Squarespace webhook signature
    const signature = request.headers.get('x-squarespace-signature')
    const body = await request.text()

    if (process.env.SQUARESPACE_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.SQUARESPACE_WEBHOOK_SECRET)
        .update(body)
        .digest('base64')

      if (signature !== expectedSignature) {
        console.error('❌ Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const data = JSON.parse(body)

    // Handle order.create event
    if (data.type === 'order.create') {
      const order = data.data
      const customerEmail = order.customerEmail
      const customerName = `${order.billingAddress?.firstName || ''} ${order.billingAddress?.lastName || ''}`.trim() || 'Student'
      const orderTotal = parseFloat(order.grandTotal?.value || 0)
      const orderId = order.id

      console.log(`📦 New order: $${orderTotal} from ${customerEmail}`)

      // Determine access level based on price
      let accessLevel: 'online-only' | 'full-course' = 'online-only'

      if (orderTotal >= 1000) {
        // Full course ($1,190 or higher)
        accessLevel = 'full-course'
      } else if (orderTotal >= 400) {
        // Online only ($497 or similar)
        accessLevel = 'online-only'
      } else {
        // Not a course product - ignore
        console.log('⏭️  Order total too low - not a course purchase')
        return NextResponse.json({ success: true, message: 'Not a course product' })
      }

      if (!customerEmail) {
        console.error('❌ No customer email in order')
        return NextResponse.json({ error: 'No customer email' }, { status: 400 })
      }

      // Check if user already exists (upgrade scenario)
      const existingUser = await findUserByEmail(customerEmail)

      if (existingUser) {
        console.log(`👤 Existing user: ${customerEmail}`)

        // Upgrade if needed
        if (existingUser.accessLevel === 'online-only' && accessLevel === 'full-course') {
          console.log(`⬆️  Upgrading ${customerEmail} to full course`)
          existingUser.accessLevel = 'full-course'
        }

        // Generate magic link token
        const token = createJWTSession(existingUser.id, existingUser.email, existingUser.name, existingUser.accessLevel, true)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

        // Send magic link email
        await sendMagicLinkEmail(existingUser.email, token, baseUrl)

        return NextResponse.json({
          success: true,
          userId: existingUser.id,
          accessLevel: existingUser.accessLevel,
          upgraded: existingUser.accessLevel === 'full-course' && accessLevel === 'full-course',
        })
      }

      // Create new user
      console.log(`✨ Creating new user: ${customerEmail} (${accessLevel})`)

      const userId = await createUser({
        email: customerEmail,
        name: customerName,
        accessLevel: accessLevel as 'online-only' | 'full-course' | 'preview',
        squarespaceOrderId: orderId,
      })

      // Get the created user
      const newUser = await findUserById(userId)
      if (!newUser) {
        throw new Error('User creation failed')
      }

      // Generate magic link token
      const token = createJWTSession(userId, customerEmail, customerName, accessLevel, true)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

      // Send magic link email
      const emailSent = await sendMagicLinkEmail(customerEmail, token, baseUrl)

      console.log(`✅ User created: ${userId}`)
      console.log(`📧 Welcome email ${emailSent ? 'sent' : 'queued'}`)

      return NextResponse.json({
        success: true,
        userId,
        accessLevel,
        emailSent,
      })
    }

    return NextResponse.json({ success: true, message: 'Event processed' })
  } catch (error) {
    console.error('❌ Webhook error:', error)
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
