/**
 * Test API: Send a nurture sequence email to a specific address
 * Usage: POST /api/test/send-nurture
 * Body: { email: string, day: number, name?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/resend-client'
import { SCAT_MASTERY_SEQUENCE } from '@/lib/email-sequences'

export async function POST(request: NextRequest) {
  try {
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

    // Generate HTML from template
    const recipientName = name || email.split('@')[0]
    const html = emailTemplate.template(
      recipientName,
      day <= 2 ? loginLink : upgradeLink
    )

    // Send email
    const success = await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html,
      tags: [
        { name: 'sequence', value: 'scat-mastery-test' },
        { name: 'day', value: String(day) },
      ],
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
