import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createUser, findUserByEmail } from '@/lib/users'
import { generateMagicLinkJWT } from '@/lib/magic-link-jwt'
import { sendWelcomeEmail } from '@/lib/email-service'

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

        // Generate new magic link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
        const magicLink = generateMagicLinkJWT(existingUser.id, existingUser.email, baseUrl)

        // Send welcome/upgrade email
        await sendWelcomeEmail({
          email: existingUser.email,
          name: existingUser.name,
          magicLink,
          accessLevel: existingUser.accessLevel,
        })

        return NextResponse.json({
          success: true,
          userId: existingUser.id,
          accessLevel: existingUser.accessLevel,
          upgraded: existingUser.accessLevel === 'full-course' && accessLevel === 'full-course',
        })
      }

      // Create new user
      console.log(`✨ Creating new user: ${customerEmail} (${accessLevel})`)

      const newUser = await createUser({
        email: customerEmail,
        name: customerName,
        accessLevel,
        squarespaceOrderId: orderId,
      })

      // Generate magic link
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
      const magicLink = generateMagicLinkJWT(newUser.id, newUser.email, baseUrl)

      // Send welcome email
      const emailSent = await sendWelcomeEmail({
        email: newUser.email,
        name: newUser.name,
        magicLink,
        accessLevel: newUser.accessLevel,
      })

      console.log(`✅ User created: ${newUser.id}`)
      console.log(`📧 Welcome email ${emailSent ? 'sent' : 'queued'}`)

      return NextResponse.json({
        success: true,
        userId: newUser.id,
        accessLevel: newUser.accessLevel,
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
