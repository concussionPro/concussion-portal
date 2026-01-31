/**
 * Free Signup API - No Stripe Required
 * For free course signups (SCAT Mastery)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '@/lib/users'
import { createJWTSession } from '@/lib/jwt-session'
import { sendEmail } from '@/lib/resend-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    const userName = name || email.split('@')[0]

    // Check if user already exists
    const existingUser = await findUserByEmail(email)

    let userId: string
    if (existingUser) {
      userId = existingUser.id
      console.log(`Existing user signed up for free course: ${email}`)
    } else {
      // Create new user with preview access
      userId = await createUser({
        email,
        name: userName,
        accessLevel: 'preview', // Free SCAT Mastery access
      })
      console.log(`New user created for free course: ${email}`)
    }

    // Generate session token
    const token = createJWTSession(userId, email, userName, 'preview', true)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const loginLink = `${baseUrl}/auth/verify?email=${encodeURIComponent(email)}&token=${token}`

    // Send welcome email (Day 0 of nurture sequence)
    await sendEmail({
      to: email,
      subject: '🎉 Your FREE SCAT6/SCOAT6 Mastery Course is Ready',
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
              .content { padding: 32px 24px; }
              .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; }
              .highlight { background: #dbeafe; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0; }
              .footer { padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to SCAT Mastery!</h1>
              </div>
              <div class="content">
                <h2 style="margin-top: 0;">Hi ${userName},</h2>
                <p>Your FREE 2-hour SCAT6/SCOAT6 Mastery course is ready. Get 100% confident for your next concussion assessment.</p>

                <div class="highlight">
                  <strong>What you'll master in 2 hours:</strong><br>
                  ✓ Step-by-step SCAT6 & SCOAT6 administration<br>
                  ✓ Red flag recognition that avoids medicolegal risk<br>
                  ✓ When to use which tool (most GPs get this wrong)<br>
                  ✓ Clinical toolkit: referral templates, RTP forms<br>
                  ✓ 2 AHPRA-aligned CPD hours + certificate
                </div>

                <center>
                  <a href="${loginLink}" class="button">
                    Start Course Now →
                  </a>
                </center>

                <p style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                  <strong>Quick question:</strong> What's your biggest challenge with concussion management right now?<br>
                  Just reply to this email - I read every message.
                </p>

                <p style="color: #64748b;">
                  - Zac<br>
                  <em style="font-size: 14px;">Founder, Concussion Education Australia</em>
                </p>
              </div>
              <div class="footer">
                <p><strong>Concussion Education Australia</strong></p>
                <p>zac@concussion-education-australia.com</p>
              </div>
            </div>
          </body>
        </html>
      `,
      tags: [
        { name: 'sequence', value: 'scat-mastery' },
        { name: 'day', value: '0' },
      ],
    })

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent! Check your inbox.',
      loginLink, // Return for immediate redirect
    })
  } catch (error) {
    console.error('Free signup error:', error)
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    )
  }
}
