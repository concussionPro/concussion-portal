/**
 * Free Signup API - No Stripe Required
 * For free course signups (SCAT6 Mastery)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail, updateLastLogin } from '@/lib/users'
import { createJWTSession } from '@/lib/jwt-session'
import { generateMagicLinkJWT } from '@/lib/magic-link-jwt'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { sql } from '@/lib/db'

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
    const ip = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || 'unknown'

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const { email, name } = body as { email?: string; name?: string }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Rate limit by IP and email
    if (!checkRateLimit(`ip:${ip}`, 10) || !checkRateLimit(`email:${email.toLowerCase()}`, 3)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    const rawName = (name || email.split('@')[0]).slice(0, 100)
    const userName = rawName

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
        accessLevel: 'preview',
        signupSource: 'free-course',
      })
      console.log(`New user created for free course: ${email}`)
    }

    // Log analytics event (server-side — client can't track this)
    try {
      await sql`
        INSERT INTO analytics_events (event_type, event_data, session_id, timestamp_ms, user_agent, referrer, path, search, ip, country)
        VALUES (
          'free_course_signup',
          ${JSON.stringify({ email: email.toLowerCase(), name: userName, isExisting: !!existingUser })}::jsonb,
          ${'server_' + Date.now()},
          ${Date.now()},
          ${request.headers.get('user-agent') || 'unknown'},
          ${request.headers.get('referer') || null},
          '/api/signup-free',
          ${null},
          ${ip},
          ${request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || null}
        )
      `
    } catch (err) {
      console.error('Failed to log free signup analytics:', err)
    }

    // Auto-login: set session cookie immediately so user is logged in without clicking email
    const accessLevel = existingUser ? existingUser.accessLevel : 'preview'
    const sessionToken = createJWTSession(userId, email.toLowerCase(), userName, accessLevel as 'preview' | 'online-only' | 'full-course', true)

    // Update last_login so admin dashboard shows accurate data
    await updateLastLogin(userId)

    // Generate magic link for the email (backup login if they open on a different device)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const loginLink = generateMagicLinkJWT(userId, email, userName, accessLevel, baseUrl)

    // Generate unsubscribe URL
    const unsubToken = generateUnsubscribeToken(email)
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`

    // Send welcome email (Day 0 of nurture sequence)
    await sendEmail({
      to: email,
      subject: 'Your free SCAT6/SCOAT6 Mastery Course is ready',
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
              .content { padding: 32px 24px; }
              .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; }
              .highlight { background: #dbeafe; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0; }
              .footer { padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to SCAT6 Mastery</h1>
              </div>
              <div class="content">
                <h2 style="margin-top: 0;">Hi ${escapeHtml(userName)},</h2>
                <p>Your free SCAT6/SCOAT6 Mastery course is ready. Here's what it covers.</p>

                <div class="highlight">
                  <strong>Course overview (~2 hours):</strong><br>
                  &bull; Step-by-step SCAT6 &amp; SCOAT6 administration<br>
                  &bull; Red flag recognition and escalation criteria<br>
                  &bull; When to use SCAT6 vs SCOAT6 (acute vs office follow-up)<br>
                  &bull; Clinical toolkit: referral templates, RTP forms<br>
                  &bull; 2 AHPRA-aligned CPD points + certificate
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
        { name: 'sequence', value: 'scat-mastery' },
        { name: 'day', value: '0' },
      ],
    })

    const response = NextResponse.json({
      success: true,
      message: 'You\'re signed up! Redirecting to your course...',
    })
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Free signup error:', error)
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    )
  }
}
