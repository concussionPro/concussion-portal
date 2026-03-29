import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createUser, findUserByEmail } from '@/lib/users'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { generateMagicLinkJWT } from '@/lib/magic-link-jwt'
import { sendMagicLinkEmail, sendEmail, escapeHtml } from '@/lib/resend-client'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { sql } from '@/lib/db'

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

    // Handle form submissions (SCAT form downloads, newsletter signups)
    if (data.topic === 'form_submission' || data.type === 'form_submission') {
      const fields = data.data?.fields || data.data?.submissionData || {}

      // Extract email — Squarespace field names vary
      const isEmailValue = (v: unknown): v is string =>
        typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      const email = (
        fields.email || fields.Email || fields.emailAddress ||
        Object.values(fields).find(isEmailValue)
      ) as string | undefined

      if (!email) {
        return NextResponse.json({ success: true, message: 'No email in form submission' })
      }

      const name = (fields.name || fields.Name || fields.firstName || fields['First Name'] || '') as string

      const existing = await findUserByEmail(email)
      if (existing) {
        return NextResponse.json({ success: true, message: 'User already exists' })
      }

      // Create preview user → enters SCAT Mastery nurture sequence
      const userId = await createUser({
        email,
        name: name || email.split('@')[0],
        accessLevel: 'preview',
        signupSource: 'squarespace',
      })

      // Send Day 0 welcome email (cron skips Day 0)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
      const userName = name || 'there'
      const loginLink = generateMagicLinkJWT(userId, email, name || email.split('@')[0], 'preview', baseUrl)
      const unsubToken = generateUnsubscribeToken(email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`

      const preseasonLink = `${baseUrl}/preseason`

      await sendEmail({
        to: email,
        subject: 'Your concussion education portal account is ready',
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%); padding: 40px 24px; text-align: center; }
                .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
                .header p { margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px; }
                .content { padding: 32px 24px; }
                .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; }
                .button-secondary { display: inline-block; padding: 14px 28px; background: white; color: #3b82f6; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 12px 0; border: 2px solid #3b82f6; }
                .highlight { background: #dbeafe; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0; }
                .tool-card { background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; margin: 16px 0; }
                .footer { padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>We've built you something new</h1>
                  <p>Concussion Education Australia now has a dedicated learning portal</p>
                </div>
                <div class="content">
                  <h2 style="margin-top: 0;">Hi ${escapeHtml(userName)},</h2>
                  <p>You signed up for SCAT resources through our website. We've since built a dedicated learning portal with free clinical tools and courses — and your account is already set up.</p>

                  <div class="highlight">
                    <strong>Free SCAT6/SCOAT6 Mastery Course (~3 hours, 2 CPD points):</strong><br><br>
                    &bull; Step-by-step SCAT6 &amp; SCOAT6 administration<br>
                    &bull; Red flag recognition and escalation criteria<br>
                    &bull; When to use SCAT6 vs SCOAT6<br>
                    &bull; Clinical toolkit: referral templates, RTP forms<br>
                    &bull; Certificate + 2 AHPRA-aligned CPD points on completion
                  </div>

                  <center>
                    <a href="${loginLink}" class="button">
                      Access the Free Course →
                    </a>
                  </center>

                  <div class="tool-card">
                    <strong>New: Pre-Season Baseline Testing Tool</strong><br><br>
                    Run digital cognitive baselines on your athletes — immediate recall, delayed recall, concentration, balance (BESS). Results are stored and exported as a professional PDF report you can file in their clinical record.<br><br>
                    <center><a href="${preseasonLink}" class="button-secondary">Try the Baseline Tool →</a></center>
                  </div>

                  <p>The portal is now the home for all our courses, tools, and clinical resources. You'll find everything there going forward.</p>

                  <p style="color: #64748b;">
                    - Zac Lewis<br>
                    <em style="font-size: 14px;">Osteopath (B.Clin.Sci., M.Ost.Med) · Founder, Concussion Education Australia</em>
                  </p>
                </div>
                <div class="footer">
                  <p><strong>Concussion Education Australia</strong></p>
                  <p>zac@concussion-education-australia.com</p>
                  <p style="margin-top: 12px; font-size: 12px;"><a href="${unsubscribeUrl}" style="color: #94a3b8;">Unsubscribe from course emails</a></p>
                </div>
              </div>
            </body>
          </html>
        `,
        tags: [
          { name: 'sequence', value: 'scat-mastery' },
          { name: 'day', value: '0' },
          { name: 'source', value: 'squarespace-form' },
        ],
      })

      // Record audit key so cron won't re-send Day 0
      await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${`scat_day0_${userId}`}, NOW()) ON CONFLICT (audit_key) DO NOTHING`

      console.log(`[Squarespace Form] Created preview user + sent Day 0: ${email}`)
      return NextResponse.json({ success: true, message: 'User created from form submission' })
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
