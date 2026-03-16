/**
 * Email Gate API — captures email, creates preview account, sets session cookie immediately.
 * Used by SCAT form PDF export to gate downloads behind email capture.
 * Unlike /api/signup-free which sends a magic link, this endpoint logs the user in immediately.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '@/lib/users'
import { createJWTSession } from '@/lib/jwt-session'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const { email } = body as { email?: string }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // Rate limit by IP and email
    if (!checkRateLimit(`gate-ip:${ip}`, 10) || !checkRateLimit(`gate-email:${email.toLowerCase()}`, 5)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const userName = normalizedEmail.split('@')[0]

    // Check if user already exists
    const existingUser = await findUserByEmail(normalizedEmail)

    let userId: string
    let accessLevel: 'preview' | 'online-only' | 'full-course' = 'preview'

    if (existingUser) {
      userId = existingUser.id
      accessLevel = existingUser.accessLevel as typeof accessLevel
    } else {
      // Create new user with preview access
      userId = await createUser({
        email: normalizedEmail,
        name: userName,
        accessLevel: 'preview',
        signupSource: 'free-course',
      })
    }

    // Create session token and set cookie immediately
    const sessionToken = createJWTSession(userId, normalizedEmail, existingUser?.name || userName, accessLevel, true)

    const response = NextResponse.json({ success: true })
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    // Send welcome email in background (don't await — don't block PDF download)
    if (!existingUser) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
      const unsubToken = generateUnsubscribeToken(normalizedEmail)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(normalizedEmail)}&token=${unsubToken}`
      sendEmail({
        to: normalizedEmail,
        subject: 'Your SCAT6 assessment PDF + free concussion course',
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
                .header h1 { margin: 0; color: white; font-size: 24px; font-weight: 700; }
                .content { padding: 32px 24px; }
                .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; }
                .highlight { background: #dbeafe; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0; }
                .footer { padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Your SCAT Assessment Tools</h1>
                </div>
                <div class="content">
                  <h2 style="margin-top: 0;">Hi ${escapeHtml(userName)},</h2>
                  <p>Thanks for using our digital SCAT forms. Your PDF has been downloaded — here's what else is available for you.</p>

                  <div class="highlight">
                    <strong>Your free account includes:</strong><br>
                    &bull; Digital SCAT6, SCOAT6 &amp; Child SCAT6 forms with PDF export<br>
                    &bull; Free SCAT6/SCOAT6 Mastery course (~3 hours)<br>
                    &bull; 2 AHPRA-aligned CPD points + certificate
                  </div>

                  <center>
                    <a href="${baseUrl}/dashboard?utm_source=email&utm_medium=transactional&utm_campaign=scat-export-welcome" class="button">
                      Go to Your Dashboard →
                    </a>
                  </center>

                  <p style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #64748b;">
                    - Zac Lewis<br>
                    <em style="font-size: 14px;">Osteopath (B.Clin.Sci., M.Ost.Med) · Founder, Concussion Education Australia</em>
                  </p>
                </div>
                <div class="footer">
                  <p><strong>Concussion Education Australia</strong></p>
                  <p>zac@concussion-education-australia.com</p>
                  <p style="margin-top: 12px; font-size: 12px;"><a href="${unsubscribeUrl}" style="color: #94a3b8;">You can unsubscribe from course emails at any time.</a></p>
                </div>
              </div>
            </body>
          </html>
        `,
        tags: [
          { name: 'sequence', value: 'scat-export' },
          { name: 'day', value: '0' },
        ],
      }).catch((err) => console.error('Email gate welcome email failed:', err))
    }

    return response
  } catch (error) {
    console.error('Email gate error:', error)
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}
