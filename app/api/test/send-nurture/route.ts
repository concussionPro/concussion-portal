/**
 * Test API: Send a nurture sequence email to a specific address
 * REQUIRES ADMIN_API_KEY header for security
 * Usage: POST /api/test/send-nurture
 * Headers: x-admin-key: <ADMIN_API_KEY>
 * Body: { email: string, day: number, name?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sendEmail } from '@/lib/resend-client'
import { SCAT_MASTERY_SEQUENCE } from '@/lib/email-sequences'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function POST(request: NextRequest) {
  try {
    // Require admin API key (timing-safe)
    const adminKey = request.headers.get('x-admin-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    if (!process.env.ADMIN_API_KEY || !adminKey || !timingSafeCompare(adminKey, process.env.ADMIN_API_KEY)) {
      return NextResponse.json({ error: 'Unauthorized — admin API key required' }, { status: 401 })
    }

    const { email, day, name } = await request.json()

    if (!email || typeof day !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: email and day' },
        { status: 400 }
      )
    }

    // Find the email template for the requested day
    const emailTemplate = SCAT_MASTERY_SEQUENCE.find(e => e.day === day)

    if (!emailTemplate) {
      return NextResponse.json(
        {
          error: `No email found for day ${day}`,
          availableDays: SCAT_MASTERY_SEQUENCE.map(e => e.day)
        },
        { status: 404 }
      )
    }

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const loginLink = `${baseUrl}/dashboard`
    const upgradeLink = `${baseUrl}/pricing`

    // Generate HTML from template with unsubscribe URL
    const recipientName = name || email.split('@')[0]
    const unsubToken = generateUnsubscribeToken(email)
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`
    const html = emailTemplate.template(
      recipientName,
      day <= 2 ? loginLink : upgradeLink
    ).replace('{{unsubscribe_url}}', unsubscribeUrl)

    // Send email
    const success = await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html,
      tags: [
        { name: 'sequence', value: 'scat-mastery-test' },
        { name: 'day', value: String(day) },
      ],
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Sent Day ${day} email to ${email}`,
        subject: emailTemplate.subject,
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}
